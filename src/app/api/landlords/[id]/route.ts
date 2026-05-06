import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const landlord = await prisma.landlord.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      properties: {
        include: {
          listing: true,
          tenancies: {
            where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
            include: { tenants: { include: { tenant: { include: { user: true } } } } },
            take: 1,
          },
        },
      },
      statements: { orderBy: { periodStart: 'desc' } },
      fees: { orderBy: { createdAt: 'desc' } },
      notesList: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!landlord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mask bank details
  const masked = {
    ...landlord,
    bankSortCode: landlord.bankSortCode ? '**-**-' + landlord.bankSortCode.slice(-2) : null,
    bankAccountNumber: landlord.bankAccountNumber ? '****' + landlord.bankAccountNumber.slice(-4) : null,
  }

  return NextResponse.json(masked)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const landlord = await prisma.landlord.update({
      where: { id: params.id },
      data: body,
      include: { user: true },
    })
    return NextResponse.json(landlord)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update landlord' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: params.id } })
    if (!landlord) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.user.update({ where: { id: landlord.userId }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete landlord' }, { status: 500 })
  }
}
