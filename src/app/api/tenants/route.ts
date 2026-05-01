import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const referencingStatus = searchParams.get('referencingStatus')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: Prisma.TenantWhereInput = {}
  if (referencingStatus) where.referencingStatus = referencingStatus as Prisma.EnumReferencingStatusFilter

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        user: true,
        tenancies: {
          include: { tenancy: { include: { property: true } } },
          take: 1,
          orderBy: { tenancy: { createdAt: 'desc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
  ])

  return NextResponse.json({ tenants, total, page, pageSize: limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      firstName, lastName, email, phone, dob, niNumber,
      employer, jobTitle, annualSalary, employerContact,
      referencingStatus, notes,
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash('changeme123', 10)

    const tenant = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: `${firstName} ${lastName}`,
          password: hashedPassword,
          role: 'TENANT',
          phone,
        },
      })

      return tx.tenant.create({
        data: {
          userId: user.id,
          firstName, lastName, phone, dob: dob ? new Date(dob) : null,
          niNumber, employer, jobTitle,
          annualSalary: annualSalary ? parseInt(annualSalary) : null,
          employerContact, referencingStatus: referencingStatus ?? 'NOT_STARTED',
          notes,
        },
        include: { user: true },
      })
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}
