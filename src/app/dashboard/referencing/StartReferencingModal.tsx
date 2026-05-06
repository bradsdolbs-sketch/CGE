'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

type Tenant = {
  id: string
  firstName: string
  lastName: string
  user: { email: string }
  referenceApplications: { id: string }[]
}

export default function StartReferencingModal({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [sendInvite, setSendInvite] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableTenants = tenants.filter((t) => t.referenceApplications.length === 0)
  const busyCount = tenants.length - availableTenants.length

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) { setError('Select a tenant'); return }
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/referencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, monthlyRentTarget: monthlyRent || null, sendInvite }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setOpen(false)
      router.push(`/dashboard/referencing/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition"
      >
        <Plus size={15} /> Start referencing
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="font-bold text-[#1a1a1a]">Start Referencing Application</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tenant *</label>
                {tenants.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No tenants in the system yet. Add tenants via the Tenants dashboard first.</p>
                ) : availableTenants.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">All tenants already have active referencing applications.</p>
                ) : (
                  <>
                    <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={inputCls} required>
                      <option value="">Select tenant…</option>
                      {availableTenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} — {t.user.email}
                        </option>
                      ))}
                    </select>
                    {busyCount > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">{busyCount} tenant{busyCount !== 1 ? 's' : ''} already have active applications and are not shown.</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Monthly rent target (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="Used for affordability scoring"
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#1A3D2B] focus:ring-[#1A3D2B]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">Send invite email to tenant</p>
                  <p className="text-xs text-gray-500 mt-0.5">Emails the tenant with a link to complete their referencing form</p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || availableTenants.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {saving ? 'Starting…' : 'Start application'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
