import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/dashboard/StatCard'
import { addDays } from 'date-fns'
import { Building2, PoundSterling, AlertTriangle, Wrench, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(pence / 100)
}

function fmtDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysFromNow(d: Date) {
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function daysAgo(d: Date) {
  return Math.ceil((Date.now() - d.getTime()) / 86400000)
}

function arrearsBadge(days: number) {
  if (days <= 7) return 'bg-green-100 text-green-700'
  if (days <= 21) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function complianceBadge(days: number | null) {
  if (days === null || days < 0) return 'bg-red-100 text-red-700'
  if (days <= 30) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function sourceBadge(source: string) {
  const map: Record<string, string> = {
    WEBSITE: 'bg-blue-100 text-blue-700',
    RIGHTMOVE: 'bg-purple-100 text-purple-700',
    ZOOPLA: 'bg-pink-100 text-pink-700',
    WORD_OF_MOUTH: 'bg-teal-100 text-teal-700',
    DIRECT: 'bg-gray-100 text-gray-600',
    SOCIAL_MEDIA: 'bg-orange-100 text-orange-700',
    OTHER: 'bg-gray-100 text-gray-600',
  }
  return map[source] ?? 'bg-gray-100 text-gray-600'
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const now = new Date()
  const in30Days = addDays(now, 30)

  const [
    totalProperties,
    rentRoll,
    arrearsPayments,
    openMaintenance,
    renewals30,
    recentEnquiries,
    maintenanceByPriority,
    complianceAlerts,
    arrearsDetails,
  ] = await Promise.all([
    prisma.property.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.tenancy.aggregate({
      _sum: { rentAmount: true },
      where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
    }),
    prisma.rentPayment.aggregate({
      _sum: { amount: true, amountPaid: true },
      where: { status: { in: ['LATE', 'PARTIAL'] } },
    }),
    prisma.maintenanceRequest.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
    prisma.tenancy.count({
      where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] }, endDate: { gte: now, lte: in30Days } },
    }),
    prisma.enquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { property: true },
    }),
    prisma.maintenanceRequest.groupBy({
      by: ['priority'],
      _count: true,
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    }),
    prisma.complianceItem.findMany({
      where: { expiryDate: { lte: addDays(now, 60) } },
      include: { property: true },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    }),
    prisma.rentPayment.findMany({
      where: { status: { in: ['LATE', 'PARTIAL'] } },
      include: {
        tenancy: {
          include: {
            property: true,
            tenants: { include: { tenant: { include: { user: true } } }, take: 1, where: { isPrimary: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
  ])

  const totalRentRoll = rentRoll._sum.rentAmount ?? 0
  const arrearsTotal = Math.max(0, (arrearsPayments._sum.amount ?? 0) - (arrearsPayments._sum.amountPaid ?? 0))

  const priorityCounts = { EMERGENCY: 0, URGENT: 0, ROUTINE: 0 }
  for (const g of maintenanceByPriority) {
    priorityCounts[g.priority as keyof typeof priorityCounts] = g._count
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Central Gate Estates — portfolio overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Properties"
          value={totalProperties}
          icon={<Building2 size={18} />}
          color="slate"
          href="/dashboard/properties"
        />
        <StatCard
          title="Rent Roll"
          value={fmt(totalRentRoll) + '/mo'}
          icon={<PoundSterling size={18} />}
          color="green"
          href="/dashboard/finance/rent"
        />
        <StatCard
          title="Arrears"
          value={fmt(arrearsTotal)}
          icon={<AlertTriangle size={18} />}
          color={arrearsTotal > 0 ? 'red' : 'green'}
          href="/dashboard/finance/rent?status=LATE"
        />
        <StatCard
          title="Open Jobs"
          value={openMaintenance}
          icon={<Wrench size={18} />}
          color="amber"
          href="/dashboard/maintenance"
        />
        <StatCard
          title="Renewals <30d"
          value={renewals30}
          icon={<RefreshCcw size={18} />}
          color="terracotta"
          href="/dashboard/tenancies?filter=renewals"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Arrears Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1a1a]">Rent Arrears</h2>
            <Link href="/dashboard/finance/rent?status=LATE" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">
              View all →
            </Link>
          </div>
          {arrearsDetails.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">No arrears — great work!</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Tenant</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Owed</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {arrearsDetails.map((p) => {
                  const owed = p.amount - p.amountPaid
                  const days = daysAgo(p.dueDate)
                  const tenant = p.tenancy.tenants[0]?.tenant
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-[#1a1a1a] font-medium truncate max-w-[140px]">
                        {p.tenancy.property.addressLine1}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {tenant ? `${tenant.firstName} ${tenant.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600">{fmt(owed)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${arrearsBadge(days)}`}>
                          {days}d
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Compliance Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1a1a]">Compliance Alerts</h2>
            <Link href="/dashboard/compliance" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">
              View all →
            </Link>
          </div>
          {complianceAlerts.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">All compliance up to date</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Certificate</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Expiry</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Days</th>
                </tr>
              </thead>
              <tbody>
                {complianceAlerts.map((item) => {
                  const days = item.expiryDate ? daysFromNow(item.expiryDate) : null
                  return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-[#1a1a1a] truncate max-w-[130px]">
                        {item.property.addressLine1}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{item.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{fmtDate(item.expiryDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${complianceBadge(days)}`}>
                          {days === null ? '—' : days < 0 ? 'EXPIRED' : `${days}d`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1a1a]">Recent Enquiries</h2>
            <Link href="/dashboard/applicants" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">
              View all →
            </Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">No recent enquiries</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentEnquiries.map((e) => (
                <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{e.firstName} {e.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{e.property?.addressLine1 ?? 'General enquiry'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge(e.source)}`}>
                      {e.source.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDate(e.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Maintenance by Priority */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1a1a]">Open Maintenance Jobs</h2>
            <Link href="/dashboard/maintenance" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">
              View all →
            </Link>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-[#1a1a1a]">Emergency</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${priorityCounts.EMERGENCY > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                {priorityCounts.EMERGENCY}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-[#1a1a1a]">Urgent</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${priorityCounts.URGENT > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                {priorityCounts.URGENT}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-[#1a1a1a]">Routine</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${priorityCounts.ROUTINE > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {priorityCounts.ROUTINE}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
