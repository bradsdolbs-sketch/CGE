import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    EMERGENCY: 'bg-red-100 text-red-700 border border-red-200',
    URGENT: 'bg-amber-100 text-amber-700 border border-amber-200',
    ROUTINE: 'bg-[#4a6fa5]/10 text-[#4a6fa5] border border-[#4a6fa5]/20',
  }
  return map[priority] ?? 'bg-gray-100 text-gray-600'
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    NEW: 'bg-gray-100 text-gray-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-[#4a6fa5]/10 text-[#4a6fa5]',
    AWAITING_PARTS: 'bg-amber-100 text-amber-700',
    AWAITING_APPROVAL: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    INVOICED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-400',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

function categoryLabel(cat: string) {
  return cat.replace('_', ' ')
}

type FilterType = 'all' | 'open' | 'in_progress' | 'completed'

interface PageProps {
  searchParams: { filter?: string }
}

export default async function TenantMaintenancePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/login')

  const filter = (searchParams.filter ?? 'all') as FilterType

  const tenant = await prisma.tenant.findUnique({
    where: { userId: session.user.id },
    include: {
      tenancies: {
        include: {
          tenancy: {
            include: { property: true },
          },
        },
        where: { tenancy: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] } } },
        take: 1,
      },
    },
  })

  const propertyId = tenant?.tenancies[0]?.tenancy?.propertyId ?? null

  let statusFilter: string[] | undefined
  if (filter === 'open') statusFilter = ['NEW', 'ASSIGNED', 'AWAITING_PARTS', 'AWAITING_APPROVAL']
  else if (filter === 'in_progress') statusFilter = ['IN_PROGRESS', 'ASSIGNED']
  else if (filter === 'completed') statusFilter = ['COMPLETED', 'INVOICED', 'CANCELLED']

  const requests = propertyId
    ? await prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          ...(statusFilter ? { status: { in: statusFilter as any } } : {}),
        },
        include: {
          contractor: true,
          updates: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { reportedAt: 'desc' },
      })
    : []

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Maintenance
          </h1>
          <p className="text-[#8a7968] text-sm mt-0.5">Your maintenance requests and updates</p>
        </div>
        <Link
          href="/portal/tenant/maintenance/new"
          className="flex items-center gap-2 bg-[#1A3D2B] text-white px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:bg-[#122B1E] transition rounded"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          <Plus size={16} />
          New Request
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded p-1 w-fit">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/portal/tenant/maintenance${f.value === 'all' ? '' : `?filter=${f.value}`}`}
            className={`px-4 py-1.5 text-sm font-medium rounded transition ${
              filter === f.value
                ? 'bg-[#1a1a1a] text-white'
                : 'text-[#8a7968] hover:text-[#1a1a1a]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-[#1a1a1a] font-semibold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            No maintenance requests
          </p>
          <p className="text-[#8a7968] text-sm mb-6">
            {filter === 'all'
              ? "You haven't raised any maintenance requests yet."
              : 'No requests match this filter.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/portal/tenant/maintenance/new"
              className="inline-flex items-center gap-2 bg-[#1A3D2B] text-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#122B1E] transition rounded"
            >
              <Plus size={16} />
              Report an Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const lastUpdate = req.updates[0]
            return (
              <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8a7968] bg-gray-100 px-2 py-0.5 rounded">
                        {categoryLabel(req.category)}
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${priorityBadge(req.priority)}`}>
                        {req.priority}
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadge(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {req.title}
                    </h3>
                    <p className="text-sm text-[#8a7968] mt-1 line-clamp-2">{req.description}</p>
                  </div>
                  <div className="text-right text-xs text-[#8a7968] flex-shrink-0">
                    <p>Submitted</p>
                    <p className="font-medium text-[#1a1a1a]">{format(new Date(req.reportedAt), 'd MMM yyyy')}</p>
                  </div>
                </div>

                {(req.contractor || lastUpdate) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-[#8a7968]">
                    {req.contractor && (
                      <span>Assigned to: <span className="text-[#1a1a1a] font-medium">{req.contractor.name}</span></span>
                    )}
                    {lastUpdate && (
                      <span>
                        Last update: <span className="text-[#1a1a1a] font-medium">{format(new Date(lastUpdate.createdAt), 'd MMM yyyy')}</span>
                        {' — '}{lastUpdate.note}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
