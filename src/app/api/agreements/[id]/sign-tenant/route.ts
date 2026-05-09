import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { signedName, token } = body

  if (!signedName?.trim()) {
    return NextResponse.json({ error: 'Signed name is required' }, { status: 400 })
  }

  // Auth: either session (tenant portal) OR token
  const session = await getServerSession(authOptions)
  if (!session && !token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET ?? 'secret') as {
        agreementId: string; action: string
      }
      if (payload.agreementId !== params.id || payload.action !== 'tenant-sign') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Expired or invalid token' }, { status: 401 })
    }
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

  const agreement = await prisma.agreement.findUnique({ where: { id: params.id } })
  if (!agreement) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (agreement.tenantSignedAt) {
    return NextResponse.json({ error: 'Already signed by tenant' }, { status: 409 })
  }

  // Update agreement
  const updated = await prisma.agreement.update({
    where: { id: params.id },
    data: {
      tenantSignedName: signedName.trim(),
      tenantSignedAt: new Date(),
      tenantSignedIp: ip,
      status: 'PENDING_LANDLORD_SIGNATURE',
    },
  })

  // Notify agents + send landlord signing link
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true, email: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'

  for (const agent of agents) {
    await prisma.notification.create({
      data: {
        userId: agent.id,
        type: 'GENERAL',
        title: `Tenant signed agreement: ${signedName}`,
        message: 'The tenant has signed the tenancy agreement. The landlord has been notified to sign.',
        link: `/dashboard/agreements/${params.id}`,
      },
    })
  }

  // Get landlord email from enquiry or tenancy
  let landlordEmail: string | null = null
  let landlordName: string | null = null
  let tenantName = signedName

  if (agreement.enquiryId) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: agreement.enquiryId },
      include: { property: { include: { landlord: { include: { user: true } } } } },
    })
    if (enquiry?.property) {
      landlordEmail = enquiry.property.landlord.user.email
      landlordName = `${enquiry.property.landlord.firstName} ${enquiry.property.landlord.lastName}`
    }
  } else if (agreement.tenancyId) {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: agreement.tenancyId },
      include: { landlord: { include: { user: true } } },
    })
    if (tenancy) {
      landlordEmail = tenancy.landlord.user.email
      landlordName = `${tenancy.landlord.firstName} ${tenancy.landlord.lastName}`
    }
  }

  if (landlordEmail) {
    const landlordToken = jwt.sign(
      { agreementId: params.id, action: 'landlord-sign' },
      process.env.NEXTAUTH_SECRET ?? 'secret',
      { expiresIn: '14d' }
    )
    const signUrl = `${baseUrl}/portal/landlord/agreement/${params.id}?token=${landlordToken}`

    const html = `
      <h1>Please Sign the Tenancy Agreement</h1>
      <p>Dear ${landlordName},</p>
      <p>The tenant <strong>${tenantName}</strong> has signed the Assured Shorthold Tenancy Agreement. The agreement is now awaiting your signature to become legally binding.</p>
      <div class="alert-box">
        <div class="detail-row"><span class="detail-label">Tenant</span><span class="detail-value">${tenantName}</span></div>
        <div class="detail-row"><span class="detail-label">Tenant signed</span><span class="detail-value">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      </div>
      <p>Please click the button below to review and sign the agreement. This link expires in 14 days.</p>
      <p style="margin:24px 0;">
        <a href="${signUrl}" class="btn">Review &amp; Sign Agreement →</a>
      </p>
      <p style="font-size:13px;color:#737373;">Your signature is legally binding under the Electronic Communications Act 2000. If you have any questions, please contact us before signing.</p>
    `

    await sendEmail({
      to: landlordEmail,
      subject: `Action required: Please sign the tenancy agreement — ${tenantName}`,
      html,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, agreement: updated })
}
