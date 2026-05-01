import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      landlord: { include: { user: true } },
      tenants: { include: { tenant: { include: { user: true } } } },
      guarantors: true,
      rentPayments: { orderBy: { dueDate: 'asc' } },
      documents: true,
      notesList: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!tenancy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tenancy)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { startDate, endDate, rentAmount, depositAmount, ...rest } = body

    const tenancy = await prisma.tenancy.update({
      where: { id: params.id },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(rentAmount !== undefined && { rentAmount: parseInt(rentAmount) }),
        ...(depositAmount !== undefined && { depositAmount: parseInt(depositAmount) }),
        ...rest,
      },
    })

    return NextResponse.json(tenancy)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update tenancy' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.tenancy.update({
    where: { id: params.id },
    data: { status: 'TERMINATED' },
  })

  return NextResponse.json({ success: true })
}
