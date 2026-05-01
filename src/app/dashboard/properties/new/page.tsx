'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Landlord {
  id: string
  firstName: string
  lastName: string
  companyName?: string
}

export default function NewPropertyPage() {
  const router = useRouter()
  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    addressLine1: '', addressLine2: '', town: 'London', area: '',
    postcode: '', propertyType: 'FLAT', tenure: 'LEASEHOLD',
    bedrooms: '2', bathrooms: '1', receptions: '1',
    sqFt: '', epcRating: '', councilTaxBand: '',
    yearBuilt: '', status: 'AVAILABLE', listingType: 'RENT',
    publishedOnWeb: false, landlordId: '',
  })

  useEffect(() => {
    fetch('/api/landlords?limit=100')
      .then((r) => r.json())
      .then((d) => setLandlords(d.landlords ?? []))
  }, [])

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create property')
      router.push(`/dashboard/properties/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent bg-white'
  const labelClass = 'block text-sm font-medium text-[#1a1a1a] mb-1'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/properties" className="text-gray-400 hover:text-[#1a1a1a] transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Add Property</h1>
          <p className="text-sm text-gray-500">Create a new property record</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Address</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Address Line 1 *</label>
              <input required className={inputClass} value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="e.g. Flat 4, 12 Calvert Avenue" />
            </div>
            <div>
              <label className={labelClass}>Address Line 2</label>
              <input className={inputClass} value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Area *</label>
                <input required className={inputClass} value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Shoreditch" />
              </div>
              <div>
                <label className={labelClass}>Town</label>
                <input className={inputClass} value={form.town} onChange={(e) => set('town', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Postcode *</label>
              <input required className={inputClass} value={form.postcode} onChange={(e) => set('postcode', e.target.value.toUpperCase())} placeholder="E2 7JP" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Property Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type *</label>
              <select required className={inputClass} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                <option value="FLAT">Flat</option>
                <option value="HOUSE">House</option>
                <option value="STUDIO">Studio</option>
                <option value="MAISONETTE">Maisonette</option>
                <option value="HMO">HMO</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tenure</label>
              <select className={inputClass} value={form.tenure} onChange={(e) => set('tenure', e.target.value)}>
                <option value="FREEHOLD">Freehold</option>
                <option value="LEASEHOLD">Leasehold</option>
                <option value="SHARE_OF_FREEHOLD">Share of Freehold</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Bedrooms *</label>
              <input required type="number" min="0" max="20" className={inputClass} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Bathrooms *</label>
              <input required type="number" min="0" max="20" className={inputClass} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Receptions</label>
              <input type="number" min="0" max="10" className={inputClass} value={form.receptions} onChange={(e) => set('receptions', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Sq Ft</label>
              <input type="number" className={inputClass} value={form.sqFt} onChange={(e) => set('sqFt', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>EPC Rating</label>
              <select className={inputClass} value={form.epcRating} onChange={(e) => set('epcRating', e.target.value)}>
                <option value="">—</option>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Council Tax Band</label>
              <select className={inputClass} value={form.councilTaxBand} onChange={(e) => set('councilTaxBand', e.target.value)}>
                <option value="">—</option>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Year Built</label>
              <input type="number" className={inputClass} value={form.yearBuilt} onChange={(e) => set('yearBuilt', e.target.value)} placeholder="e.g. 1995" />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="AVAILABLE">Available</option>
                <option value="LET">Let</option>
                <option value="LET_AGREED">Let Agreed</option>
                <option value="OFF_MARKET">Off Market</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-[#1a1a1a] mb-4">Ownership</h2>
          <div>
            <label className={labelClass}>Landlord *</label>
            <select required className={inputClass} value={form.landlordId} onChange={(e) => set('landlordId', e.target.value)}>
              <option value="">Select landlord…</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.firstName} {l.lastName}{l.companyName ? ` (${l.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="publishedOnWeb"
              checked={form.publishedOnWeb}
              onChange={(e) => set('publishedOnWeb', e.target.checked)}
              className="w-4 h-4 accent-[#1A3D2B]"
            />
            <label htmlFor="publishedOnWeb" className="text-sm text-[#1a1a1a]">Publish on website</label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create Property'}
          </button>
          <Link
            href="/dashboard/properties"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
