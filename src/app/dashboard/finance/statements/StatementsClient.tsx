'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText } from 'lucide-react'
import type { LandlordStatement, Landlord, User } from '@prisma/client'

type StatementRow = LandlordStatement & { landlord: Landlord & { user: User } }
type LandlordOption = Landlord & { user: User }

function fmt(pence: number) { return `£${pence.toLocaleString()}` }

export default function StatementsClient({ landlords, statements }: { landlords: LandlordOption[]; statements: StatementRow[] }) {
  const router = useRouter()
  const [selectedLandlord, setSelectedLandlord] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [generating, setGenerating] = useState(false)

  const filtered = useMemo(() => {
    if (!selectedLandlord) return statements
    return statements.filter((s) => s.landlordId === selectedLandlord)
  }, [statements, selectedLandlord])

  async function generateStatement() {
    if (!selectedLandlord || !periodStart || !periodEnd) return
    setGenerating(true)
    try {
      await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId: selectedLandlord, periodStart, periodEnd }),
      })
      router.refresh()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-[#1a1a1a] mb-4">Generate Statement</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Landlord</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white" value={selectedLandlord} onChange={(e) => setSelectedLandlord(e.target.value)}>
              <option value="">All landlords</option>
              {landlords.map((l) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period Start</label>
            <input type="date" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period End</label>
            <input type="date" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <button
            onClick={generateStatement}
            disabled={!selectedLandlord || !periodStart || !periodEnd || generating}
            className="flex items-center gap-2 justify-center bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
          >
            <FileText size={15} />
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white" value={selectedLandlord} onChange={(e) => setSelectedLandlord(e.target.value)}>
          <option value="">All Landlords</option>
          {landlords.map((l) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No statements yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Landlord</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Period</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rent Received</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fees</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Net Payout</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">PDF</th>
            </tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{s.landlord.firstName} {s.landlord.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} –{' '}
                    {new Date(s.periodEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">{fmt(s.rentReceived)}</td>
                  <td className="px-4 py-3 text-red-500">-{fmt(s.feesDeducted)}</td>
                  <td className="px-4 py-3 font-bold text-[#1a1a1a]">{fmt(s.closingBalance)}</td>
                  <td className="px-4 py-3">
                    {s.pdfUrl ? (
                      <a href={s.pdfUrl} target="_blank" className="flex items-center gap-1 text-xs text-[#1A3D2B] hover:text-[#122B1E]">
                        <Download size={13} />PDF
                      </a>
                    ) : <span className="text-gray-400 text-xs">No PDF</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
