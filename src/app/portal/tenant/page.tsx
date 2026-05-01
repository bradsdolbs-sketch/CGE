import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { differenceInDays, format } from 'date-fns'
import { Wrench, FileText, MessageCircle, AlertTriangle } from 'lucide-react'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRING_SOON: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    HOLDING_OVER: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-gray-100 text-gray-600',
    TERMINATED: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export default async function TenantPortalPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      tenantRecord: {
        include: {
          tenancies: {
            include: {
              tenancy: {
                include: {
                  property: true,
                  rentPayments: {
                    orderBy: { dueDate: 'desc' },
                    take: 5,
                  },
                },
              },
            },
            where: { tenancy: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] } } },
            take: 1,
          },
        },
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  })

  const tenant = user?.tenantRecord
  const activeTenancy = tenant?.tenancies[0]?.tenancy ?? null
  const property = activeTenancy?.property ?? null
  const firstName = tenant?.firstName ?? user?.name?.split(' ')[0] ?? 'there'
  const now = new Date()

  // Progress bar for tenancy
  const totalDays = activeTenancy
    ? differenceInDays(new Date(activeTenancy.endDate), new Date(activeTenancy.startDate))
    : 0
  const daysElapsed = activeTenancy
    ? differenceInDays(now, new Date(activeTenancy.startDate))
    : 0
  const daysRemaining = activeTenancy
    ? differenceInDays(new Date(activeTenancy.endDate), now)
    : 0
  const progressPct = totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0

  // Next payment
  const nextPayment = activeTenancy?.rentPayments.find(
    (p) => p.status === 'PENDING' || p.status === 'LATE'
  ) ?? null
  const daysUntilPayment = nextPayment
    ? differenceInDays(new Date(nextPayment.dueDate), now)
    : null

  const notifTypeLabel: Record<string, string> = {
    COMPLIANCE_EXPIRY: 'Compliance',
    RENT_ARREARS: 'Rent',
    MAINTENANCE_UPDATE: 'Maintenance',
    LEASE_EXPIRY: 'Lease',
    INSPECTION_DUE: 'Inspection',
    NEW_ENQUIRY: 'Enquiry',
    VIEWING_BOOKED: 'Viewing',
    GENERAL: 'General',
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Welcome */}
      <div>
        <h1
          className="text-4xl font-extrabold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Welcome back, {firstName}
        </h1>
        <p className="text-[#8a7968] mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Here&apos;s your tenancy overview.
        </p>
      </div>

      {/* Tenancy card */}
      {activeTenancy && property ? (
        <div className="bg-[#1a1a1a] rounded-lg p-8 text-[#f5f2ee]">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#1A3D2B] mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                Your Home
              </p>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {property.addressLine1}
                {property.addressLine2 ? `, ${property.addressLine2}` : ''}
              </h2>
              <p className="text-[#f5f2ee]/60 text-sm mt-0.5">
                {property.area}, {property.postcode}
              </p>
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded ${statusBadge(activeTenancy.status)}`}>
              {activeTenancy.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-xs text-[#f5f2ee]/50 uppercase tracking-wider">Rent</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                {fmt(activeTenancy.rentAmount)}
              </p>
              <p className="text-xs text-[#f5f2ee]/50">{activeTenancy.rentFrequency}</p>
            </div>
            <div>
              <p className="text-xs text-[#f5f2ee]/50 uppercase tracking-wider">Start Date</p>
              <p className="text-sm font-medium mt-1">{fmtDate(activeTenancy.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-[#f5f2ee]/50 uppercase tracking-wider">End Date</p>
              <p className="text-sm font-medium mt-1">{fmtDate(activeTenancy.endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-[#f5f2ee]/50 uppercase tracking-wider">Deposit</p>
              <p className="text-sm font-medium mt-1">{fmt(activeTenancy.depositAmount)}</p>
              <p className="text-xs text-[#f5f2ee]/50">
                {activeTenancy.depositScheme ?? 'TDS'} • {activeTenancy.depositRef ?? '—'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-[#f5f2ee]/50 mb-2">
              <span>Tenancy progress</span>
              <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Tenancy ended'}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A3D2B] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-[#8a7968]">No active tenancy found. Please contact your agent.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next payment */}
        <div
          className={`rounded-lg p-6 border-2 ${
            nextPayment?.status === 'LATE'
              ? 'border-red-400 bg-red-50'
              : 'border-[#1A3D2B] bg-white'
          }`}
        >
          <p
            className="text-xs uppercase tracking-widest text-[#1A3D2B] mb-3"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Next Payment
          </p>
          {nextPayment ? (
            <>
              {nextPayment.status === 'LATE' && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-3">
                  <AlertTriangle size={16} />
                  This payment is overdue
                </div>
              )}
              <p
                className="text-3xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {fmt(nextPayment.amount)}
              </p>
              <p className="text-sm text-[#8a7968] mt-1">
                Due {fmtDate(nextPayment.dueDate)}
                {daysUntilPayment !== null && (
                  <span className={`ml-2 font-medium ${daysUntilPayment < 0 ? 'text-red-600' : 'text-[#1a1a1a]'}`}>
                    ({daysUntilPayment < 0 ? `${Math.abs(daysUntilPayment)} days overdue` : `in ${daysUntilPayment} days`})
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-[#8a7968] text-sm">No upcoming payment due.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p
            className="text-xs uppercase tracking-widest text-[#8a7968] mb-4"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Quick Actions
          </p>
          <div className="space-y-3">
            <Link
              href="/portal/tenant/maintenance/new"
              className="flex items-center gap-3 p-3 rounded bg-[#f5f2ee] hover:bg-[#ede9e3] transition text-sm font-medium text-[#1a1a1a]"
            >
              <Wrench size={16} className="text-[#1A3D2B]" />
              Report an Issue
            </Link>
            <Link
              href="/portal/tenant/documents"
              className="flex items-center gap-3 p-3 rounded bg-[#f5f2ee] hover:bg-[#ede9e3] transition text-sm font-medium text-[#1a1a1a]"
            >
              <FileText size={16} className="text-[#1A3D2B]" />
              View Documents
            </Link>
            <a
              href="https://wa.link/gy7gtr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded bg-[#f5f2ee] hover:bg-[#ede9e3] transition text-sm font-medium text-[#1a1a1a]"
            >
              <MessageCircle size={16} className="text-[#1A3D2B]" />
              Contact Agent
            </a>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {user?.notifications && user.notifications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Recent Notifications
            </h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {user.notifications.map((n) => (
              <li key={n.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[#4a6fa5] bg-[#4a6fa5]/10 px-2 py-0.5 rounded">
                    {notifTypeLabel[n.type] ?? n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a]">{n.title}</p>
                    <p className="text-xs text-[#8a7968] mt-0.5">{n.message}</p>
                  </div>
                  <span className="text-xs text-[#8a7968] whitespace-nowrap">
                    {format(new Date(n.createdAt), 'd MMM')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
