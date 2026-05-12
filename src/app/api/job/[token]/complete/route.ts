import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContractorCompletionAlert } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { contractorToken: params.token },
    include: {
      property: { select: { addressLine1: true, area: true } },
      contractor: { select: { name: true, companyName: true } },
    },
  })

  if (!request) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  if (request.contractorTokenExpiry && request.contractorTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  if (request.contractorCompletedAt) {
    return NextResponse.json({ error: 'Job already marked complete' }, { status: 409 })
  }

  if (!['ASSIGNED', 'IN_PROGRESS'].includes(request.status)) {
    return NextResponse.json({ error: 'Job is not in an active state' }, { status: 400 })
  }

  const body = await req.json()
  const { completionNote, photos, reportUrl } = body

  if (!completionNote?.trim()) {
    return NextResponse.json({ error: 'Completion note is required' }, { status: 400 })
  }

  const contractorName = request.contractor?.name ?? 'Contractor'
  const now = new Date()

  await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: {
        contractorCompletedAt: now,
        contractorCompletionNote: completionNote.trim(),
        contractorCompletionPhotos: photos ?? [],
        contractorReportUrl: reportUrl ?? null,
        status: 'COMPLETED',
        completedAt: now,
      },
    }),
    prisma.maintenanceUpdate.create({
      data: {
        requestId: request.id,
        status: 'COMPLETED',
        note: `Job completed by ${contractorName}. Notes: ${completionNote.trim()}`,
        photos: photos ?? [],
      },
    }),
  ])

  // Email all active agents
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true, name: true, email: true },
  })

  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/maintenance/${request.id}`

  await Promise.allSettled(
    agents
      .filter((a): a is typeof a & { email: string } => !!a.email)
      .map((agent) =>
        sendContractorCompletionAlert({
          to: agent.email,
          agentName: agent.name ?? 'Agent',
          agencyName: 'Central Gate Estates',
          contractorName,
          jobTitle: request.title,
          propertyAddress: `${request.property.addressLine1}, ${request.property.area}`,
          completionNote: completionNote.trim(),
          dashboardUrl,
        })
      )
  )

  return NextResponse.json({ success: true })
}
