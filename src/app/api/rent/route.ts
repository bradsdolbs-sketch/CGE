import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRentReceipt } from '@/lib/email'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const tenancyId = searchParams.get('tenancyId')
  const status = searchParams.get('status')
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const where: Prisma.RentPaymentWhereInput = {}
  if (tenancyId) where.tenancyId = tenancyId
  if (status) where.status = status as Prisma.EnumPaymentStatusFilter

  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1)
    const end = new Date(parseInt(year), parseInt(month), 0)
    where.dueDate = { gte: start, lte: end }
  } else if (year) {
    const start = new Date(parseInt(year), 0, 1)
    const end = new Date(parseInt(year), 11, 31)
    where.dueDate = { gte: start, lte: end }
  }

  const payments = await prisma.rentPayment.findMany({
    where,
    include: {
      tenancy: {
        include: {
          property: true,
          tenants: { include: { tenant: { include: { user: true } } } },
        },
      },
    },
    orderBy: { dueDate: 'desc' },
  })

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { paymentId, amountPaid, paidDate, reference } = body

    if (!paymentId || !amountPaid || !paidDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      include: {
        tenancy: {
          include: {
            tenants: { include: { tenant: { include: { user: true } } } },
          },
        },
      },
    })

    if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    const paid = parseInt(amountPaid)
    const status = paid >= existing.amount ? 'PAID' : 'PARTIAL'

    const payment = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: {
        amountPaid: paid,
        paidDate: new Date(paidDate),
        status,
        reference,
      },
    })

    // Send receipt to primary tenant
    try {
      const primaryTenant = existing.tenancy.tenants.find((tt) => tt.isPrimary) ?? existing.tenancy.tenants[0]
      if (primaryTenant) {
        await sendRentReceipt(payment, existing.tenancy, primaryTenant.tenant.user.email)
      }
    } catch (emailErr) {
      console.error('Failed to send rent receipt:', emailErr)
    }

    return NextResponse.json(payment)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to mark payment' }, { status: 500 })
  }
}
