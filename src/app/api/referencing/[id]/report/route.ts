import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React, { type ReactElement } from 'react'
import ReferenceReportPDF from '@/components/pdf/ReferenceReportPDF'
import { sendEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST /api/referencing/[id]/report
// Generates the reference report PDF, saves it, emails agents + landlord
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const app = await prisma.tenantReferenceApplication.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          include: { user: true },
        },
        documents: true,
      },
    })

    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!app.affordabilityScore) {
      return NextResponse.json({ error: 'Calculate affordability score first' }, { status: 400 })
    }

    // Fetch property via enquiry → offer
    let propertyAddress = 'Property not specified'
    let proposedRent = app.monthlyRentTarget ?? 0
    let landlordEmail: string | null = null
    let landlordName: string | null = null

    if (app.enquiryId) {
      const enquiry = await prisma.enquiry.findUnique({
        where: { id: app.enquiryId },
        include: {
          property: {
            include: { landlord: { include: { user: true } } },
          },
          offer: true,
        },
      })
      if (enquiry?.property) {
        propertyAddress = `${enquiry.property.addressLine1}, ${enquiry.property.area}, ${enquiry.property.postcode}`
        landlordEmail = enquiry.property.landlord.user.email
        landlordName = `${enquiry.property.landlord.firstName} ${enquiry.property.landlord.lastName}`
      }
      if (enquiry?.offer) {
        proposedRent = enquiry.offer.proposedRent
      }
    }

    const breakdown = app.scoreBreakdown ? JSON.parse(app.scoreBreakdown) : {}
    const generatedAt = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    const reportData = {
      applicantName: `${app.tenant.firstName} ${app.tenant.lastName}`,
      applicantEmail: app.tenant.user.email,
      propertyAddress,
      proposedRent,
      affordabilityScore: app.affordabilityScore,
      affordabilityPass: app.affordabilityPass,
      status: app.status,
      agentNotes: app.agentNotes,
      scoreBreakdown: breakdown,
      employerName: app.employerName,
      jobTitle: app.jobTitle,
      contractType: app.contractType,
      annualSalary: app.annualSalary,
      employerConfirmed: app.employerConfirmed,
      employerConfirmedSalary: app.employerConfirmedSalary,
      employerNotes: app.employerNotes,
      prevPropertyAddress: app.prevPropertyAddress,
      prevLandlordRating: app.prevLandlordRating,
      prevLandlordArrears: app.prevLandlordArrears,
      prevLandlordNotes: app.prevLandlordNotes,
      prevLandlordConfirmed: app.prevLandlordConfirmed,
      documents: app.documents,
      generatedAt,
    }

    // Generate PDF buffer
    const buffer = await renderToBuffer(React.createElement(ReferenceReportPDF, { data: reportData }) as ReactElement<DocumentProps>)

    // Upload to Supabase storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const filename = `ref-${params.id}.pdf`
    const storagePath = `reports/${filename}`
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(storagePath)
    const reportUrl = urlData.publicUrl

    // Update application with reportUrl and UNDER_REVIEW status
    await prisma.tenantReferenceApplication.update({
      where: { id: params.id },
      data: {
        reportUrl,
        status: 'UNDER_REVIEW',
        landlordApprovalStatus: landlordEmail ? 'PENDING' : null,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'

    // Email all agents
    const agents = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
      select: { email: true, name: true },
    })

    const scoreColor = app.affordabilityScore >= 70 ? '#16a34a' : app.affordabilityScore >= 50 ? '#d97706' : '#dc2626'

    const agentHtml = `
      <h1>Reference Report Ready</h1>
      <p>The reference report for <strong>${reportData.applicantName}</strong> has been generated and is ready for review.</p>
      <div class="alert-box">
        <div class="detail-row"><span class="detail-label">Applicant</span><span class="detail-value">${reportData.applicantName}</span></div>
        <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
        <div class="detail-row"><span class="detail-label">Score</span><span class="detail-value" style="font-weight:700;font-size:18px;color:${scoreColor};">${app.affordabilityScore}/100</span></div>
        <div class="detail-row"><span class="detail-label">Outcome</span><span class="detail-value" style="color:${scoreColor};font-weight:700;">${app.status}</span></div>
      </div>
      ${landlordEmail ? '<p>The report has also been sent to the landlord for approval.</p>' : ''}
      <p style="margin:24px 0;">
        <a href="${baseUrl}/dashboard/referencing/${params.id}" class="btn">View Full Application →</a>
      </p>
    `

    for (const agent of agents) {
      await sendEmail({
        to: agent.email,
        subject: `Reference report ready: ${reportData.applicantName} — Score ${app.affordabilityScore}/100`,
        html: agentHtml,
      }).catch(() => {})
    }

    // Email landlord with approval link (token-protected)
    if (landlordEmail) {
      const token = jwt.sign(
        { applicationId: params.id, action: 'landlord-approval' },
        process.env.NEXTAUTH_SECRET ?? 'secret',
        { expiresIn: '14d' }
      )
      const approvalBaseUrl = `${baseUrl}/portal/landlord/referencing/${params.id}`
      const approveUrl = `${approvalBaseUrl}?token=${token}&decision=APPROVED`
      const declineUrl = `${approvalBaseUrl}?token=${token}&decision=DECLINED`
      const modifyUrl = `${approvalBaseUrl}?token=${token}`

      const landlordHtml = `
        <h1>Reference Report for Your Approval</h1>
        <p>Dear ${landlordName},</p>
        <p>Central Gate Estates has completed the referencing process for a prospective tenant for your property. Please review the report and indicate your decision below.</p>
        <div class="alert-box">
          <div class="detail-row"><span class="detail-label">Applicant</span><span class="detail-value">${reportData.applicantName}</span></div>
          <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
          <div class="detail-row"><span class="detail-label">Affordability Score</span><span class="detail-value" style="font-weight:700;color:${scoreColor};">${app.affordabilityScore}/100</span></div>
          <div class="detail-row"><span class="detail-label">Overall Outcome</span><span class="detail-value" style="font-weight:700;color:${scoreColor};">${app.status}</span></div>
        </div>
        <p>Please click one of the buttons below to indicate your decision:</p>
        <p style="margin:16px 0;">
          <a href="${approveUrl}" class="btn" style="background:#16a34a;">✓ Approve Tenant</a>
        </p>
        <p style="margin:16px 0;">
          <a href="${declineUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">✗ Decline Tenant</a>
        </p>
        <p style="margin:16px 0;">
          <a href="${modifyUrl}" style="display:inline-block;background:#f5f2ee;color:#1a1a1a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">✎ Request Modification</a>
        </p>
        <p style="font-size:13px;color:#737373;">If you have any questions before making your decision, please contact us at <a href="mailto:hello@centralgateestates.com">hello@centralgateestates.com</a> or via WhatsApp.</p>
      `

      await sendEmail({
        to: landlordEmail,
        subject: `Action required: Reference report for ${reportData.applicantName} — ${propertyAddress}`,
        html: landlordHtml,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, reportUrl })
  } catch (err) {
    console.error('POST /api/referencing/[id]/report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
