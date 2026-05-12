import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { contractorToken: params.token },
    include: {
      property: { select: { addressLine1: true, area: true } },
      contractor: { select: { name: true, companyName: true, trade: true } },
    },
  })

  if (!request) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

  const expired =
    request.contractorTokenExpiry && request.contractorTokenExpiry < new Date()

  return NextResponse.json({
    id: request.id,
    title: request.title,
    description: request.description,
    priority: request.priority,
    status: request.status,
    category: request.category,
    notes: request.notes,
    propertyAddress: `${request.property.addressLine1}, ${request.property.area}`,
    contractorName: request.contractor?.name ?? null,
    contractorCompany: request.contractor?.companyName ?? null,
    expired,
    contractorNotifiedAt: request.contractorNotifiedAt,
    contractorAcceptedAt: request.contractorAcceptedAt,
    contractorDeclinedAt: request.contractorDeclinedAt,
    contractorDeclineReason: request.contractorDeclineReason,
    contractorCompletedAt: request.contractorCompletedAt,
    contractorCompletionNote: request.contractorCompletionNote,
    contractorCompletionPhotos: request.contractorCompletionPhotos,
    contractorReportUrl: request.contractorReportUrl,
  })
}
