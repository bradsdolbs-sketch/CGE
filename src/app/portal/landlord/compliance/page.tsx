import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    GAS_SAFETY: 'Gas Safety',
    EICR: 'EICR',
    EPC: 'EPC',
    HMO_LICENCE: 'HMO Licence',
    LEGIONELLA: 'Legionella',
    PAT_TESTING: 'PAT Testing',
    FIRE_SAFETY: 'Fire Safety',
    RIGHT_TO_RENT: 'Right to Rent',
    ASBESTOS: 'Asbestos',
    PLANNING: 'Planning',
    OTHER: 'Other',
  }
  if (map[type]) return map[type]
  // Fallback: replace underscores, title case
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function expiryBadge(expiryDate: Date | null | undefined): {
  label: string
  classes: string
} {
  if (!expiryDate) {
    return { label: 'No expiry', classes: 'bg-gray-100 text-gray-500' }
  }
  const today = new Date()
  const days = differenceInDays(new Date(expiryDate), today)
  if (days < 0) {
    return { label: `Expired ${Math.abs(days)}d ago`, classes: 'bg-red-100 text-red-700' }
  }
  if (days <= 30) {
    return { label: `${days}d left`, classes: 'bg-red-100 text-red-700' }
  }
  if (days <= 90) {
    return { label: `${days}d left`, classes: 'bg-amber-100 text-amber-700' }
  }
  return { label: `${days}d left`, classes: 'bg-green-100 text-green-700' }
}

function isExpiredOrSoon(expiryDate: Date | null | undefined): boolean {
  if (!expiryDate) return false
  const days = differenceInDays(new Date(expiryDate), new Date())
  return days <= 30
}

function isExpired(expiryDate: Date | null | undefined): boolean {
  if (!expiryDate) return false
  return differenceInDays(new Date(expiryDate), new Date()) < 0
}

export default async function LandlordCompliancePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!landlord) redirect('/login')

  const complianceItems = await prisma.complianceItem.findMany({
    where: { property: { landlordId: landlord.id } },
    include: {
      property: { select: { addressLine1: true, area: true, postcode: true } },
    },
    orderBy: { expiryDate: 'asc' },
  })

  // Summary counts
  const expiredCount = complianceItems.filter((item) => isExpired(item.expiryDate)).length
  const expiringSoonCount = complianceItems.filter(
    (item) =>
      !isExpired(item.expiryDate) &&
      item.expiryDate !== null &&
      differenceInDays(new Date(item.expiryDate), new Date()) <= 30
  ).length
  const allClearCount = complianceItems.filter(
    (item) =>
      item.expiryDate !== null &&
      differenceInDays(new Date(item.expiryDate), new Date()) > 30
  ).length

  // Group by property
  const grouped = complianceItems.reduce<
    Record<string, { address: string; area: string; postcode: string; items: typeof complianceItems }>
  >((acc, item) => {
    const key = item.property.addressLine1
    if (!acc[key]) {
      acc[key] = {
        address: item.property.addressLine1,
        area: item.property.area,
        postcode: item.property.postcode,
        items: [],
      }
    }
    acc[key].items.push(item)
    return acc
  }, {})

  const propertyGroups = Object.values(grouped)

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Compliance
        </h1>
        <p className="text-[#8a7968] text-sm mt-0.5">
          Certificates and safety records for your properties
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p
            className="text-xs uppercase tracking-wider text-[#8a7968] mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Expired
          </p>
          <p
            className={`text-3xl font-bold ${expiredCount > 0 ? 'text-red-600' : 'text-[#1a1a1a]'}`}
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {expiredCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p
            className="text-xs uppercase tracking-wider text-[#8a7968] mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Expiring in 30 Days
          </p>
          <p
            className={`text-3xl font-bold ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-[#1a1a1a]'}`}
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {expiringSoonCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p
            className="text-xs uppercase tracking-wider text-[#8a7968] mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            All Clear
          </p>
          <p
            className="text-3xl font-bold text-green-600"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {allClearCount}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {complianceItems.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p
            className="text-[#1a1a1a] font-semibold mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            No compliance records
          </p>
          <p className="text-[#8a7968] text-sm">
            No compliance items have been recorded for your properties.
          </p>
        </div>
      )}

      {/* Grouped by property */}
      {propertyGroups.map((group) => (
        <div
          key={group.address}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          {/* Property header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p
              className="font-semibold text-[#1a1a1a]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {group.address}
            </p>
            <p className="text-xs text-[#8a7968]">
              {group.area}, {group.postcode}
            </p>
          </div>

          {group.items.length === 0 ? (
            <div className="px-6 py-6">
              <p className="text-sm text-gray-400">No records</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => {
                const badge = expiryBadge(item.expiryDate)
                const urgent = isExpiredOrSoon(item.expiryDate)

                return (
                  <div
                    key={item.id}
                    className={`px-6 py-4 flex flex-wrap items-start justify-between gap-4 ${
                      urgent ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1a1a1a]">{typeLabel(item.type)}</p>
                      <div className="flex flex-wrap gap-4 mt-1 text-xs text-[#8a7968]">
                        <span>
                          Issued:{' '}
                          <span className="text-[#1a1a1a]">{fmtDate(item.issueDate)}</span>
                        </span>
                        <span>
                          Expires:{' '}
                          <span className={urgent ? 'text-red-600 font-medium' : 'text-[#1a1a1a]'}>
                            {fmtDate(item.expiryDate)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                      {item.certificateUrl && (
                        <a
                          href={item.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] uppercase tracking-wide"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
