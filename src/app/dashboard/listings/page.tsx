import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ListingsClient from './ListingsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Listings' }

export default async function ListingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const [listings, properties] = await Promise.all([
    prisma.listing.findMany({
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { addressLine1: 'asc' },
    }),
  ])

  // Properties without a listing
  const listedPropertyIds = new Set(listings.map((l) => l.propertyId))
  const unlistedProperties = properties.filter((p) => !listedPropertyIds.has(p.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Listings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {listings.length} listing{listings.length !== 1 ? 's' : ''} · {unlistedProperties.length} unlisted {unlistedProperties.length !== 1 ? 'properties' : 'property'}
        </p>
      </div>
      <ListingsClient listings={listings} unlistedProperties={unlistedProperties} />
    </div>
  )
}
