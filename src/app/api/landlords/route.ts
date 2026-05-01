import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const [landlords, total] = await Promise.all([
    prisma.landlord.findMany({
      include: {
        user: true,
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.landlord.count(),
  ])

  return NextResponse.json({ landlords, total, page, pageSize: limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      firstName, lastName, email, phone, companyName,
      addressLine1, addressLine2, postcode, preferredContact,
      serviceLevel, ukResident, nrlSchemeRef, notes,
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const hashed = await bcrypt.hash('changeme123', 10)

    const landlord = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: `${firstName} ${lastName}`,
          password: hashed,
          role: 'LANDLORD',
          phone,
        },
      })
      return tx.landlord.create({
        data: {
          userId: user.id, firstName, lastName, companyName, phone,
          addressLine1, addressLine2, postcode,
          preferredContact: preferredContact ?? 'email',
          serviceLevel: serviceLevel ?? 'FULL_MANAGEMENT',
          ukResident: ukResident !== false,
          nrlSchemeRef, notes,
        },
        include: { user: true },
      })
    })

    return NextResponse.json(landlord, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create landlord' }, { status: 500 })
  }
}
