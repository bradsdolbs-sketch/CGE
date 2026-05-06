import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PropertiesClient from './PropertiesClient'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    where: { status: { not: 'ARCHIVED' } },
    include: {
      listing: true,
      landlord: { include: { user: true } },
      complianceItems: { orderBy: { expiryDate: 'asc' } },
      _count: { select: { maintenanceReqs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Properties</h1>
          <p className="text-sm text-gray-500 mt-0.5">{properties.length} properties in portfolio</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Add Property
        </Link>
      </div>
      <PropertiesClient properties={properties} />
    </div>
  )
}
