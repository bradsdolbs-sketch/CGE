import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST /api/referencing/[id]/landlord-decision
// Called from landlord portal — decision: APPROVED | DECLINED | MODIFICATION_REQUESTED
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decision, note, token } = await req.json()

    if (!['APPROVED', 'DECLINED', 'MODIFICATION_REQUESTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    // Verify JWT token
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })
    try {
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET ?? 'secret') as {
        applicationId: string
        action: string
      }
      if (payload.applicationId !== params.id || payload.action !== 'landlord-approval') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Expired or invalid token' }, { status: 401 })
    }

    const app = await prisma.tenantReferenceApplication.findUnique({
      where: { id: params.id },
      include: {
        tenant: { include: { user: true } },
      },
    })
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Update application
    await prisma.tenantReferenceApplication.update({
      where: { id: params.id },
      data: {
        landlordApprovalStatus: decision,
        landlordApprovalNote: note ?? null,
        landlordApprovalAt: new Date(),
        ...(decision === 'DECLINED' && { status: 'FAILED' }),
      },
    })

    // Notify agents
    const agents = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
      select: { id: true, email: true, name: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'
    const tenantName = `${app.tenant.firstName} ${app.tenant.lastName}`

    const decisionLabels: Record<string, string> = {
      APPROVED: '✓ Approved',
      DECLINED: '✗ Declined',
      MODIFICATION_REQUESTED: '✎ Modification Requested',
    }
    const decisionColors: Record<string, string> = {
      APPROVED: '#16a34a',
      DECLINED: '#dc2626',
      MODIFICATION_REQUESTED: '#d97706',
    }

    const agentHtml = `
      <h1>Landlord Reference Decision</h1>
      <p>The landlord has made a decision on the reference application for <strong>${tenantName}</strong>.</p>
      <div class="alert-box" style="border-left-color:${decisionColors[decision]};">
        <div class="detail-row"><span class="detail-label">Applicant</span><span class="detail-value">${tenantName}</span></div>
        <div class="detail-row"><span class="detail-label">Decision</span><span class="detail-value" style="font-weight:700;color:${decisionColors[decision]};">${decisionLabels[decision]}</span></div>
        ${note ? `<div class="detail-row"><span class="detail-label">Landlord Note</span><span class="detail-value">${note}</span></div>` : ''}
      </div>
      ${decision === 'APPROVED' ? '<p>You can now proceed to generate the tenancy agreement draft.</p>' : ''}
      ${decision === 'MODIFICATION_REQUESTED' ? '<p>Please review the landlord\'s note and update the application accordingly.</p>' : ''}
      <p style="margin:24px 0;">
        <a href="${baseUrl}/dashboard/referencing/${params.id}" class="btn">View Application →</a>
      </p>
    `

    for (const agent of agents) {
      // Create notification
      await prisma.notification.create({
        data: {
          userId: agent.id,
          type: 'GENERAL',
          title: `Landlord decision: ${decisionLabels[decision]} — ${tenantName}`,
          message: note ?? `Landlord has ${decision.toLowerCase().replace('_', ' ')} the reference for ${tenantName}.`,
          link: `/dashboard/referencing/${params.id}`,
        },
      })

      await sendEmail({
        to: agent.email,
        subject: `Landlord decision on reference: ${tenantName} — ${decisionLabels[decision]}`,
        html: agentHtml,
      }).catch(() => {})
    }

    // If DECLINED, email the tenant
    if (decision === 'DECLINED') {
      const tenantEmail = app.tenant.user.email
      const tenantHtml = `
        <h1>Application Update</h1>
        <p>Dear ${tenantName},</p>
        <p>Thank you for completing the referencing process with Central Gate Estates.</p>
        <p>After careful consideration, we regret to inform you that your application for the property was not successful at this time.</p>
        <p>If you have any questions, please don't hesitate to contact us — we would be happy to discuss alternative properties that may be a good fit for you.</p>
        <p style="margin:24px 0;">
          <a href="https://wa.link/gy7gtr" class="btn">Contact Us on WhatsApp</a>
        </p>
      `
      await sendEmail({
        to: tenantEmail,
        subject: 'Your rental application — update from Central Gate Estates',
        html: tenantHtml,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, decision })
  } catch (err) {
    console.error('POST /api/referencing/[id]/landlord-decision error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
