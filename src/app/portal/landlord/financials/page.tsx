import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfYear, endOfYear, getMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function LandlordFinancialsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlordBase = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!landlordBase) redirect('/login')

  const now = new Date()
  const yearStart = startOfYear(now)
  const yearEnd = endOfYear(now)

  const [landlord, rentPayments, statements] = await Promise.all([
    prisma.landlord.findUnique({
      where: { id: landlordBase.id },
      include: {
        tenancies: {
          where: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] } },
          select: { rentAmount: true },
        },
      },
    }),
    prisma.rentPayment.findMany({
      where: {
        tenancy: { landlordId: landlordBase.id },
        status: 'PAID',
        paidDate: { gte: yearStart, lte: yearEnd },
      },
      select: { amountPaid: true, paidDate: true },
    }),
    prisma.landlordStatement.findMany({
      where: { landlordId: landlordBase.id },
      orderBy: { periodStart: 'desc' },
    }),
  ])

  if (!landlord) redirect('/login')

  const monthlyRentRoll = landlord.tenancies.reduce((s, t) => s + t.rentAmount, 0)

  const totalReceivedThisYear = rentPayments.reduce((s, p) => s + p.amountPaid, 0)

  const thisYearStatements = statements.filter(s => {
    const d = new Date(s.periodStart)
    return d >= yearStart && d <= yearEnd
  })
  const totalFeesThisYear = thisYearStatements.reduce((s, st) => s + st.feesDeducted, 0)

  // Monthly breakdown from statements
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const stmt = thisYearStatements.find(s => getMonth(new Date(s.periodStart)) === i)
    return {
      month: MONTHS[i],
      rentReceived: stmt?.rentReceived ?? 0,
      fees: stmt?.feesDeducted ?? 0,
      maintenance: stmt?.maintenanceCosts ?? 0,
      net: stmt ? stmt.rentReceived - stmt.feesDeducted - stmt.maintenanceCosts + stmt.otherCredits - stmt.otherDebits : 0,
    }
  })

  const maxBar = Math.max(...monthlyData.map(m => m.rentReceived), 1)

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
          Financial Summary
        </h1>
        <p className="text-sm text-[#8a7968] mt-0.5">Income and fees for your portfolio</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Monthly Rent Roll</p>
          <p className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{fmt(monthlyRentRoll)}</p>
          <p className="text-xs text-[#8a7968] mt-1">across active tenancies</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Received This Year</p>
          <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Syne, sans-serif' }}>{fmt(totalReceivedThisYear)}</p>
          <p className="text-xs text-[#8a7968] mt-1">{now.getFullYear()} to date</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Fees This Year</p>
          <p className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>{fmt(totalFeesThisYear)}</p>
          <p className="text-xs text-[#8a7968] mt-1">management &amp; other fees</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          {now.getFullYear()} — Month by Month
        </h2>
        <div className="flex items-end gap-1.5 h-32">
          {monthlyData.map((m) => {
            const height = m.rentReceived > 0 ? Math.max(4, Math.round((m.rentReceived / maxBar) * 100)) : 0
            const isFuture = MONTHS.indexOf(m.month) > now.getMonth()
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div
                    className={`w-full rounded-t transition-all ${isFuture ? 'bg-gray-100' : 'bg-[#1A3D2B]'}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                {m.rentReceived > 0 && (
                  <div className="absolute bottom-full mb-1 bg-[#1a1a1a] text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                    {fmt(m.rentReceived)}
                  </div>
                )}
                <p className="text-[10px] text-[#8a7968]">{m.month}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Statements table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>Statements</h2>
        </div>
        {statements.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#8a7968]">No statements generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8a7968]">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#8a7968]">Rent In</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#8a7968]">Fees</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#8a7968]">Maintenance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#8a7968]">Net Payout</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#8a7968]">PDF</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((stmt) => {
                  const net = stmt.rentReceived - stmt.feesDeducted - stmt.maintenanceCosts + stmt.otherCredits - stmt.otherDebits
                  return (
                    <tr key={stmt.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                        {format(new Date(stmt.periodStart), 'MMMM yyyy')}
                        <span className="block text-xs text-[#8a7968] font-normal">
                          {fmtDate(stmt.periodStart)} – {fmtDate(stmt.periodEnd)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#1a1a1a]">{fmt(stmt.rentReceived)}</td>
                      <td className="px-4 py-3 text-right text-[#8a7968]">{fmt(stmt.feesDeducted)}</td>
                      <td className="px-4 py-3 text-right text-[#8a7968]">{fmt(stmt.maintenanceCosts)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a]">{fmt(net)}</td>
                      <td className="px-4 py-3 text-center">
                        {stmt.pdfUrl ? (
                          <a href={stmt.pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] uppercase tracking-wide">
                            PDF
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-[#8a7968] text-center">
        For full tax documentation, download your annual statements or contact your accountant.
        Questions? Email <a href="mailto:hello@centralgateestates.com" className="underline">hello@centralgateestates.com</a>
      </p>
    </div>
  )
}
