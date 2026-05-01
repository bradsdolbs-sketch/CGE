import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import LandlordsClient from './LandlordsClient'

export const dynamic = 'force-dynamic'

export default async function LandlordsPage() {
  const landlords = await prisma.landlord.findMany({
    include: {
      user: true,
      _count: { select: { properties: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Landlords</h1>
          <p className="text-sm text-gray-500 mt-0.5">{landlords.length} landlords total</p>
        </div>
        <Link href="/dashboard/landlords/new" className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} />Add Landlord
        </Link>
      </div>
      <LandlordsClient landlords={landlords} />
    </div>
  )
}
