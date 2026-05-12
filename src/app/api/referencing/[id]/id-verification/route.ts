import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Tenant or agent can initiate
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: { tenant: { include: { user: true } } },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Tenant can only initiate for their own application
  if (session.user.role === 'TENANT' && app.tenant.user.email !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  const verificationSession = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { applicationId: params.id, tenantId: app.tenantId },
    options: {
      document: {
        allowed_types: ['passport', 'driving_license', 'id_card'],
        require_matching_selfie: true,
      },
    },
    return_url: `${baseUrl}/portal/tenant/referencing?id_verification=complete`,
  })

  await prisma.tenantReferenceApplication.update({
    where: { id: params.id },
    data: {
      idVerificationStatus: 'PENDING',
      idVerificationSessionId: verificationSession.id,
    },
  })

  return NextResponse.json({ url: verificationSession.url })
}
