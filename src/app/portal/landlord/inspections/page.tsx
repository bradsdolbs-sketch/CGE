import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Calendar, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy, h:mm a')
}

function typeBadge(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    ROUTINE:   { label: 'Routine',   cls: 'bg-blue-100 text-blue-700' },
    CHECK_IN:  { label: 'Check-In',  cls: 'bg-green-100 text-green-700' },
    CHECK_OUT: { label: 'Check-Out', cls: 'bg-amber-100 text-amber-700' },
    MID_TERM:  { label: 'Mid-Term',  cls: 'bg-purple-100 text-purple-700' },
  }
  return map[type] ?? { label: type.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600' }
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    SCHEDULED:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-700',   icon: <Clock size={11} /> },
    IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700', icon: <Clock size={11} /> },
    COMPLETED:   { label: 'Completed',   cls: 'bg-green-50 text-green-700', icon: <CheckCircle size={11} /> },
    CANCELLED:   { label: 'Cancelled',   cls: 'bg-gray-100 text-gray-400',  icon: null },
  }
  return map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', icon: null }
}

export default async function LandlordInspectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!landlord) redirect('/login')

  const inspections = await prisma.inspection.findMany({
    where: { property: { landlordId: landlord.id } },
    include: { property: { select: { addressLine1: true, area: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  const now = new Date()
  const upcoming = inspections.filter(i => i.status === 'SCHEDULED' && new Date(i.scheduledAt) >= now)
  const completed = inspections.filter(i => i.status === 'COMPLETED')

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
          Inspections
        </h1>
        <p className="text-sm text-[#8a7968] mt-0.5">Scheduled and completed property inspections</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{upcoming.length}</p>
          <p className="text-xs text-[#8a7968] mt-0.5">Upcoming</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{completed.length}</p>
          <p className="text-xs text-[#8a7968] mt-0.5">Completed</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            {inspections.length}
          </p>
          <p className="text-xs text-[#8a7968] mt-0.5">Total</p>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[#8a7968] text-sm">No inspections recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const tb = typeBadge(insp.type)
            const sb = statusBadge(insp.status)
            return (
              <div key={insp.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {insp.property.addressLine1}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tb.cls}`}>{tb.label}</span>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${sb.cls}`}>
                        {sb.icon}{sb.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a7968]">{insp.property.area}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#8a7968]">
                      <span><span className="font-medium text-[#1a1a1a]">Scheduled:</span> {fmtDate(insp.scheduledAt)}</span>
                      {insp.completedAt && (
                        <span><span className="font-medium text-[#1a1a1a]">Completed:</span> {fmtDate(insp.completedAt)}</span>
                      )}
                      {insp.conductedBy && (
                        <span><span className="font-medium text-[#1a1a1a]">By:</span> {insp.conductedBy}</span>
                      )}
                    </div>
                    {insp.notes && insp.status === 'COMPLETED' && (
                      <p className="mt-2 text-sm text-[#1a1a1a] bg-gray-50 rounded p-2 border border-gray-100">
                        {insp.notes}
                      </p>
                    )}
                  </div>
                  {insp.pdfUrl && (
                    <a
                      href={insp.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] border border-[#1A3D2B] px-3 py-1.5 rounded transition flex-shrink-0"
                    >
                      <FileText size={13} />
                      Download Report
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
