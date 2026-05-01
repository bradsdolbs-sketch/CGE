import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import { sendEmployerVerificationEmail, sendPreviousLandlordVerificationEmail } from '@/lib/email'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

async function signVerifyToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

// Agent triggers employer + previous landlord verification emails
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: { tenant: { include: { user: true } } },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const { send } = await req.json() as { send: ('employer' | 'landlord')[] }
  const sent: string[] = []
  const errors: string[] = []

  // ── Employer email ────────────────────────────────────────────────────────
  if (send.includes('employer') && app.employerEmail) {
    try {
      const token = await signVerifyToken({
        type: 'employer-verify',
        applicationId: app.id,
        email: app.employerEmail,
      })
      const confirmUrl = `${baseUrl}/referencing/verify/${token}?role=employer`

      await sendEmployerVerificationEmail(
        app.employerEmail,
        app.employerName ?? 'HR Team',
        `${app.tenant.firstName} ${app.tenant.lastName}`,
        app.jobTitle ?? 'Employee',
        app.annualSalary ?? 0,
        app.contractType ?? 'Permanent',
        confirmUrl,
      )

      await prisma.tenantReferenceApplication.update({
        where: { id: params.id },
        data: { status: 'AWAITING_EMPLOYER' },
      })
      sent.push('employer')
    } catch (err) {
      errors.push(`Employer: ${err instanceof Error ? err.message : 'Failed'}`)
    }
  }

  // ── Previous landlord email ───────────────────────────────────────────────
  if (send.includes('landlord') && app.prevLandlordEmail) {
    try {
      const token = await signVerifyToken({
        type: 'landlord-verify',
        applicationId: app.id,
        email: app.prevLandlordEmail,
      })
      const confirmUrl = `${baseUrl}/referencing/verify/${token}?role=landlord`

      const tenancyPeriod = app.prevTenancyStart && app.prevTenancyEnd
        ? `${new Date(app.prevTenancyStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – ${new Date(app.prevTenancyEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
        : 'Period unspecified'

      await sendPreviousLandlordVerificationEmail(
        app.prevLandlordEmail,
        app.prevLandlordName ?? 'Landlord',
        `${app.tenant.firstName} ${app.tenant.lastName}`,
        app.prevPropertyAddress ?? 'Previous property',
        tenancyPeriod,
        confirmUrl,
      )

      await prisma.tenantReferenceApplication.update({
        where: { id: params.id },
        data: { status: 'AWAITING_LANDLORD' },
      })
      sent.push('landlord')
    } catch (err) {
      errors.push(`Landlord: ${err instanceof Error ? err.message : 'Failed'}`)
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
}
