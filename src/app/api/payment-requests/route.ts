import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoCardlessClient } from '@/lib/gocardless'
import { sendPaymentRequestEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payment-requests
 * Agent/Admin creates a one-off payment request (GoCardless Instant Bank Pay)
 * Body: { tenantId?, tenancyId?, amount (pounds), description, type }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json()
  const { tenantId, tenancyId, amount, description, type } = body

  if (!amount || !description) {
    return NextResponse.json({ error: 'amount and description are required' }, { status: 400 })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number (in pounds)' }, { status: 400 })
  }

  // Generate reference: CGE-YYYY-NNNNN
  const year = new Date().getFullYear()
  const count = await prisma.paymentRequest.count()
  const reference = `CGE-${year}-${String(count + 1).padStart(5, '0')}`

  // Fetch tenant for notification / email
  const tenant = tenantId
    ? await prisma.tenant.findUnique({ where: { id: tenantId }, include: { user: true } })
    : null

  const gc = getGoCardlessClient()
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  // Create GoCardless billing request
  const billingRequest = await gc.billingRequests.create({
    payment_request: {
      amount: String(Math.round(amount * 100)), // pence, as string per GC SDK type
      currency: 'GBP',
      description,
    },
  })

  // Create billing request flow (hosted authorisation page)
  // Note: redirect_uri / exit_uri use a placeholder — we update them after we have the DB id.
  // GoCardless does not support updating flows, so we use the paymentRequest id from the DB insert
  // which we can predict via cuid. Instead we use the billing request ID as the pr= param.
  const flow = await gc.billingRequestFlows.create({
    links: { billing_request: billingRequest.id! },
    redirect_uri: `${appUrl}/portal/tenant/payments?pr=${billingRequest.id!}&status=complete`,
    exit_uri: `${appUrl}/portal/tenant/payments?pr=${billingRequest.id!}&status=cancelled`,
  })

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // Save to DB
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      tenantId: tenantId ?? null,
      tenancyId: tenancyId ?? null,
      amount: Math.round(amount * 100),
      description,
      type: type ?? 'ONE_OFF',
      reference,
      gcBillingRequestId: billingRequest.id!,
      gcBillingRequestFlowId: flow.id!,
      paymentUrl: flow.authorisation_url!,
      expiresAt,
    },
  })

  // Create in-app notification for tenant
  if (tenant?.user?.id) {
    await prisma.notification.create({
      data: {
        userId: tenant.user.id,
        type: 'GENERAL',
        title: 'Payment request received',
        message: `You have a payment request for ${description} — £${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (ref: ${reference})`,
        link: '/portal/tenant/payments',
      },
    })

    // Send email
    if (tenant.user.email) {
      try {
        await sendPaymentRequestEmail(
          tenant.user.email,
          `${tenant.firstName} ${tenant.lastName}`,
          description,
          Math.round(amount * 100),
          reference,
          flow.authorisation_url!,
          expiresAt,
        )
      } catch (err) {
        console.error('[payment-requests] Failed to send email:', err)
      }
    }
  }

  return NextResponse.json(paymentRequest, { status: 201 })
}

/**
 * GET /api/payment-requests
 * Agent/Admin: all requests
 * Tenant: own requests only
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (session.user.role === 'ADMIN' || session.user.role === 'AGENT') {
    const requests = await prisma.paymentRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { firstName: true, lastName: true, user: { select: { email: true } } } },
        tenancy: { select: { id: true } },
      },
    })
    return NextResponse.json(requests)
  }

  if (session.user.role === 'TENANT') {
    const tenant = await prisma.tenant.findUnique({ where: { userId: session.user.id } })
    if (!tenant) return NextResponse.json([])

    const requests = await prisma.paymentRequest.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
