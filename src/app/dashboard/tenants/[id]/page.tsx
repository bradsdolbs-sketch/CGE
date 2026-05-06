import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TenantDetailClient from './TenantDetailClient'

export const dynamic = 'force-dynamic'

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      tenancies: {
        include: { tenancy: { include: { property: true, rentPayments: { orderBy: { dueDate: 'desc' }, take: 6 } } } },
      },
      documents: true,
      rightToRentChecks: { orderBy: { checkDate: 'desc' } },
      notesList: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!tenant) notFound()
  return <TenantDetailClient tenant={tenant} />
}
