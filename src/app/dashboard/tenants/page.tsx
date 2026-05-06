import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TenantsClient from './TenantsClient'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      user: true,
      tenancies: {
        include: { tenancy: { include: { property: true } } },
        take: 1,
        orderBy: { tenancy: { createdAt: 'desc' } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tenants.length} tenants total</p>
        </div>
        <Link href="/dashboard/tenants/new" className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} />Add Tenant
        </Link>
      </div>
      <TenantsClient tenants={tenants} />
    </div>
  )
}
