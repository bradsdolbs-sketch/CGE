import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payment = await prisma.rentPayment.findUnique({
    where: { id: params.id },
    include: {
      tenancy: { include: { property: true, tenants: { include: { tenant: { include: { user: true } } } } } },
    },
  })

  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(payment)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { amountPaid, paidDate, status, reference, notes } = body

    const payment = await prisma.rentPayment.update({
      where: { id: params.id },
      data: {
        ...(amountPaid !== undefined && { amountPaid: parseInt(amountPaid) }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(status !== undefined && { status }),
        ...(reference !== undefined && { reference }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
