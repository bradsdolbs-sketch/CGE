import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import FeesClient from './FeesClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Fees' }

export default async function FeesPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const [fees, landlords] = await Promise.all([
    prisma.fee.findMany({
      include: { landlord: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.landlord.findMany({
      include: { user: true },
      orderBy: { lastName: 'asc' },
    }),
  ])

  const totalInvoiced = fees.reduce((s, f) => s + f.amount, 0)
  const totalPaid = fees.filter((f) => f.paidAt).reduce((s, f) => s + f.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Fees</h1>
        <p className="text-sm text-gray-500 mt-0.5">Management fees and charges across your portfolio</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ['Total Invoiced', `£${totalInvoiced.toLocaleString()}`, 'text-[#1a1a1a]'],
          ['Collected',      `£${totalPaid.toLocaleString()}`, 'text-green-600'],
          ['Outstanding',    `£${(totalInvoiced - totalPaid).toLocaleString()}`, totalInvoiced - totalPaid > 0 ? 'text-red-600' : 'text-green-600'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      <FeesClient fees={fees} landlords={landlords} />
    </div>
  )
}
