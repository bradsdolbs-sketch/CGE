import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, differenceInDays } from 'date-fns'
import { Building2, AlertTriangle, CheckCircle, CalendarDays, PoundSterling, Users } from 'lucide-react'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

function tenancyEndBadge(endDate: Date) {
  const days = differenceInDays(new Date(endDate), new Date())
  if (days < 0) return { label: 'Expired', cls: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `${days}d left`, cls: 'bg-red-100 text-red-700' }
  if (days <= 90) return { label: `${days}d left`, cls: 'bg-amber-100 text-amber-700' }
  return { label: fmtDate(endDate), cls: 'bg-green-100 text-green-700' }
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Available', cls: 'bg-[#F0EBE0] text-[#1A3D2B]' },
    LET: { label: 'Let', cls: 'bg-green-100 text-green-700' },
    LET_AGREED: { label: 'Let Agreed', cls: 'bg-blue-100 text-blue-700' },
    UNDER_OFFER: { label: 'Under Offer', cls: 'bg-purple-100 text-purple-700' },
    OFF_MARKET: { label: 'Off Market', cls: 'bg-gray-100 text-gray-600' },
  }
  return map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
}

export default async function LandlordPropertiesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    include: {
      properties: {
        orderBy: { createdAt: 'desc' },
        include: {
          tenancies: {
            where: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] } },
            include: {
              tenants: {
                include: { tenant: true },
              },
            },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
          maintenanceReqs: {
            where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
            select: { id: true, priority: true, title: true },
          },
        },
      },
    },
  })

  if (!landlord) redirect('/login')

  const properties = landlord.properties

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
        >
          My Properties
        </h1>
        <p className="text-sm text-[#8a7968] mt-0.5">
          {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} under management
        </p>
      </div>

      {properties.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[#8a7968] text-sm">No properties are linked to your account yet.</p>
          <p className="text-xs text-gray-400 mt-1">Contact your agent if you believe this is an error.</p>
        </div>
      )}

      <div className="space-y-4">
        {properties.map((prop) => {
          const activeTenancy = prop.tenancies[0]
          const tenants = activeTenancy?.tenants ?? []
          const endBadge = activeTenancy ? tenancyEndBadge(activeTenancy.endDate) : null
          const openJobs = prop.maintenanceReqs
          const hasEmergency = openJobs.some(j => j.priority === 'EMERGENCY')
          const sb = statusBadge(prop.status)

          return (
            <div
              key={prop.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Property header */}
              <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      className="font-semibold text-[#1a1a1a]"
                      style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
                    >
                      {prop.addressLine1}{prop.addressLine2 ? `, ${prop.addressLine2}` : ''}
                    </h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${sb.cls}`}>
                      {sb.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8a7968] mt-0.5">
                    {prop.area}, {prop.postcode}
                    {prop.propertyType && ` · ${prop.propertyType.replace('_', ' ')}`}
                    {prop.bedrooms != null && ` · ${prop.bedrooms} bed`}
                    {prop.bathrooms != null && ` · ${prop.bathrooms} bath`}
                  </p>
                </div>

                {openJobs.length > 0 ? (
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded ${
                    hasEmergency ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle size={12} />
                    {openJobs.length} open job{openJobs.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-700">
                    <CheckCircle size={12} />
                    No open jobs
                  </span>
                )}
              </div>

              {/* Tenancy details */}
              <div className="px-5 py-4">
                {activeTenancy ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Tenants */}
                    <div className="flex items-start gap-2.5">
                      <Users size={15} className="text-[#8a7968] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-[#8a7968] uppercase tracking-wider font-semibold mb-0.5">Tenant{tenants.length !== 1 ? 's' : ''}</p>
                        {tenants.length === 0 ? (
                          <p className="text-sm text-gray-400">—</p>
                        ) : (
                          tenants.map(tt => (
                            <p key={tt.tenantId} className="text-sm text-[#1a1a1a]">
                              {tt.tenant.firstName} {tt.tenant.lastName}
                              {tt.isPrimary && tenants.length > 1 && (
                                <span className="text-xs text-[#8a7968] ml-1">(primary)</span>
                              )}
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Rent */}
                    <div className="flex items-start gap-2.5">
                      <PoundSterling size={15} className="text-[#8a7968] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-[#8a7968] uppercase tracking-wider font-semibold mb-0.5">Monthly Rent</p>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{fmt(activeTenancy.rentAmount)}</p>
                      </div>
                    </div>

                    {/* Tenancy end */}
                    <div className="flex items-start gap-2.5">
                      <CalendarDays size={15} className="text-[#8a7968] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-[#8a7968] uppercase tracking-wider font-semibold mb-0.5">Tenancy End</p>
                        {endBadge && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${endBadge.cls}`}>
                            {endBadge.label}
                          </span>
                        )}
                        <p className="text-xs text-[#8a7968] mt-0.5">
                          Started {fmtDate(activeTenancy.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={14} />
                    <p className="text-sm font-medium">Vacant — no active tenancy</p>
                  </div>
                )}
              </div>

              {/* Open jobs */}
              {openJobs.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                  <p className="text-xs font-semibold text-[#8a7968] uppercase tracking-wider mb-2">Open Maintenance Jobs</p>
                  <div className="space-y-1">
                    {openJobs.map(job => (
                      <div key={job.id} className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          job.priority === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                          job.priority === 'URGENT' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {job.priority}
                        </span>
                        <p className="text-sm text-[#1a1a1a]">{job.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
