import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TenanciesClient from './TenanciesClient'

export const dynamic = 'force-dynamic'

export default async function TenanciesPage() {
  const tenancies = await prisma.tenancy.findMany({
    include: {
      property: true,
      tenants: { include: { tenant: { include: { user: true } } } },
      rentPayments: { orderBy: { dueDate: 'desc' }, take: 1 },
    },
    orderBy: { endDate: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Tenancies</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tenancies.length} tenancies total</p>
        </div>
        <Link href="/dashboard/tenancies/new" className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} />New Tenancy
        </Link>
      </div>
      <TenanciesClient tenancies={tenancies} />
    </div>
  )
}
