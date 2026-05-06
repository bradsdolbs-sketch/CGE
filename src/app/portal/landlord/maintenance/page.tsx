import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import ApproveMaintenanceButtons from '../ApproveMaintenanceButtons'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    EMERGENCY: 'bg-red-100 text-red-700',
    URGENT: 'bg-amber-100 text-amber-700',
    ROUTINE: 'bg-[#4a6fa5]/10 text-[#4a6fa5]',
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

export default async function LandlordMaintenancePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!landlord) redirect('/login')

  const allJobs = await prisma.maintenanceRequest.findMany({
    where: { property: { landlordId: landlord.id } },
    include: {
      property: true,
      contractor: true,
    },
    orderBy: { reportedAt: 'desc' },
  })

  const awaitingApproval = allJobs.filter((j) => j.status === 'AWAITING_APPROVAL')
  const inProgress = allJobs.filter((j) =>
    ['IN_PROGRESS', 'ASSIGNED', 'AWAITING_PARTS', 'NEW'].includes(j.status)
  )
  const completed = allJobs
    .filter((j) => ['COMPLETED', 'INVOICED', 'CANCELLED'].includes(j.status))
    .slice(0, 10)

  function JobCard({ job, showApprove = false }: {
    job: (typeof allJobs)[0]
    showApprove?: boolean
  }) {
    return (
      <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${priorityBadge(job.priority)}`}>
              {job.priority}
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadge(job.status)}`}>
              {job.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{job.title}</p>
          <p className="text-sm text-[#8a7968]">{job.property.addressLine1}, {job.property.postcode}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#8a7968]">
            {job.contractor && (
              <span>Contractor: <span className="text-[#1a1a1a] font-medium">{job.contractor.name}</span></span>
            )}
            {job.quoteAmount && (
              <span>Quote: <span className="text-[#1a1a1a] font-medium">{fmt(job.quoteAmount)}</span></span>
            )}
            {job.invoiceAmount && (
              <span>Invoice: <span className="text-[#1a1a1a] font-medium">{fmt(job.invoiceAmount)}</span></span>
            )}
            <span>Reported: <span className="text-[#1a1a1a] font-medium">{fmtDate(job.reportedAt)}</span></span>
            {job.completedAt && (
              <span>Completed: <span className="text-[#1a1a1a] font-medium">{fmtDate(job.completedAt)}</span></span>
            )}
          </div>
        </div>
        {showApprove && <ApproveMaintenanceButtons jobId={job.id} />}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1
          className="text-3xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Maintenance
        </h1>
        <p className="text-[#8a7968] text-sm mt-0.5">All maintenance jobs across your properties</p>
      </div>

      {/* Awaiting approval */}
      {awaitingApproval.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200">
            <h2 className="font-semibold text-[#1a1a1a] flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              <AlertTriangle size={16} className="text-amber-500" />
              Needs Your Approval ({awaitingApproval.length})
            </h2>
          </div>
          <div className="divide-y divide-amber-100">
            {awaitingApproval.map((job) => (
              <JobCard key={job.id} job={job} showApprove />
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
              In Progress ({inProgress.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {inProgress.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Recently Completed
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {completed.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {allJobs.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-[#1a1a1a] font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No maintenance jobs</p>
          <p className="text-[#8a7968] text-sm">All clear across your properties.</p>
        </div>
      )}
    </div>
  )
}
