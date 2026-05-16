import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoCardlessClient } from '@/lib/gocardless'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/payment-requests/[id]
 * Agent/Admin cancels a payment request
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const pr = await prisma.paymentRequest.findUnique({ where: { id: params.id } })
  if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (pr.status === 'PAID') {
    return NextResponse.json({ error: 'Cannot cancel a paid payment request' }, { status: 400 })
  }

  // Cancel in GoCardless if a billing request exists and is still pending
  if (pr.gcBillingRequestId && pr.status === 'PENDING') {
    try {
      const gc = getGoCardlessClient()
      await gc.billingRequests.cancel(pr.gcBillingRequestId, {})
    } catch (err) {
      // GC may already have expired it — log and continue
      console.warn('[payment-requests] GC cancel failed (may already be expired):', err)
    }
  }

  const updated = await prisma.paymentRequest.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json(updated)
}
