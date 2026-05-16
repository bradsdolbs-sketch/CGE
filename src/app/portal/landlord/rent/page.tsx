import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

type PaymentStatus = 'PENDING' | 'PAID' | 'LATE' | 'PARTIAL' | 'VOID'

function statusBadgeClasses(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-gray-100 text-gray-600',
    LATE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    VOID: 'bg-gray-100 text-gray-400',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

function statusLabel(status: PaymentStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

const VALID_STATUSES = ['PAID', 'PENDING', 'LATE', 'PARTIAL', 'VOID'] as const

export default async function LandlordRentPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!landlord) redirect('/login')

  const payments = await prisma.rentPayment.findMany({
    where: { tenancy: { landlordId: landlord.id } },
    include: {
      tenancy: {
        include: {
          property: { select: { addressLine1: true, area: true } },
          tenants: {
            where: { isPrimary: true },
            include: { tenant: { select: { firstName: true, lastName: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { dueDate: 'desc' },
  })

  // Summary stats
  const totalReceived = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amountPaid, 0)

  const totalOutstanding = payments
    .filter((p) => p.status === 'LATE' || p.status === 'PARTIAL' || p.status === 'PENDING')
    .reduce((sum, p) => sum + Math.max(0, p.amount - p.amountPaid), 0)

  const paidOnTimeCount = payments.filter((p) => {
    if (p.status !== 'PAID' || !p.paidDate) return false
    return new Date(p.paidDate) <= new Date(p.dueDate)
  }).length

  // Filter
  const rawStatus = searchParams.status?.toUpperCase()
  const activeFilter =
    rawStatus && (VALID_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as PaymentStatus)
      : null

  const tabs: { label: string; value: string | null }[] = [
    { label: 'All', value: null },
    { label: 'Paid', value: 'PAID' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Late', value: 'LATE' },
  ]

  const filtered = activeFilter
    ? payments.filter((p) => p.status === activeFilter)
    : payments

  const today = new Date()

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Rent Payments
        </h1>
        <p className="text-[#8a7968] text-sm mt-0.5">Payment history across all your tenancies</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p
            className="text-xs uppercase tracking-wider text-[#8a7968] mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Total Received
          </p>
          <p
            className="text-3xl font-bold text-green-600"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {fmt(totalReceived)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p
            className="text-xs uppercase tracking-wider text-[#8a7968] mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Outstanding
          </p>
          <p
            className={`text-3xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-[#1a1a1a]'}`}
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {fmt(totalOutstanding)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p
            className="text-xs uppercase tracking-wider text-[#8a7968] mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Paid on Time
          </p>
          <p
            className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {paidOnTimeCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive =
            tab.value === null ? activeFilter === null : activeFilter === tab.value
          const href =
            tab.value === null
              ? '/portal/landlord/rent'
              : `/portal/landlord/rent?status=${tab.value.toLowerCase()}`
          return (
            <Link
              key={tab.label}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                isActive
                  ? 'border-[#1A3D2B] text-[#1A3D2B]'
                  : 'border-transparent text-[#8a7968] hover:text-[#1a1a1a]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p
            className="text-[#1a1a1a] font-semibold mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            No payments found
          </p>
          <p className="text-[#8a7968] text-sm">
            {activeFilter
              ? `No ${activeFilter.toLowerCase()} payments to display.`
              : 'No rent payments have been recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((payment) => {
                  const tenant = payment.tenancy.tenants[0]?.tenant
                  const tenantName = tenant
                    ? `${tenant.firstName} ${tenant.lastName}`
                    : '—'
                  const property = payment.tenancy.property
                  const daysOverdue =
                    payment.status === 'LATE'
                      ? differenceInDays(today, new Date(payment.dueDate))
                      : null

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1a1a1a]">{property.addressLine1}</p>
                        <p className="text-xs text-[#8a7968]">{property.area}</p>
                      </td>
                      <td className="px-4 py-4 text-[#1a1a1a]">{tenantName}</td>
                      <td className="px-4 py-4 text-[#8a7968]">{fmtDate(payment.dueDate)}</td>
                      <td className="px-4 py-4 text-right font-medium text-[#1a1a1a]">
                        {fmt(payment.amount)}
                      </td>
                      <td className="px-4 py-4 text-right text-[#1a1a1a]">
                        {payment.amountPaid > 0 ? fmt(payment.amountPaid) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadgeClasses(payment.status as PaymentStatus)}`}
                          >
                            {statusLabel(payment.status as PaymentStatus)}
                          </span>
                          {daysOverdue !== null && daysOverdue > 0 && (
                            <span className="text-xs text-red-600">
                              {daysOverdue}d overdue
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map((payment) => {
              const tenant = payment.tenancy.tenants[0]?.tenant
              const tenantName = tenant
                ? `${tenant.firstName} ${tenant.lastName}`
                : '—'
              const property = payment.tenancy.property
              const daysOverdue =
                payment.status === 'LATE'
                  ? differenceInDays(today, new Date(payment.dueDate))
                  : null

              return (
                <div key={payment.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{property.addressLine1}</p>
                      <p className="text-xs text-[#8a7968]">{tenantName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadgeClasses(payment.status as PaymentStatus)}`}
                      >
                        {statusLabel(payment.status as PaymentStatus)}
                      </span>
                      {daysOverdue !== null && daysOverdue > 0 && (
                        <span className="text-xs text-red-600">{daysOverdue}d overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-[#8a7968]">
                    <span>
                      Due: <span className="text-[#1a1a1a]">{fmtDate(payment.dueDate)}</span>
                    </span>
                    <span>
                      Amount: <span className="text-[#1a1a1a] font-medium">{fmt(payment.amount)}</span>
                    </span>
                    {payment.amountPaid > 0 && (
                      <span>
                        Paid: <span className="text-[#1a1a1a] font-medium">{fmt(payment.amountPaid)}</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
