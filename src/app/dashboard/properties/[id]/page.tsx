import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PropertyDetailClient from './PropertyDetailClient'

export const dynamic = 'force-dynamic'

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      landlord: { include: { user: true } },
      tenancies: {
        include: {
          tenants: { include: { tenant: { include: { user: true } } } },
          rentPayments: { orderBy: { dueDate: 'desc' }, take: 3 },
        },
        orderBy: { createdAt: 'desc' },
      },
      complianceItems: { orderBy: { expiryDate: 'asc' } },
      maintenanceReqs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { contractor: true },
      },
      inspections: { orderBy: { scheduledAt: 'desc' }, take: 5 },
    },
  })

  if (!property) notFound()

  const landlords = await prisma.landlord.findMany({
    include: { user: true },
    orderBy: { lastName: 'asc' },
  })

  return <PropertyDetailClient property={property} landlords={landlords} />
}
