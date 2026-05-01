'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewTenancyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillPropertyId = searchParams.get('propertyId') ?? ''

  const [properties, setProperties] = useState<{ id: string; addressLine1: string; area: string }[]>([])
  const [landlords, setLandlords] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [tenants, setTenants] = useState<{ id: string; firstName: string; lastName: string; user: { email: string } }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    propertyId: prefillPropertyId,
    landlordId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    depositAmount: '',
    depositScheme: 'TDS',
    depositRef: '',
    breakClauseDate: '',
    notes: '',
    tenantIds: [] as string[],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/properties?limit=100').then((r) => r.json()),
      fetch('/api/landlords?limit=100').then((r) => r.json()),
      fetch('/api/tenants?limit=100').then((r) => r.json()),
    ]).then(([p, l, t]) => {
      setProperties(p.properties ?? [])
      setLandlords(l.landlords ?? [])
      setTenants(t.tenants ?? [])
    })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTenant(id: string) {
    setForm((prev) => ({
      ...prev,
      tenantIds: prev.tenantIds.includes(id)
        ? prev.tenantIds.filter((t) => t !== id)
        : [...prev.tenantIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/tenancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create tenancy')
      router.push(`/dashboard/tenancies/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'
  const labelClass = 'block text-sm font-medium text-[#1a1a1a] mb-1'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tenancies" className="text-gray-400 hover:text-[#1a1a1a]"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">New Tenancy</h1>
          <p className="text-sm text-gray-500">Create a tenancy and auto-generate rent schedule</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className={labelClass}>Property *</label>
          <select required className={inputClass} value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)}>
            <option value="">Select property…</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.addressLine1}, {p.area}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Landlord *</label>
          <select required className={inputClass} value={form.landlordId} onChange={(e) => set('landlordId', e.target.value)}>
            <option value="">Select landlord…</option>
            {landlords.map((l) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tenants</label>
          <div className="space-y-2 mt-1">
            {tenants.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tenantIds.includes(t.id)}
                  onChange={() => toggleTenant(t.id)}
                  className="w-4 h-4 accent-[#1A3D2B]"
                />
                {t.firstName} {t.lastName} ({t.user?.email})
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date *</label>
            <input required type="date" className={inputClass} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>End Date *</label>
            <input required type="date" className={inputClass} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Rent (£pcm) *</label>
            <input required type="number" className={inputClass} value={form.rentAmount} onChange={(e) => set('rentAmount', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Deposit Amount (£) *</label>
            <input required type="number" className={inputClass} value={form.depositAmount} onChange={(e) => set('depositAmount', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Deposit Scheme</label>
            <select className={inputClass} value={form.depositScheme} onChange={(e) => set('depositScheme', e.target.value)}>
              <option>TDS</option>
              <option>DPS</option>
              <option>myDeposits</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Deposit Ref</label>
            <input className={inputClass} value={form.depositRef} onChange={(e) => set('depositRef', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Break Clause Date</label>
            <input type="date" className={inputClass} value={form.breakClauseDate} onChange={(e) => set('breakClauseDate', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea rows={3} className={inputClass} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Tenancy'}
          </button>
          <Link href="/dashboard/tenancies" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg transition">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
