import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { contractorToken: params.token },
    include: { property: { select: { addressLine1: true, area: true } }, contractor: { select: { name: true } } },
  })

  if (!request) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  if (request.contractorTokenExpiry && request.contractorTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  if (request.contractorAcceptedAt || request.contractorDeclinedAt || request.contractorCompletedAt) {
    return NextResponse.json({ error: 'Job already actioned' }, { status: 409 })
  }

  const now = new Date()

  await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: { contractorAcceptedAt: now, status: 'IN_PROGRESS' },
    }),
    prisma.maintenanceUpdate.create({
      data: {
        requestId: request.id,
        status: 'IN_PROGRESS',
        note: `Job accepted by ${request.contractor?.name ?? 'contractor'}.`,
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
        title: 'Contractor accepted job',
        message: `${request.contractor?.name ?? 'Contractor'} accepted: ${request.title} at ${request.property.addressLine1}`,
        link: `/dashboard/maintenance/${request.id}`,
      })),
    })
  }

  return NextResponse.json({ success: true })
}
