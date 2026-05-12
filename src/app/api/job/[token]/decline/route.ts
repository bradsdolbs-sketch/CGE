import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { contractorToken: params.token },
    include: { property: { select: { addressLine1: true } }, contractor: { select: { name: true } } },
  })

  if (!request) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  if (request.contractorTokenExpiry && request.contractorTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  if (request.contractorAcceptedAt || request.contractorDeclinedAt || request.contractorCompletedAt) {
    return NextResponse.json({ error: 'Job already actioned' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const reason: string | undefined = body.reason?.trim() || undefined
  const contractorName = request.contractor?.name ?? 'Contractor'
  const now = new Date()

  await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: {
        contractorDeclinedAt: now,
        contractorDeclineReason: reason ?? null,
        // Clear assignment so agent can reassign
        status: 'NEW',
        contractorId: null,
        contractorToken: null,
        contractorTokenExpiry: null,
        contractorNotifiedAt: null,
        assignedAt: null,
      },
    }),
    prisma.maintenanceUpdate.create({
      data: {
        requestId: request.id,
        status: 'NEW',
        note: `Job declined by ${contractorName}.${reason ? ` Reason: ${reason}` : ''}`,
        photos: [],
      },
    }),
  ])

  // Notify all agents
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true },
  })

  if (agents.length > 0) {
    await prisma.notification.createMany({
      data: agents.map((a) => ({
        userId: a.id,
        type: 'MAINTENANCE_UPDATE' as const,
        title: 'Contractor declined job',
        message: `${contractorName} declined: ${request.title} at ${request.property.addressLine1}${reason ? ` — "${reason}"` : ''}`,
        link: `/dashboard/maintenance/${request.id}`,
      })),
    })
  }

  return NextResponse.json({ success: true })
}
