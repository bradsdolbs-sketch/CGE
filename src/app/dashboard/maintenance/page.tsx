import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import MaintenanceClient from './MaintenanceClient'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const requests = await prisma.maintenanceRequest.findMany({
    include: {
      property: true,
      contractor: true,
      updates: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{requests.filter(r => !['COMPLETED','CANCELLED'].includes(r.status)).length} open jobs</p>
        </div>
        <Link href="/dashboard/maintenance/new" className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} />New Request
        </Link>
      </div>
      <MaintenanceClient requests={requests} />
    </div>
  )
}
