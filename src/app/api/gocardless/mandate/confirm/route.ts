import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGoCardlessClient } from '@/lib/gocardless'

/**
 * GET /api/gocardless/mandate/confirm?redirect_flow_id=...
 *
 * GoCardless calls this URL after the tenant completes bank authorisation.
 * We complete the redirect flow, save the customer + mandate IDs to the tenant,
 * then redirect the admin back to the tenant's dashboard page.
 *
 * The session_token we passed when creating the flow is the tenantId.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const redirectFlowId = searchParams.get('redirect_flow_id')

  if (!redirectFlowId) {
    return NextResponse.redirect(new URL('/dashboard/tenants?gc_error=missing_flow_id', req.url))
  }

  // Find tenant by redirect flow id
  const tenant = await prisma.tenant.findFirst({
    where: { gcRedirectFlowId: redirectFlowId },
  })

  if (!tenant) {
    return NextResponse.redirect(new URL('/dashboard/tenants?gc_error=flow_not_found', req.url))
  }

  try {
    const gc = getGoCardlessClient()

    // Complete the redirect flow (session_token must match what was passed on create)
    const flow = await gc.redirectFlows.complete(redirectFlowId, {
      session_token: tenant.id,
    })

    // Save customer and mandate IDs — clear the temp flow ID
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        gcCustomerId: flow.links?.customer ?? null,
        gcMandateId: flow.links?.mandate ?? null,
        gcMandateStatus: 'pending_submission', // GoCardless will update via webhook
        gcRedirectFlowId: null,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    return NextResponse.redirect(
      new URL(`/dashboard/tenants/${tenant.id}?gc_success=mandate_setup`, appUrl)
    )
  } catch (err) {
    console.error('[GC mandate confirm]', err)
    return NextResponse.redirect(
      new URL(`/dashboard/tenants/${tenant.id}?gc_error=complete_failed`, process.env.NEXT_PUBLIC_APP_URL ?? req.url)
    )
  }
}
