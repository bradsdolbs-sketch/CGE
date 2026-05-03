import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * POST /api/webhooks/gocardless
 *
 * Handles incoming GoCardless webhook events.
 * Verifies the HMAC-SHA256 signature using GC_WEBHOOK_SECRET.
 *
 * Events handled:
 *  payments.confirmed   → mark RentPayment PAID
 *  payments.paid_out    → update gcStatus (already PAID; informational)
 *  payments.failed      → update gcStatus, reopen RentPayment as LATE/PENDING
 *  payments.cancelled   → update gcStatus, clear gcPaymentId so re-collection is possible
 *  mandates.active      → update tenant gcMandateStatus
 *  mandates.cancelled   → update tenant gcMandateStatus
 *  mandates.failed      → update tenant gcMandateStatus
 *  mandates.expired     → update tenant gcMandateStatus
 *  mandates.reinstated  → update tenant gcMandateStatus → active
 */
export async function POST(req: NextRequest) {
  const secret = process.env.GC_WEBHOOK_SECRET
  if (!secret) {
    console.error('[GC webhook] GC_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('webhook-signature') ?? ''

  // Verify HMAC-SHA256 signature
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    console.warn('[GC webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 498 })
  }

  let body: { events: GCEvent[] }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  for (const event of body.events ?? []) {
    try {
      await handleEvent(event)
    } catch (err) {
      // Log but don't fail — GoCardless retries on non-2xx
      console.error(`[GC webhook] Error handling event ${event.id}:`, err)
    }
  }

  return NextResponse.json({ status: 'ok' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GCEvent {
  id: string
  resource_type: 'payments' | 'mandates' | 'refunds' | 'subscriptions' | 'payout_items' | 'payouts'
  action: string
  links: {
    payment?: string
    mandate?: string
  }
  details?: {
    cause?: string
    description?: string
    reason_code?: string
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleEvent(event: GCEvent) {
  switch (event.resource_type) {
    case 'payments':
      await handlePaymentEvent(event)
      break
    case 'mandates':
      await handleMandateEvent(event)
      break
    default:
      // Unhandled resource type — ignore silently
      break
  }
}

async function handlePaymentEvent(event: GCEvent) {
  const gcPaymentId = event.links.payment
  if (!gcPaymentId) return

  const rentPayment = await prisma.rentPayment.findFirst({
    where: { gcPaymentId },
  })

  if (!rentPayment) {
    console.warn(`[GC webhook] No RentPayment found for gcPaymentId ${gcPaymentId}`)
    return
  }

  switch (event.action) {
    case 'confirmed':
    case 'paid_out': {
      // Payment has cleared — mark as fully paid
      await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: {
          status: 'PAID',
          gcStatus: event.action,
          paidDate: new Date(),
          amountPaid: rentPayment.amount,
        },
      })
      break
    }

    case 'failed': {
      // Payment failed at the bank — reopen as LATE, keep gcPaymentId for audit trail
      await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: {
          gcStatus: 'failed',
          status: 'LATE',
        },
      })
      break
    }

    case 'cancelled': {
      // Payment was cancelled — clear gcPaymentId so admin can retry
      await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: {
          gcStatus: 'cancelled',
          gcPaymentId: null,
          collectionMethod: 'MANUAL',
          status: rentPayment.status === 'PAID' ? 'PAID' : 'PENDING',
        },
      })
      break
    }

    case 'charged_back': {
      await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: {
          gcStatus: 'charged_back',
          status: 'PENDING',
          paidDate: null,
          amountPaid: 0,
        },
      })
      break
    }

    case 'customer_approval_denied': {
      await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: { gcStatus: 'customer_approval_denied' },
      })
      break
    }

    default:
      // submitted, pending_submission — just update gcStatus
      await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: { gcStatus: event.action },
      })
      break
  }
}

async function handleMandateEvent(event: GCEvent) {
  const gcMandateId = event.links.mandate
  if (!gcMandateId) return

  const tenant = await prisma.tenant.findFirst({
    where: { gcMandateId },
  })

  if (!tenant) {
    console.warn(`[GC webhook] No Tenant found for gcMandateId ${gcMandateId}`)
    return
  }

  const statusMap: Record<string, string> = {
    active: 'active',
    cancelled: 'cancelled',
    failed: 'failed',
    expired: 'expired',
    reinstated: 'active',
    submitted: 'submitted',
    pending_submission: 'pending_submission',
    pending_customer_approval: 'pending_customer_approval',
    consumed: 'consumed',
  }

  const newStatus = statusMap[event.action] ?? event.action

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { gcMandateStatus: newStatus },
  })
}
