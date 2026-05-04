import { prisma } from '@/lib/prisma'
import LeadsClient from './LeadsClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const leads = await prisma.propertyLead.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Property Leads</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rental valuation enquiries from landlords</p>
      </div>
      <LeadsClient leads={leads} />
    </div>
  )
}
