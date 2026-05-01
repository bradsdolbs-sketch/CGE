import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, getYear } from 'date-fns'
import ExportCSVButton from './ExportCSVButton'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

function statusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    PAID: { cls: 'bg-green-100 text-green-700', label: 'Paid' },
    PENDING: { cls: 'bg-[#4a6fa5]/10 text-[#4a6fa5]', label: 'Pending' },
    LATE: { cls: 'bg-red-100 text-red-700', label: 'Late' },
    PARTIAL: { cls: 'bg-amber-100 text-amber-700', label: 'Partial' },
    VOID: { cls: 'bg-gray-100 text-gray-500', label: 'Void' },
  }
  const s = map[status] ?? { cls: 'bg-gray-100 text-gray-500', label: status }
  return s
}

export default async function TenantPaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/login')

  const tenant = await prisma.tenant.findUnique({
    where: { userId: session.user.id },
    include: {
      tenancies: {
        include: {
          tenancy: {
            include: {
              rentPayments: {
                orderBy: { dueDate: 'desc' },
              },
            },
          },
        },
        where: { tenancy: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER', 'EXPIRED'] } } },
        orderBy: { tenancy: { startDate: 'desc' } },
        take: 1,
      },
    },
  })

  const payments = tenant?.tenancies[0]?.tenancy?.rentPayments ?? []
  const thisYear = getYear(new Date())

  const totalPaidThisYear = payments
    .filter((p) => p.status === 'PAID' && p.paidDate && getYear(new Date(p.paidDate)) === thisYear)
    .reduce((sum, p) => sum + (p.amountPaid ?? p.amount), 0)

  const currentBalance = payments
    .filter((p) => p.status === 'LATE' || p.status === 'PARTIAL')
    .reduce((sum, p) => sum + (p.amount - p.amountPaid), 0)

  const csvData = payments.map((p) => ({
    month: format(new Date(p.dueDate), 'MMMM yyyy'),
    dueDate: fmtDate(p.dueDate),
    amount: p.amount,
    amountPaid: p.amountPaid,
    paidDate: fmtDate(p.paidDate),
    status: p.status,
    reference: p.reference ?? '',
  }))

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Payments
          </h1>
          <p className="text-[#8a7968] text-sm mt-0.5">Your rent payment history</p>
        </div>
        <ExportCSVButton data={csvData} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Paid This Year
          </p>
          <p className="text-2xl font-bold text-[#1a1a1a] mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {fmt(totalPaidThisYear)}
          </p>
          <p className="text-xs text-[#8a7968] mt-0.5">{thisYear}</p>
        </div>
        <div className={`rounded-lg border p-5 ${currentBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Outstanding Balance
          </p>
          <p className={`text-2xl font-bold mt-1 ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
            {fmt(currentBalance)}
          </p>
          <p className="text-xs text-[#8a7968] mt-0.5">
            {currentBalance > 0 ? 'Amount owed' : 'All payments up to date'}
          </p>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Payment History
          </h2>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[#8a7968] text-sm">No payment records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Month</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Due Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider hidden sm:table-cell">Paid Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const badge = statusBadge(p.status)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a]">
                        {format(new Date(p.dueDate), 'MMMM yyyy')}
                      </td>
                      <td className="px-5 py-3.5 text-[#8a7968]">{fmtDate(p.dueDate)}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#1a1a1a]">
                        {fmt(p.amount)}
                        {p.amountPaid > 0 && p.amountPaid < p.amount && (
                          <span className="text-xs text-[#8a7968] ml-1">({fmt(p.amountPaid)} paid)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#8a7968] hidden sm:table-cell">{fmtDate(p.paidDate)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
