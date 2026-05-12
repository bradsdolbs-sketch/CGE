import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TENANT') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { applicationId } = await req.json() as { applicationId: string }
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  // Verify the application belongs to this tenant
  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: applicationId },
    include: { tenant: { include: { user: true } } },
  })
  if (!app || app.tenant.user.email !== session.user.email) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const clientId = process.env.TRUELAYER_CLIENT_ID
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Open banking not configured' }, { status: 503 })
  }

  // Build signed state JWT carrying applicationId for the callback
  const secret = new TextEncoder().encode(clientSecret)
  const state = await new SignJWT({ applicationId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)

  const redirectUri = `${baseUrl}/api/referencing/open-banking/callback`
  const isSandbox = process.env.TRUELAYER_SANDBOX === 'true'
  const authHost = isSandbox ? 'auth.truelayer-sandbox.com' : 'auth.truelayer.com'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'info accounts balance transactions offline_access',
    redirect_uri: redirectUri,
    providers: 'uk-ob-all uk-oauth-all',
    state,
  })

  await prisma.tenantReferenceApplication.update({
    where: { id: applicationId },
    data: { openBankingStatus: 'PENDING_AUTH' },
  })

  return NextResponse.json({ authUrl: `https://${authHost}/?${params}` })
}
