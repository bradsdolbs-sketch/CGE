import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoCardlessClient, toPence, GC_ACTIVE_MANDATE_STATUSES } from '@/lib/gocardless'
import { PaymentCurrency } from 'gocardless-nodejs/types/Types'

/**
 * POST /api/gocardless/collect
 * Body: { rentPaymentId: string }
 *
 * Creates a GoCardless payment for a specific RentPayment record.
 * Requires the tenant to have an active mandate.
 *
 * Returns: { gcPaymentId: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { rentPaymentId } = await req.json()
  if (!rentPaymentId) return NextResponse.json({ error: 'rentPaymentId is required' }, { status: 400 })

  // Load the rent payment and its associated tenant via tenancy
  const payment = await prisma.rentPayment.findUnique({
    where: { id: rentPaymentId },
    include: {
      tenancy: {
        include: {
          tenants: {
            include: { tenant: true },
            take: 1,
          },
        },
      },
    },
  })

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (payment.status === 'PAID' || payment.status === 'VOID') {
    return NextResponse.json({ error: 'Payment is already closed' }, { status: 400 })
  }
  if (payment.gcPaymentId) {
    return NextResponse.json({ error: 'GoCardless payment already created for this record' }, { status: 400 })
  }

  const tenant = payment.tenancy.tenants[0]?.tenant
  if (!tenant) return NextResponse.json({ error: 'No tenant on tenancy' }, { status: 400 })
  if (!tenant.gcMandateId) return NextResponse.json({ error: 'Tenant has no GoCardless mandate' }, { status: 400 })
  if (!GC_ACTIVE_MANDATE_STATUSES.includes(tenant.gcMandateStatus ?? '')) {
    return NextResponse.json(
      { error: `Mandate is not active (status: ${tenant.gcMandateStatus ?? 'none'})` },
      { status: 400 }
    )
  }

  const gc = getGoCardlessClient()

  const gcPayment = await gc.payments.create({
    amount: String(toPence(payment.amount)),
    currency: PaymentCurrency.GBP,
    description: `Rent — ${new Date(payment.dueDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
    links: { mandate: tenant.gcMandateId! },
  })

  // Mark as pending (webhook will confirm / fail later)
  await prisma.rentPayment.update({
    where: { id: rentPaymentId },
    data: {
      gcPaymentId: gcPayment.id,
      gcStatus: gcPayment.status,
      collectionMethod: 'GOCARDLESS',
    },
  })

  return NextResponse.json({ gcPaymentId: gcPayment.id, status: gcPayment.status })
}
