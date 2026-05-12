import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_IDENTITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_IDENTITY_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const session = event.data.object as Stripe.Identity.VerificationSession
  const applicationId = session.metadata?.applicationId
  if (!applicationId) return NextResponse.json({ ok: true })

  if (event.type === 'identity.verification_session.verified') {
    const outputs = session.verified_outputs
    const idVerifiedName = [outputs?.first_name, outputs?.last_name].filter(Boolean).join(' ') || null
    const idVerifiedDob = outputs?.dob
      ? `${outputs.dob.year}-${String(outputs.dob.month).padStart(2, '0')}-${String(outputs.dob.day).padStart(2, '0')}`
      : null

    const app = await prisma.tenantReferenceApplication.update({
      where: { id: applicationId },
      data: {
        idVerificationStatus: 'VERIFIED',
        idVerifiedName,
        idVerifiedDob,
        idVerifiedAt: new Date(),
      },
      include: { tenant: { select: { firstName: true, lastName: true, dob: true } } },
    })

    // Flag name/DOB mismatches in agent notes
    const mismatches: string[] = []
    if (idVerifiedName && app.tenant) {
      const declared = `${app.tenant.firstName} ${app.tenant.lastName}`.toLowerCase()
      const verified = idVerifiedName.toLowerCase()
      const allMatch = declared.split(' ').every((w) => verified.includes(w))
      if (!allMatch) mismatches.push(`Name mismatch — declared: "${app.tenant.firstName} ${app.tenant.lastName}", verified: "${idVerifiedName}"`)
    }
    if (idVerifiedDob && app.tenant?.dob) {
      const declaredDob = new Date(app.tenant.dob).toISOString().split('T')[0]
      if (declaredDob !== idVerifiedDob) mismatches.push(`DOB mismatch — declared: ${declaredDob}, verified: ${idVerifiedDob}`)
    }

    if (mismatches.length > 0) {
      const mismatchNote = `⚠️ Identity verification mismatch: ${mismatches.join('; ')}`
      await prisma.tenantReferenceApplication.update({
        where: { id: applicationId },
        data: { agentNotes: app.agentNotes ? `${app.agentNotes}\n\n${mismatchNote}` : mismatchNote },
      })
    }

    // Notify agents
    const agents = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
      select: { id: true },
    })
    await Promise.all(agents.map((agent) =>
      prisma.notification.create({
        data: {
          userId: agent.id,
          type: 'GENERAL',
          title: `Identity verified${mismatches.length > 0 ? ' ⚠️ mismatch' : ''} — ${app.tenant?.firstName ?? ''}`,
          message: mismatches.length > 0 ? mismatches[0] : `Identity verified successfully via Stripe. Name: ${idVerifiedName}`,
          link: `/dashboard/referencing/${applicationId}`,
        },
      })
    ))
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const reason = (session.last_error as { reason?: string } | null)?.reason ?? 'unknown'
    await prisma.tenantReferenceApplication.update({
      where: { id: applicationId },
      data: { idVerificationStatus: 'REQUIRES_INPUT', idVerificationFailReason: reason },
    })
  }

  if (event.type === 'identity.verification_session.canceled') {
    await prisma.tenantReferenceApplication.update({
      where: { id: applicationId },
      data: { idVerificationStatus: 'NOT_STARTED', idVerificationSessionId: null },
    })
  }

  return NextResponse.json({ ok: true })
}
