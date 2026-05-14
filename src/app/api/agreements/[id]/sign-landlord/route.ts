import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React, { type ReactElement } from 'react'
import ASTDraftPDF, { ASTData } from '@/components/pdf/ASTDraftPDF'
import { sendEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { addMonths, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { signedName, token } = body

  if (!signedName?.trim()) {
    return NextResponse.json({ error: 'Signed name is required' }, { status: 400 })
  }

  // Auth: either session OR token
  const session = await getServerSession(authOptions)
  if (!session && !token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET ?? 'secret') as {
        agreementId: string; action: string
      }
      if (payload.agreementId !== params.id || payload.action !== 'landlord-sign') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Expired or invalid token' }, { status: 401 })
    }
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

  const agreement = await prisma.agreement.findUnique({ where: { id: params.id } })
  if (!agreement) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (agreement.landlordSignedAt) {
    return NextResponse.json({ error: 'Already signed by landlord' }, { status: 409 })
  }

  const landlordSignedAt = new Date()

  // Mark landlord signed
  await prisma.agreement.update({
    where: { id: params.id },
    data: {
      landlordSignedName: signedName.trim(),
      landlordSignedAt,
      landlordSignedIp: ip,
      status: 'FULLY_SIGNED',
    },
  })

  // Regenerate PDF with both signatures
  let tenantName = agreement.tenantSignedName ?? 'Tenant'
  let tenantEmail = ''
  let landlordName = signedName
  let landlordAddress = ''
  let propertyAddress = ''
  let propertyPostcode = ''
  let startDate: Date = new Date()
  let rentAmount = 0
  let rentFrequency = 'month'
  let depositAmount = 0
  let depositScheme = 'TDS'
  let tenancyTerm = 12
  let specialConditions: string | null = null
  let landlordEmail: string | null = null
  const tenantSignedAtStr = agreement.tenantSignedAt
    ? format(new Date(agreement.tenantSignedAt), 'd MMMM yyyy HH:mm')
    : ''
  const landlordSignedAtStr = format(landlordSignedAt, 'd MMMM yyyy HH:mm')
  const agreementRef = agreement.draftUrl.split('/').pop()?.replace('ast-', '').replace('.pdf', '').toUpperCase() ?? 'REF'

  if (agreement.enquiryId) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: agreement.enquiryId },
      include: {
        offer: true,
        property: {
          include: { landlord: { include: { user: true } } },
        },
      },
    })
    if (enquiry?.property) {
      const p = enquiry.property
      const ll = p.landlord
      propertyAddress = `${p.addressLine1}${p.addressLine2 ? `, ${p.addressLine2}` : ''}, ${p.area}, ${p.town}`
      propertyPostcode = p.postcode
      landlordAddress = [ll.addressLine1, ll.addressLine2, ll.postcode].filter(Boolean).join(', ')
      landlordEmail = ll.user.email
    }
    if (enquiry?.offer) {
      startDate = enquiry.offer.startDate
      tenancyTerm = enquiry.offer.tenancyTerm
      rentAmount = enquiry.offer.proposedRent
      depositAmount = enquiry.offer.depositAmount
      depositScheme = enquiry.offer.depositScheme
      specialConditions = enquiry.offer.specialConditions
    }

    // Get tenant email from referencing app
    const refApp = await prisma.tenantReferenceApplication.findFirst({
      where: { enquiryId: agreement.enquiryId },
      include: { tenant: { include: { user: true } } },
    })
    if (refApp) tenantEmail = refApp.tenant.user.email

    // Update enquiry stage to LET_AGREED
    await prisma.enquiry.update({
      where: { id: agreement.enquiryId },
      data: { stage: 'LET_AGREED' },
    })
  } else if (agreement.tenancyId) {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: agreement.tenancyId },
      include: {
        property: true,
        landlord: { include: { user: true } },
        tenants: {
          include: { tenant: { include: { user: true } } },
          where: { isPrimary: true },
        },
      },
    })
    if (tenancy) {
      const p = tenancy.property
      const ll = tenancy.landlord
      propertyAddress = `${p.addressLine1}${p.addressLine2 ? `, ${p.addressLine2}` : ''}, ${p.area}, ${p.town}`
      propertyPostcode = p.postcode
      landlordAddress = [ll.addressLine1, ll.addressLine2, ll.postcode].filter(Boolean).join(', ')
      landlordEmail = ll.user.email
      startDate = tenancy.startDate
      rentAmount = tenancy.rentAmount
      rentFrequency = tenancy.rentFrequency
      depositAmount = tenancy.depositAmount
      depositScheme = tenancy.depositScheme ?? 'TDS'
      tenancyTerm = Math.round((tenancy.endDate.getTime() - tenancy.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const primaryTenant = tenancy.tenants[0]?.tenant
      if (primaryTenant) tenantEmail = primaryTenant.user.email
    }
  }

  const endDate = addMonths(startDate, tenancyTerm)

  const finalASTData: ASTData = {
    tenantName,
    tenantEmail,
    landlordName,
    landlordAddress,
    agentName: 'Central Gate Estates Ltd',
    propertyAddress,
    propertyPostcode,
    startDate: format(startDate, 'd MMMM yyyy'),
    endDate: format(endDate, 'd MMMM yyyy'),
    rentAmount,
    rentFrequency,
    depositAmount,
    depositScheme,
    tenancyTerm,
    specialConditions,
    tenantSignedName: tenantName,
    tenantSignedAt: tenantSignedAtStr,
    landlordSignedName: signedName,
    landlordSignedAt: landlordSignedAtStr,
    preparedDate: format(new Date(), 'd MMMM yyyy'),
    agreementRef,
    isDraft: false,
  }

  // Generate final signed PDF
  const buffer = await renderToBuffer(React.createElement(ASTDraftPDF, { data: finalASTData }) as ReactElement<DocumentProps>)

  // Upload to Supabase storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const filename = `ast-${agreementRef.toLowerCase()}-signed.pdf`
  const storagePath = `agreements/${filename}`
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })
  if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`)

  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(storagePath)
  const finalUrl = urlData.publicUrl

  // Save final URL
  const finalAgreement = await prisma.agreement.update({
    where: { id: params.id },
    data: { finalUrl },
  })

  // Email both parties the final signed PDF
  const signedEmailHtml = (recipientName: string) => `
    <h1>Tenancy Agreement — Fully Signed</h1>
    <p>Dear ${recipientName},</p>
    <p>Your Assured Shorthold Tenancy Agreement is now fully executed. Both parties have signed.</p>
    <div class="alert-box">
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
      <div class="detail-row"><span class="detail-label">Tenant</span><span class="detail-value">${tenantName}</span></div>
      <div class="detail-row"><span class="detail-label">Landlord</span><span class="detail-value">${landlordName}</span></div>
      <div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">${format(startDate, 'd MMMM yyyy')}</span></div>
      <div class="detail-row"><span class="detail-label">Monthly Rent</span><span class="detail-value">£${rentAmount.toLocaleString()} pcm</span></div>
    </div>
    <p>The fully signed agreement is available to download below. Please retain this for your records.</p>
    <p style="margin:24px 0;">
      <a href="${finalUrl}" class="btn">Download Signed Agreement (PDF)</a>
    </p>
    <p style="font-size:13px;color:#737373;">This agreement is legally binding under the Electronic Communications Act 2000. If you have any questions, please contact Central Gate Estates.</p>
  `

  if (tenantEmail) {
    await sendEmail({
      to: tenantEmail,
      subject: `Your tenancy agreement is fully signed — ${propertyAddress}`,
      html: signedEmailHtml(tenantName),
    }).catch(() => {})
  }

  if (landlordEmail) {
    await sendEmail({
      to: landlordEmail,
      subject: `Tenancy agreement fully signed — ${propertyAddress}`,
      html: signedEmailHtml(landlordName),
    }).catch(() => {})
  }

  // Notify agents
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true },
  })
  for (const agent of agents) {
    await prisma.notification.create({
      data: {
        userId: agent.id,
        type: 'GENERAL',
        title: `Agreement fully signed: ${tenantName} — ${propertyAddress}`,
        message: 'Both parties have signed. The final agreement has been emailed to tenant and landlord.',
        link: `/dashboard/agreements/${params.id}`,
      },
    })
  }

  return NextResponse.json({ success: true, agreement: finalAgreement, finalUrl })
}
