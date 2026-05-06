import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReferencingCompleteEmail } from '@/lib/email'

// Agent sets final PASSED / CONDITIONAL / FAILED decision
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { decision, agentNotes } = await req.json() as {
    decision: 'PASSED' | 'CONDITIONAL' | 'FAILED'
    agentNotes?: string
  }

  if (!['PASSED', 'CONDITIONAL', 'FAILED'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: { tenant: { include: { user: true } } },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Map referencing status to tenant referencingStatus
  const statusMap: Record<string, 'PASSED' | 'CONDITIONAL' | 'FAILED'> = {
    PASSED: 'PASSED',
    CONDITIONAL: 'CONDITIONAL',
    FAILED: 'FAILED',
  }

  const [updated] = await prisma.$transaction([
    prisma.tenantReferenceApplication.update({
      where: { id: params.id },
      data: {
        status: decision,
        agentNotes: agentNotes || app.agentNotes,
        completedAt: new Date(),
      },
    }),
    prisma.tenant.update({
      where: { id: app.tenantId },
      data: { referencingStatus: statusMap[decision] },
    }),
  ])

  // Email the agent who processed it + any other admins
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const reportUrl = `${baseUrl}/dashboard/referencing/${app.id}`
  const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'AGENT'] } } })

  for (const agent of agents) {
    try {
      if (agent.email) {
        await sendReferencingCompleteEmail(
          agent.email,
          `${app.tenant.firstName} ${app.tenant.lastName}`,
          'the applied property',
          app.affordabilityScore ?? 0,
          decision,
          reportUrl,
        )
      }
      await prisma.notification.create({
        data: {
          userId: agent.id,
          type: 'GENERAL',
          title: `Referencing ${decision}`,
          message: `${app.tenant.firstName} ${app.tenant.lastName} — Score: ${app.affordabilityScore ?? 'N/A'}/100`,
          link: `/dashboard/referencing/${app.id}`,
        },
      })
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(updated)
}
