import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import MaintenanceDetailClient from './MaintenanceDetailClient'

export const dynamic = 'force-dynamic'

export default async function MaintenanceDetailPage({ params }: { params: { id: string } }) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      contractor: true,
      updates: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!request) notFound()

  const contractors = await prisma.contractor.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })

  return <MaintenanceDetailClient request={request} contractors={contractors} />
}
