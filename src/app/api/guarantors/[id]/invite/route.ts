import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendGuarantorInviteEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const guarantor = await prisma.guarantor.findUnique({
    where: { id: params.id },
    include: {
      tenancy: {
        include: {
          tenants: { include: { tenant: { select: { firstName: true, lastName: true } } }, where: { isPrimary: true }, take: 1 },
          property: { select: { addressLine1: true, addressLine2: true } },
        },
      },
    },
  })
  if (!guarantor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!guarantor.email) return NextResponse.json({ error: 'Guarantor has no email address' }, { status: 400 })

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

  await prisma.guarantor.update({
    where: { id: params.id },
    data: {
      portalToken: token,
      portalTokenExpiry: expiry,
      guarantorInvitedAt: new Date(),
      guarantorRefStatus: 'PENDING_SUBMISSION',
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const portalUrl = `${baseUrl}/portal/guarantor/${params.id}?token=${token}`

  const primaryTenant = guarantor.tenancy.tenants[0]?.tenant
  const tenantName = primaryTenant ? `${primaryTenant.firstName} ${primaryTenant.lastName}` : 'the tenant'
  const prop = guarantor.tenancy.property
  const propertyAddress = prop ? [prop.addressLine1, prop.addressLine2].filter(Boolean).join(', ') : 'the property'
  const guarantorName = `${guarantor.firstName} ${guarantor.lastName}`

  await sendGuarantorInviteEmail(
    guarantor.email,
    guarantorName,
    tenantName,
    propertyAddress,
    portalUrl,
  )

  return NextResponse.json({ ok: true, portalUrl })
}
