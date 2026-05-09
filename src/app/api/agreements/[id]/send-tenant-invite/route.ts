import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST /api/agreements/[id]/send-tenant-invite
// Sends a signing invite to the tenant
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const agreement = await prisma.agreement.findUnique({ where: { id: params.id } })
  if (!agreement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let tenantEmail: string | null = null
  let tenantName = 'Tenant'
  let propertyAddress = ''

  if (agreement.enquiryId) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: agreement.enquiryId },
      include: {
        property: { select: { addressLine1: true, area: true } },
      },
    })

    if (enquiry?.property) {
      propertyAddress = `${enquiry.property.addressLine1}, ${enquiry.property.area}`
    }

    const refApp = await prisma.tenantReferenceApplication.findFirst({
      where: { enquiryId: agreement.enquiryId },
      include: { tenant: { include: { user: true } } },
    })

    if (refApp) {
      tenantEmail = refApp.tenant.user.email
      tenantName = `${refApp.tenant.firstName} ${refApp.tenant.lastName}`
    } else if (enquiry) {
      tenantEmail = enquiry.email
      tenantName = `${enquiry.firstName} ${enquiry.lastName}`
    }
  } else if (agreement.tenancyId) {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: agreement.tenancyId },
      include: {
        property: { select: { addressLine1: true, area: true } },
        tenants: {
          include: { tenant: { include: { user: true } } },
          where: { isPrimary: true },
        },
      },
    })
    if (tenancy) {
      propertyAddress = `${tenancy.property.addressLine1}, ${tenancy.property.area}`
      const primary = tenancy.tenants[0]?.tenant
      if (primary) {
        tenantEmail = primary.user.email
        tenantName = `${primary.firstName} ${primary.lastName}`
      }
    }
  }

  if (!tenantEmail) {
    return NextResponse.json({ error: 'No tenant email found' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'
  const token = jwt.sign(
    { agreementId: params.id, action: 'tenant-sign' },
    process.env.NEXTAUTH_SECRET ?? 'secret',
    { expiresIn: '14d' }
  )
  const signUrl = `${baseUrl}/portal/tenant/agreement/${params.id}?token=${token}`

  const html = `
    <h1>Please Sign Your Tenancy Agreement</h1>
    <p>Dear ${tenantName},</p>
    <p>Your Assured Shorthold Tenancy Agreement for <strong>${propertyAddress}</strong> is ready for your review and signature.</p>
    <div class="alert-box">
      <p style="margin:0;font-size:14px;">The agreement has been reviewed and approved by Central Gate Estates. Once you sign, the landlord will be asked to countersign.</p>
    </div>
    <p>To sign, click the button below. You will be able to read the full agreement before signing.</p>
    <p style="margin:24px 0;">
      <a href="${signUrl}" class="btn">Review &amp; Sign Agreement →</a>
    </p>
    <p style="font-size:13px;color:#737373;">Your electronic signature is legally binding under the Electronic Communications Act 2000. This link expires in 14 days. If you have any questions before signing, please contact us.</p>
  `

  await sendEmail({
    to: tenantEmail,
    subject: `Action required: Sign your tenancy agreement — ${propertyAddress}`,
    html,
  })

  return NextResponse.json({ success: true })
}
