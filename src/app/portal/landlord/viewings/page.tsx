import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Eye, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDateTime(d: Date) {
  return format(new Date(d), 'EEE d MMM yyyy, h:mm a')
}

export default async function LandlordViewingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!landlord) redirect('/login')

  const viewings = await prisma.viewing.findMany({
    where: { property: { landlordId: landlord.id } },
    include: { property: { select: { addressLine1: true, area: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  const now = new Date()
  const upcoming = viewings.filter(v => !v.completed && new Date(v.scheduledAt) >= now)
  const past = viewings.filter(v => v.completed || new Date(v.scheduledAt) < now)
  const completedThisMonth = past.filter(v => {
    const d = new Date(v.scheduledAt)
    return d >= startOfMonth(now) && d <= endOfMonth(now) && v.completed
  })
  const totalThisYear = viewings.filter(v => {
    const d = new Date(v.scheduledAt)
    return d >= startOfYear(now) && d <= endOfYear(now)
  })

  const ViewingCard = ({ v }: { v: typeof viewings[0] }) => (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            {v.property.addressLine1}
          </p>
          <p className="text-xs text-[#8a7968]">{v.property.area}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#8a7968]">
            <span><span className="font-medium text-[#1a1a1a]">Viewer:</span> {v.firstName} {v.lastName}</span>
            <span><span className="font-medium text-[#1a1a1a]">Date:</span> {fmtDateTime(v.scheduledAt)}</span>
            <span><span className="font-medium text-[#1a1a1a]">Duration:</span> {v.duration} min</span>
          </div>
          {v.feedback && (
            <p className="mt-2 text-sm text-[#1a1a1a] bg-gray-50 rounded p-2 border border-gray-100 italic">
              &ldquo;{v.feedback}&rdquo;
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {v.completed ? (
            <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">
              <CheckCircle size={11} /> Completed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              <Clock size={11} /> Upcoming
            </span>
          )}
          {v.confirmed ? (
            <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded">Confirmed</span>
          ) : (
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">Unconfirmed</span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
          Viewings
        </h1>
        <p className="text-sm text-[#8a7968] mt-0.5">Viewing activity across your properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{upcoming.length}</p>
          <p className="text-xs text-[#8a7968] mt-0.5">Upcoming</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{completedThisMonth.length}</p>
          <p className="text-xs text-[#8a7968] mt-0.5">This Month</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{totalThisYear.length}</p>
          <p className="text-xs text-[#8a7968] mt-0.5">This Year</p>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="font-semibold text-[#1a1a1a] mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Eye size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#8a7968]">No upcoming viewings scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(v => <ViewingCard key={v.id} v={v} />)}
          </div>
        )}
      </div>

      {/* Past */}
      <div>
        <h2 className="font-semibold text-[#1a1a1a] mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Past Viewings</h2>
        {past.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-sm text-[#8a7968]">No past viewings yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map(v => <ViewingCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </div>
  )
}
