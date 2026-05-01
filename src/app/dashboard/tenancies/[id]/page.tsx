import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TenancyDetailClient from './TenancyDetailClient'

export const dynamic = 'force-dynamic'

export default async function TenancyDetailPage({ params }: { params: { id: string } }) {
  const tenancy = await prisma.tenancy.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      landlord: { include: { user: true } },
      tenants: { include: { tenant: { include: { user: true } } } },
      guarantors: true,
      rentPayments: { orderBy: { dueDate: 'asc' } },
      documents: true,
      notesList: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!tenancy) notFound()
  return <TenancyDetailClient tenancy={tenancy} />
}
