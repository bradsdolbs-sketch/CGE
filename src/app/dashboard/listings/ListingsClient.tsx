'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Pencil, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type Listing = {
  id: string
  propertyId: string
  price: number
  priceFrequency: string
  availableFrom: Date | null
  description: string
  shortDescription: string | null
  furnished: boolean
  billsIncluded: boolean
  parking: boolean
  petsAllowed: boolean
  createdAt: Date
  updatedAt: Date
  property: {
    id: string
    addressLine1: string
    area: string
    postcode: string
    bedrooms: number
    propertyType: string
    status: string
  }
}

type Property = {
  id: string
  addressLine1: string
  area: string
  postcode: string
  bedrooms: number
}

type NewListingForm = {
  propertyId: string
  price: string
  availableFrom: string
  description: string
  shortDescription: string
  furnished: boolean
  billsIncluded: boolean
  parking: boolean
  petsAllowed: boolean
}

const emptyForm: NewListingForm = {
  propertyId: '',
  price: '',
  availableFrom: '',
  description: '',
  shortDescription: '',
  furnished: false,
  billsIncluded: false,
  parking: false,
  petsAllowed: false,
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

export default function ListingsClient({
  listings,
  unlistedProperties,
}: {
  listings: Listing[]
  unlistedProperties: Property[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewListingForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editShort, setEditShort] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function set(k: keyof NewListingForm, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function createListing(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.propertyId || !form.price || !form.description) {
      setError('Property, price, and description are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseInt(form.price),
          availableFrom: form.availableFrom || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create listing')
      setShowForm(false)
      setForm(emptyForm)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(l: Listing) {
    setEditingId(l.id)
    setEditPrice(String(l.price))
    setEditDesc(l.description)
    setEditShort(l.shortDescription ?? '')
  }

  async function saveEdit(id: string) {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseInt(editPrice), description: editDesc, shortDescription: editShort }),
      })
      if (!res.ok) throw new Error()
      setEditingId(null)
      router.refresh()
    } finally {
      setEditSaving(false)
    }
  }

  async function deleteListing(id: string) {
    if (!confirm('Remove this listing? The property will remain in the system.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/listings/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{unlistedProperties.length} properties available to list</p>
        {unlistedProperties.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={15} /> Create listing
          </button>
        )}
      </div>

      {/* Create listing form */}
      {showForm && (
        <div className="bg-white border border-[#1A3D2B]/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#1a1a1a]">New Listing</p>
            <button onClick={() => { setShowForm(false); setError(null) }}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <form onSubmit={createListing} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Property *</label>
                <select value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)} className={inputCls} required>
                  <option value="">Select property…</option>
                  {unlistedProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.addressLine1}, {p.area} {p.postcode} — {p.bedrooms} bed
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rent (£pcm) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Available from</label>
                <input type="date" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Short description (tagline)</label>
                <input type="text" placeholder="e.g. Bright 2-bed in Bethnal Green" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Full description *</label>
                <textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${inputCls} resize-none`} required />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { key: 'furnished', label: 'Furnished' },
                { key: 'billsIncluded', label: 'Bills included' },
                { key: 'parking', label: 'Parking' },
                { key: 'petsAllowed', label: 'Pets allowed' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form[key as keyof NewListingForm] as boolean}
                    onChange={(e) => set(key as keyof NewListingForm, e.target.checked)}
                    className="rounded border-gray-300 text-[#1A3D2B] focus:ring-[#1A3D2B]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Creating…' : 'Create listing'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-16 text-center">
          <p className="text-gray-500 font-medium">No listings yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a listing to publish a property to portals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1a1a1a]">{l.property.addressLine1}</p>
                      <Link href={`/properties/${l.property.id}`} target="_blank" className="text-gray-400 hover:text-[#1A3D2B]">
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{l.property.area} · {l.property.postcode} · {l.property.bedrooms} bed · {l.property.propertyType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#1A3D2B]">£{l.price.toLocaleString()} pcm</span>
                    <button onClick={() => startEdit(l)} className="p-1.5 text-gray-400 hover:text-[#1A3D2B] transition" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteListing(l.id)}
                      disabled={deletingId === l.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition disabled:opacity-40"
                      title="Remove listing"
                    >
                      {deletingId === l.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {editingId === l.id ? (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price (£pcm)</label>
                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
                        <input type="text" value={editShort} onChange={(e) => setEditShort(e.target.value)} className={inputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={`${inputCls} resize-none`} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => saveEdit(l.id)} disabled={editSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3D2B] text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                        {editSaving ? <Loader2 size={13} className="animate-spin" /> : null}
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {l.shortDescription || l.description}
                  </p>
                )}

                {/* Footer row */}
                <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="ml-auto text-xs text-gray-400">
                    Updated {format(new Date(l.updatedAt), 'd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
