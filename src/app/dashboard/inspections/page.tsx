import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import InspectionsClient from './InspectionsClient'

export const metadata = { title: 'Inspections' }

export default async function InspectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const inspections = await prisma.inspection.findMany({
    include: { property: { select: { addressLine1: true, area: true, postcode: true } } },
    orderBy: { scheduledAt: 'asc' },
  })

  const properties = await prisma.property.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: { id: true, addressLine1: true, area: true, postcode: true },
    orderBy: { addressLine1: 'asc' },
  })

  return <InspectionsClient inspections={JSON.parse(JSON.stringify(inspections))} properties={properties} />
}
