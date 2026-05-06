import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import LandlordDetailClient from './LandlordDetailClient'

export const dynamic = 'force-dynamic'

export default async function LandlordDetailPage({ params }: { params: { id: string } }) {
  const landlord = await prisma.landlord.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      properties: {
        include: { listing: true, tenancies: { where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } }, take: 1 } },
      },
      statements: { orderBy: { periodStart: 'desc' } },
      fees: { orderBy: { createdAt: 'desc' }, take: 20 },
      notesList: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!landlord) notFound()

  const masked = {
    ...landlord,
    bankSortCode: landlord.bankSortCode ? '**-**-' + landlord.bankSortCode.slice(-2) : null,
    bankAccountNumber: landlord.bankAccountNumber ? '****' + landlord.bankAccountNumber.slice(-4) : null,
  }

  return <LandlordDetailClient landlord={masked} />
}
