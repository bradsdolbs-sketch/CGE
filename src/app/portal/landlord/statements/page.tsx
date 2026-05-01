import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Download } from 'lucide-react'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

export default async function LandlordStatementsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    include: {
      statements: {
        include: { lineItems: { orderBy: { date: 'asc' } } },
        orderBy: { periodStart: 'desc' },
      },
    },
  })

  if (!landlord) redirect('/login')

  const statements = landlord.statements

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1
          className="text-3xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Statements
        </h1>
        <p className="text-[#8a7968] text-sm mt-0.5">Your monthly landlord statements</p>
      </div>

      {statements.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-[#1a1a1a] font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No statements yet</p>
          <p className="text-[#8a7968] text-sm">Statements are generated monthly. Your first statement will appear here once rent has been received.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Period</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider hidden sm:table-cell">Dates</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Rent Received</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#8a7968] uppercase tracking-wider hidden md:table-cell">Fees</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#8a7968] uppercase tracking-wider hidden md:table-cell">Maintenance</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#8a7968] uppercase tracking-wider">Net Payout</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statements.map((stmt) => {
                  const netPayout =
                    stmt.rentReceived - stmt.feesDeducted - stmt.maintenanceCosts + stmt.otherCredits - stmt.otherDebits
                  return (
                    <tr key={stmt.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4 font-medium text-[#1a1a1a]">
                        {format(new Date(stmt.periodStart), 'MMMM yyyy')}
                      </td>
                      <td className="px-5 py-4 text-[#8a7968] text-xs hidden sm:table-cell">
                        {fmtDate(stmt.periodStart)} – {fmtDate(stmt.periodEnd)}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-[#1a1a1a]">{fmt(stmt.rentReceived)}</td>
                      <td className="px-5 py-4 text-right text-[#8a7968] hidden md:table-cell">{fmt(stmt.feesDeducted)}</td>
                      <td className="px-5 py-4 text-right text-[#8a7968] hidden md:table-cell">{fmt(stmt.maintenanceCosts)}</td>
                      <td className="px-5 py-4 text-right font-bold text-[#1a1a1a]">{fmt(netPayout)}</td>
                      <td className="px-5 py-4">
                        {stmt.pdfUrl ? (
                          <a
                            href={stmt.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-[#1A3D2B] hover:text-[#122B1E] font-semibold uppercase tracking-wide"
                            download
                          >
                            <Download size={14} />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-[#8a7968]">Pending</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
