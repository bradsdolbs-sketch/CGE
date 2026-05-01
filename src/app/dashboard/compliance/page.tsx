import { prisma } from '@/lib/prisma'
import ComplianceClient from './ComplianceClient'
import { addDays } from 'date-fns'

export const dynamic = 'force-dynamic'

const CERT_TYPES = ['GAS_SAFETY', 'EICR', 'EPC', 'HMO_LICENCE', 'LEGIONELLA', 'PAT_TESTING', 'FIRE_SAFETY']

export default async function CompliancePage() {
  const now = new Date()
  const in30Days = addDays(now, 30)

  const [properties, allItems] = await Promise.all([
    prisma.property.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: { id: true, addressLine1: true, area: true, postcode: true },
      orderBy: { addressLine1: 'asc' },
    }),
    prisma.complianceItem.findMany({ orderBy: { expiryDate: 'asc' } }),
  ])

  const expiredCount = allItems.filter((i) => i.expiryDate && i.expiryDate < now).length
  const expiringThisMonth = allItems.filter((i) => i.expiryDate && i.expiryDate >= now && i.expiryDate <= in30Days).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Compliance Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Certificate status across all properties</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]">{properties.length}</p>
          <p className="text-sm text-gray-500">Properties</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
          <p className="text-sm text-gray-500">Expired Certs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{expiringThisMonth}</p>
          <p className="text-sm text-gray-500">Expiring This Month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allItems.filter((i) => i.expiryDate && i.expiryDate > in30Days).length}</p>
          <p className="text-sm text-gray-500">Valid Certs</p>
        </div>
      </div>

      <ComplianceClient properties={properties} items={allItems} certTypes={CERT_TYPES} />
    </div>
  )
}
