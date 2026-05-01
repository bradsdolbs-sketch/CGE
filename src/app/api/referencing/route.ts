import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReferencingInviteEmail } from '@/lib/email'

// Agent creates a referencing application for a tenant
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { tenantId, enquiryId, monthlyRentTarget, sendInvite } = await req.json()
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

    // Check no active application already exists
    const existing = await prisma.tenantReferenceApplication.findFirst({
      where: { tenantId, status: { notIn: ['PASSED', 'FAILED'] } },
    })
    if (existing) {
      return NextResponse.json({ error: 'An active referencing application already exists', id: existing.id }, { status: 409 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { user: true },
    })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const application = await prisma.tenantReferenceApplication.create({
      data: {
        tenantId,
        enquiryId: enquiryId || null,
        monthlyRentTarget: monthlyRentTarget ? parseInt(monthlyRentTarget) : null,
        status: 'PENDING_SUBMISSION',
      },
    })

    // Update tenant referencing status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { referencingStatus: 'IN_PROGRESS' },
    })

    // Send invite email if requested
    if (sendInvite && tenant.user.email) {
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      const referencingUrl = `${baseUrl}/portal/tenant/referencing`
      await sendReferencingInviteEmail(
        tenant.user.email,
        `${tenant.firstName} ${tenant.lastName}`,
        'your new property',
        referencingUrl,
      )
    }

    return NextResponse.json(application, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const applications = await prisma.tenantReferenceApplication.findMany({
    include: {
      tenant: { include: { user: true } },
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(applications)
}
