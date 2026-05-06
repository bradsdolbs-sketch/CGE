'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

type Fee = {
  id: string
  type: string
  amount: number
  description: string | null
  paidAt: Date | null
  createdAt: Date
  landlord: { id: string; firstName: string; lastName: string; user: { email: string } }
}

type Landlord = {
  id: string
  firstName: string
  lastName: string
  user: { email: string }
}

const FEE_TYPES = [
  { value: 'MANAGEMENT', label: 'Management Fee' },
  { value: 'TENANT_FIND', label: 'Tenant Find' },
  { value: 'RENEWAL', label: 'Renewal Fee' },
  { value: 'CHECKOUT', label: 'Check-Out Fee' },
  { value: 'MAINTENANCE_MARKUP', label: 'Maintenance Markup' },
  { value: 'ONE_OFF', label: 'One-Off Charge' },
]

const TYPE_BADGE: Record<string, string> = {
  MANAGEMENT: 'bg-blue-100 text-blue-700',
  TENANT_FIND: 'bg-purple-100 text-purple-700',
  RENEWAL: 'bg-green-100 text-green-700',
  CHECKOUT: 'bg-amber-100 text-amber-700',
  MAINTENANCE_MARKUP: 'bg-orange-100 text-orange-700',
  ONE_OFF: 'bg-gray-100 text-gray-600',
}

export default function FeesClient({ fees, landlords }: { fees: Fee[]; landlords: Landlord[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ landlordId: '', type: 'MANAGEMENT', amount: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [landlordFilter, setLandlordFilter] = useState('ALL')

  const filtered = landlordFilter === 'ALL' ? fees : fees.filter((f) => f.landlord.id === landlordFilter)

  async function createFee(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.landlordId || !form.amount) { setError('Landlord and amount are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Math.round(parseFloat(form.amount)) }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setShowForm(false)
      setForm({ landlordId: '', type: 'MANAGEMENT', amount: '', description: '' })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function markPaid(feeId: string) {
    setMarkingPaid(feeId)
    try {
      await fetch(`/api/fees/${feeId}/paid`, { method: 'POST' })
      router.refresh()
    } finally {
      setMarkingPaid(null)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <select
          value={landlordFilter}
          onChange={(e) => setLandlordFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
        >
          <option value="ALL">All landlords</option>
          {landlords.map((l) => (
            <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={15} /> Add fee
        </button>
      </div>

      {/* Add fee form */}
      {showForm && (
        <div className="bg-white border border-[#1A3D2B]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#1a1a1a]">New Fee</p>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <form onSubmit={createFee} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Landlord *</label>
              <select value={form.landlordId} onChange={(e) => setForm((f) => ({ ...f, landlordId: e.target.value }))} className={inputCls} required>
                <option value="">Select landlord…</option>
                {landlords.map((l) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Fee type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls}>
                {FEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (£) *</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Saving…' : 'Create fee'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No fees recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Landlord</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                      {fee.landlord.firstName} {fee.landlord.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${TYPE_BADGE[fee.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {FEE_TYPES.find((t) => t.value === fee.type)?.label ?? fee.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1a1a1a]">£{fee.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{fee.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {format(new Date(fee.createdAt), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      {fee.paidAt ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 size={13} /> Paid {format(new Date(fee.paidAt), 'd MMM')}
                        </span>
                      ) : (
                        <button
                          onClick={() => markPaid(fee.id)}
                          disabled={markingPaid === fee.id}
                          className="text-xs text-[#1A3D2B] hover:text-[#122B1E] font-medium transition disabled:opacity-50"
                        >
                          {markingPaid === fee.id ? 'Marking…' : 'Mark paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
