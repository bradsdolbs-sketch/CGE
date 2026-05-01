'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent bg-white'
const labelClass = 'block text-sm font-medium text-[#1a1a1a] mb-1'

export default function NewLandlordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    postcode: '',
    preferredContact: 'email',
    serviceLevel: 'FULL_MANAGEMENT',
    ukResident: true,
    nrlSchemeRef: '',
    notes: '',
  })

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/landlords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create landlord')
      router.push(`/dashboard/landlords/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/landlords" className="text-gray-400 hover:text-[#1a1a1a] transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Add Landlord</h1>
          <p className="text-sm text-gray-500">Create a new landlord account</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a]">Personal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                required
                className={inputClass}
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="James"
              />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                required
                className={inputClass}
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email Address *</label>
            <input
              required
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="james@example.com"
            />
            <p className="text-xs text-gray-400 mt-1">A login account will be created with this email. Default password: <code className="bg-gray-100 px-1 rounded">changeme123</code></p>
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+44 7700 900000"
            />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              className={inputClass}
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Optional — for portfolio landlords"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a]">Address</h2>
          <div>
            <label className={labelClass}>Address Line 1</label>
            <input
              className={inputClass}
              value={form.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Address Line 2</label>
            <input
              className={inputClass}
              value={form.addressLine2}
              onChange={(e) => set('addressLine2', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Postcode</label>
            <input
              className={inputClass}
              value={form.postcode}
              onChange={(e) => set('postcode', e.target.value.toUpperCase())}
              placeholder="EC2A 1NT"
            />
          </div>
        </div>

        {/* Management */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a]">Management</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Service Level</label>
              <select
                className={inputClass}
                value={form.serviceLevel}
                onChange={(e) => set('serviceLevel', e.target.value)}
              >
                <option value="FULL_MANAGEMENT">Full Management</option>
                <option value="TENANT_FIND">Tenant Find Only</option>
                <option value="RENT_COLLECTION">Rent Collection</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Preferred Contact</label>
              <select
                className={inputClass}
                value={form.preferredContact}
                onChange={(e) => set('preferredContact', e.target.value)}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ukResident"
              checked={form.ukResident}
              onChange={(e) => set('ukResident', e.target.checked)}
              className="w-4 h-4 accent-[#1A3D2B]"
            />
            <label htmlFor="ukResident" className="text-sm text-[#1a1a1a]">UK Resident</label>
          </div>
          {!form.ukResident && (
            <div>
              <label className={labelClass}>NRL Scheme Reference</label>
              <input
                className={inputClass}
                value={form.nrlSchemeRef}
                onChange={(e) => set('nrlSchemeRef', e.target.value)}
                placeholder="Non-Resident Landlord scheme ref"
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={3}
              className={inputClass}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any internal notes about this landlord…"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Creating…</> : 'Create Landlord'}
          </button>
          <Link
            href="/dashboard/landlords"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
