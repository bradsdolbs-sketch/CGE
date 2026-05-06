import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoCardlessClient } from '@/lib/gocardless'

/**
 * POST /api/gocardless/mandate
 * Body: { tenantId: string }
 *
 * Creates a GoCardless redirect flow for setting up a Direct Debit mandate.
 * The tenant is redirected to GoCardless to authorise their bank, then
 * GoCardless redirects back to /api/gocardless/mandate/confirm.
 *
 * Returns: { redirectUrl: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { tenantId } = await req.json()
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { user: true },
  })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const gc = getGoCardlessClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const flow = await gc.redirectFlows.create({
    description: 'Central Gate Estates — Direct Debit',
    session_token: tenant.id, // matched on confirm
    success_redirect_url: `${appUrl}/api/gocardless/mandate/confirm`,
    prefilled_customer: {
      email: tenant.user.email ?? undefined,
      given_name: tenant.firstName ?? undefined,
      family_name: tenant.lastName ?? undefined,
    },
  })

  // Persist redirect flow ID so we can confirm it later
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { gcRedirectFlowId: flow.id },
  })

  return NextResponse.json({ redirectUrl: flow.redirect_url })
}
