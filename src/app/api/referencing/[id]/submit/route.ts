import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Tenant finalises and submits their referencing application
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: { tenant: { include: { user: true } } },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the tenant themselves or an agent
  if (session.user.role === 'TENANT') {
    const tenant = await prisma.tenant.findUnique({ where: { userId: session.user.id } })
    if (!tenant || tenant.id !== app.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (!['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (app.status !== 'PENDING_SUBMISSION') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
  }

  // Validate minimum required fields
  if (!app.employerName || !app.annualSalary || !app.jobTitle) {
    return NextResponse.json({ error: 'Employment details are required before submitting' }, { status: 400 })
  }

  const updated = await prisma.tenantReferenceApplication.update({
    where: { id: params.id },
    data: {
      status: 'IN_PROGRESS',
      submittedAt: new Date(),
    },
  })

  // Notify agents
  const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'AGENT'] } } })
  for (const agent of agents) {
    await prisma.notification.create({
      data: {
        userId: agent.id,
        type: 'GENERAL',
        title: 'Referencing Application Submitted',
        message: `${app.tenant.firstName} ${app.tenant.lastName} has submitted their referencing application.`,
        link: `/dashboard/referencing/${app.id}`,
      },
    })
  }

  return NextResponse.json(updated)
}
