'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, Trash2, ChevronLeft, ChevronRight, FileImage, X, Loader2, CheckCircle, Sparkles } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { addDays } from 'date-fns'
import { getFileUrl } from '@/lib/file-url'
import type { Property, Listing, Landlord, User, Tenancy, TenancyTenant, Tenant, ComplianceItem, MaintenanceRequest, Contractor, Inspection, PropertyType, PropertyStatus } from '@prisma/client'

type PropertyFull = Property & {
  listing: Listing | null
  landlord: Landlord & { user: User }
  tenancies: (Tenancy & { tenants: (TenancyTenant & { tenant: Tenant & { user: User } })[] })[]
  complianceItems: ComplianceItem[]
  maintenanceReqs: (MaintenanceRequest & { contractor: Contractor | null })[]
  inspections: Inspection[]
}

type LandlordOption = Landlord & { user: User }

interface Props {
  property: PropertyFull
  landlords: LandlordOption[]
}

const TABS = ['Details', 'Listing', 'Photos', 'Tenancy', 'Compliance', 'Maintenance', 'Notes']

function daysFromNow(d: Date | null) {
  if (!d) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function complianceColor(days: number | null) {
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-600 font-bold'
  if (days <= 30) return 'text-amber-600 font-semibold'
  return 'text-green-600'
}

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent bg-white'
const labelClass = 'block text-sm font-medium text-[#1a1a1a] mb-1'

export default function PropertyDetailClient({ property, landlords }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState('Details')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Details form state
  const [details, setDetails] = useState({
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2 ?? '',
    town: property.town,
    area: property.area,
    postcode: property.postcode,
    propertyType: property.propertyType,
    tenure: property.tenure ?? '',
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    receptions: String(property.receptions),
    sqFt: property.sqFt ? String(property.sqFt) : '',
    epcRating: property.epcRating ?? '',
    councilTaxBand: property.councilTaxBand ?? '',
    yearBuilt: property.yearBuilt ? String(property.yearBuilt) : '',
    status: property.status,
    listingType: property.listingType,
    publishedOnWeb: property.publishedOnWeb,
    landlordId: property.landlordId,
  })

  // Listing form state
  const [listing, setListing] = useState({
    price: property.listing?.price ? String(property.listing.price) : '',
    description: property.listing?.description ?? '',
    furnished: property.listing?.furnished ?? false,
    petsAllowed: property.listing?.petsAllowed ?? false,
    parking: property.listing?.parking ?? false,
    garden: property.listing?.garden ?? false,
    balcony: property.listing?.balcony ?? false,
    billsIncluded: property.listing?.billsIncluded ?? false,
    dssConsidered: property.listing?.dssConsidered ?? false,
    availableFrom: property.listing?.availableFrom ? new Date(property.listing.availableFrom).toISOString().split('T')[0] : '',
    publishRightmove: property.listing?.publishRightmove ?? false,
    publishZoopla: property.listing?.publishZoopla ?? false,
    features: property.listing?.features ?? [],
  })

  const [photos, setPhotos] = useState<string[]>(property.listing?.photos ?? [])
  const [floorplan, setFloorplan] = useState<string | null>(property.listing?.floorplan ?? null)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [photosSaved, setPhotosSaved] = useState(false)
  const photosTabRef = useRef<HTMLDivElement>(null)
  const [uploadingFloorplan, setUploadingFloorplan] = useState(false)
  const [newFeature, setNewFeature] = useState('')
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [copiedOpenRent, setCopiedOpenRent] = useState(false)

  const [newCompliance, setNewCompliance] = useState({ type: 'GAS_SAFETY', issueDate: '', expiryDate: '', certificateUrl: '' })
  const [addingCompliance, setAddingCompliance] = useState(false)

  // Photos dropzone — unlimited files, parallel upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: async (files) => {
      if (!files.length) return
      setUploadProgress({ done: 0, total: files.length })
      const results = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('subdir', 'properties')
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          setUploadProgress((prev) => prev ? { ...prev, done: prev.done + 1 } : null)
          if (res.ok) { const d = await res.json(); return d.url as string }
          return null
        })
      )
      const uploaded = results.filter(Boolean) as string[]
      setPhotos((prev) => [...prev, ...uploaded])
      setUploadProgress(null)
      // Scroll back to the top of the Photos tab so the new photos are visible
      photosTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  })

  // Floor plan dropzone — single file, images + PDF
  const { getRootProps: getFpRootProps, getInputProps: getFpInputProps, isDragActive: isFpDragActive } = useDropzone({
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    onDrop: async (files) => {
      const file = files[0]
      if (!file) return
      setUploadingFloorplan(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('subdir', 'properties/floorplans')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) { const d = await res.json(); setFloorplan(d.url) }
      setUploadingFloorplan(false)
    },
  })

  async function saveDetails() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function saveListing() {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...listing, price: parseInt(listing.price), photos }
      if (property.listing) {
        const res = await fetch(`/api/listings/${property.listing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error)
      } else {
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, propertyId: property.id }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
      }
      setSuccess(true)
      setTimeout(() => { setSuccess(false); router.refresh() }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save listing')
    } finally {
      setSaving(false)
    }
  }

  async function generateDescription() {
    setGeneratingDesc(true)
    setError(null)
    try {
      const res = await fetch('/api/listings/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate')
      setListing((prev) => ({ ...prev, description: data.description }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate description')
    } finally {
      setGeneratingDesc(false)
    }
  }

  async function savePhotos() {
    setSaving(true)
    setError(null)
    try {
      if (property.listing) {
        // Update existing listing with new photos
        const res = await fetch(`/api/listings/${property.listing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos, primaryPhoto: photos[0] ?? null, floorplan }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
      } else {
        // No listing yet — create a minimal one to hold the photos.
        // Price and description can be filled in later via the Listing tab.
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: property.id,
            photos,
            primaryPhoto: photos[0] ?? null,
            floorplan,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
      }
      setPhotosSaved(true)
      setTimeout(() => { setPhotosSaved(false); router.refresh() }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save photos')
    } finally {
      setSaving(false)
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= photos.length) return
    const arr = [...photos]
    ;[arr[index], arr[next]] = [arr[next], arr[index]]
    setPhotos(arr)
    setPhotosSaved(false)
  }

  async function addComplianceItem() {
    setAddingCompliance(true)
    try {
      await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCompliance, propertyId: property.id }),
      })
      router.refresh()
    } catch { setError('Failed to add compliance item') }
    finally { setAddingCompliance(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/properties" className="text-gray-400 hover:text-[#1a1a1a] transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{property.addressLine1}</h1>
          <p className="text-sm text-gray-500">{property.area}, {property.postcode}</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Saved successfully.</div>}

      {/* Tab bar */}
      <div className="border-b border-gray-200 flex gap-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t ? 'border-[#1A3D2B] text-[#1A3D2B]' : 'border-transparent text-gray-500 hover:text-[#1a1a1a]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === 'Details' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Address Line 1</label>
              <input className={inputClass} value={details.addressLine1} onChange={(e) => setDetails({ ...details, addressLine1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Address Line 2</label>
              <input className={inputClass} value={details.addressLine2} onChange={(e) => setDetails({ ...details, addressLine2: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Area</label>
              <input className={inputClass} value={details.area} onChange={(e) => setDetails({ ...details, area: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Postcode</label>
              <input className={inputClass} value={details.postcode} onChange={(e) => setDetails({ ...details, postcode: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={details.propertyType} onChange={(e) => setDetails({ ...details, propertyType: e.target.value as PropertyType })}>
                {['FLAT','HOUSE','STUDIO','MAISONETTE','HMO','COMMERCIAL'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tenure</label>
              <select className={inputClass} value={details.tenure} onChange={(e) => setDetails({ ...details, tenure: e.target.value })}>
                <option value="">—</option>
                <option value="FREEHOLD">Freehold</option>
                <option value="LEASEHOLD">Leasehold</option>
                <option value="SHARE_OF_FREEHOLD">Share of Freehold</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Beds</label>
              <input type="number" className={inputClass} value={details.bedrooms} onChange={(e) => setDetails({ ...details, bedrooms: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Baths</label>
              <input type="number" className={inputClass} value={details.bathrooms} onChange={(e) => setDetails({ ...details, bathrooms: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Receptions</label>
              <input type="number" className={inputClass} value={details.receptions} onChange={(e) => setDetails({ ...details, receptions: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Sq Ft</label>
              <input type="number" className={inputClass} value={details.sqFt} onChange={(e) => setDetails({ ...details, sqFt: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>EPC</label>
              <select className={inputClass} value={details.epcRating} onChange={(e) => setDetails({ ...details, epcRating: e.target.value })}>
                <option value="">—</option>
                {['A','B','C','D','E','F','G'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Council Tax Band</label>
              <select className={inputClass} value={details.councilTaxBand} onChange={(e) => setDetails({ ...details, councilTaxBand: e.target.value })}>
                <option value="">—</option>
                {['A','B','C','D','E','F','G','H'].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={details.status} onChange={(e) => setDetails({ ...details, status: e.target.value as PropertyStatus })}>
                {['AVAILABLE','LET','LET_AGREED','UNDER_OFFER','OFF_MARKET'].map((s) => <option key={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Landlord</label>
              <select className={inputClass} value={details.landlordId} onChange={(e) => setDetails({ ...details, landlordId: e.target.value })}>
                {landlords.map((l) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-1">
              <input type="checkbox" id="publishedOnWeb" checked={details.publishedOnWeb} onChange={(e) => setDetails({ ...details, publishedOnWeb: e.target.checked })} className="w-4 h-4 accent-[#1A3D2B]" />
              <label htmlFor="publishedOnWeb" className="text-sm text-[#1a1a1a]">Publish on website</label>
            </div>
          </div>
          <button onClick={saveDetails} disabled={saving} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Details'}
          </button>
        </div>
      )}

      {/* Listing Tab */}
      {tab === 'Listing' && (
        <div className="space-y-4 max-w-2xl">

          {/* ── Main listing form ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <label className={labelClass}>Price (£pcm)</label>
              <input type="number" className={inputClass} value={listing.price} onChange={(e) => setListing({ ...listing, price: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{ margin: 0 }}>Description</label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={generatingDesc}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60"
                  style={{ background: '#1A3D2B', color: '#f5f2ee' }}
                  title="Generate a description using AI — analyses the property details, location and photos"
                >
                  {generatingDesc ? (
                    <><Loader2 size={12} className="animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles size={12} /> Generate with AI</>
                  )}
                </button>
              </div>
              {generatingDesc && (
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <Loader2 size={12} className="animate-spin shrink-0" />
                  Analysing photos, looking up nearby stations, writing description… (~15s)
                </div>
              )}
              <textarea
                rows={8}
                className={inputClass}
                value={listing.description}
                onChange={(e) => setListing({ ...listing, description: e.target.value })}
                placeholder="Write a description or click 'Generate with AI' to create one automatically…"
              />
              <p className="mt-1 text-xs text-gray-400">
                AI analyses the property photos, looks up nearby stations, and writes a location-aware description. Upload photos first for best results.
              </p>
            </div>
            <div>
              <label className={labelClass}>Available From</label>
              <input type="date" className={inputClass} value={listing.availableFrom} onChange={(e) => setListing({ ...listing, availableFrom: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['furnished', 'Furnished'],
                ['petsAllowed', 'Pets Allowed'],
                ['parking', 'Parking'],
                ['garden', 'Garden'],
                ['balcony', 'Balcony'],
                ['billsIncluded', 'Bills Included'],
                ['dssConsidered', 'DSS Considered'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={listing[key as keyof typeof listing] as boolean}
                    onChange={(e) => setListing({ ...listing, [key]: e.target.checked })}
                    className="w-4 h-4 accent-[#1A3D2B]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <label className={labelClass}>Features</label>
              <div className="flex gap-2 mb-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newFeature.trim()) { setListing({ ...listing, features: [...listing.features, newFeature.trim()] }); setNewFeature('') }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newFeature.trim()) { setListing({ ...listing, features: [...listing.features, newFeature.trim()] }); setNewFeature('') }
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                >Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-[#F0EBE0] text-[#1A3D2B] rounded-full text-xs font-medium">
                    {f}
                    <button onClick={() => setListing({ ...listing, features: listing.features.filter((_, j) => j !== i) })} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={saveListing} disabled={saving} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Listing'}
            </button>
          </div>

          {/* ── OpenRent ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#1a1a1a]">OpenRent</span>
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wide">No API</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  OpenRent doesn&apos;t offer a public API — listings must be created manually on their site. Copy your listing details below, then paste into OpenRent to save time.
                </p>
              </div>
              <a
                href="https://www.openrent.co.uk/create-listing"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-medium text-[#1A3D2B] hover:underline whitespace-nowrap"
              >
                Open OpenRent →
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                const lines: string[] = []
                lines.push(`${property.addressLine1}${property.addressLine2 ? ', ' + property.addressLine2 : ''}`)
                lines.push(`${property.area}, ${property.postcode}`)
                lines.push('')
                if (listing.price) lines.push(`Rent: £${parseInt(listing.price).toLocaleString()} pcm`)
                lines.push(`${property.bedrooms} bedroom${property.bedrooms !== 1 ? 's' : ''} · ${property.bathrooms} bathroom${property.bathrooms !== 1 ? 's' : ''}`)
                lines.push(`Type: ${property.propertyType.charAt(0) + property.propertyType.slice(1).toLowerCase()}`)
                if (listing.availableFrom) {
                  lines.push(`Available from: ${new Date(listing.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`)
                }
                lines.push('')
                const attrs: string[] = []
                if (listing.furnished) attrs.push('Furnished')
                if (listing.petsAllowed) attrs.push('Pets allowed')
                if (listing.parking) attrs.push('Parking')
                if (listing.garden) attrs.push('Garden')
                if (listing.balcony) attrs.push('Balcony')
                if (listing.billsIncluded) attrs.push('Bills included')
                if (listing.dssConsidered) attrs.push('DSS / Housing Benefit considered')
                if (attrs.length > 0) { lines.push(attrs.join(' · ')); lines.push('') }
                if (listing.features.length > 0) {
                  lines.push('Features:')
                  listing.features.forEach((f) => lines.push(`• ${f}`))
                  lines.push('')
                }
                if (listing.description) lines.push(listing.description)
                navigator.clipboard.writeText(lines.join('\n'))
                setCopiedOpenRent(true)
                setTimeout(() => setCopiedOpenRent(false), 3000)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border"
              style={copiedOpenRent
                ? { background: 'rgba(26,61,43,0.06)', borderColor: '#1A3D2B', color: '#1A3D2B' }
                : { background: '#f9f9f9', borderColor: '#e5e5e5', color: '#1a1a1a' }
              }
            >
              {copiedOpenRent ? (
                <><CheckCircle size={14} /> Copied to clipboard</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy listing details
                </>
              )}
            </button>
            {copiedOpenRent && (
              <p className="mt-2 text-xs text-gray-400">Address, price, beds, features and description copied. Paste into OpenRent.</p>
            )}
          </div>

        </div>
      )}

      {/* Photos Tab */}
      {tab === 'Photos' && (
        <div ref={photosTabRef} className="space-y-8">

          {/* ── Property Photos ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a]">Property Photos</h2>
                <p className="text-xs text-gray-400 mt-0.5">First photo is the primary listing image. Drag to reorder using the arrows.</p>
              </div>
              {photos.length > 0 && (
                <span className="text-xs text-gray-400">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                isDragActive ? 'border-[#1A3D2B] bg-[#F0EBE0]' : 'border-gray-200 hover:border-[#1A3D2B] hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={28} className={`mx-auto mb-2 ${isDragActive ? 'text-[#1A3D2B]' : 'text-gray-300'}`} />
              {isDragActive ? (
                <p className="text-sm font-medium text-[#1A3D2B]">Drop photos here…</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 font-medium">Click to browse or drag &amp; drop multiple photos</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · up to 10MB each · unlimited files</p>
                </>
              )}
            </div>

            {/* Upload progress */}
            {uploadProgress && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 size={16} className="animate-spin text-blue-600 shrink-0" />
                <p className="text-sm text-blue-700">
                  Uploading {uploadProgress.done} / {uploadProgress.total} photos…
                </p>
              </div>
            )}

            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((url, i) => (
                  <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
                    <img src={getFileUrl(url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />

                    {/* Primary badge */}
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#1A3D2B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Primary
                      </span>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                      {/* Reorder arrows */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePhoto(i, -1)}
                          disabled={i === 0}
                          title="Move left"
                          className="bg-white/20 hover:bg-white/40 disabled:opacity-30 text-white rounded p-1 transition"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-white text-xs font-medium px-1">{i + 1}</span>
                        <button
                          onClick={() => movePhoto(i, 1)}
                          disabled={i === photos.length - 1}
                          title="Move right"
                          className="bg-white/20 hover:bg-white/40 disabled:opacity-30 text-white rounded p-1 transition"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Set primary / delete */}
                      <div className="flex items-center gap-2">
                        {i !== 0 && (
                          <button
                            onClick={() => { const a = [...photos]; const [item] = a.splice(i, 1); setPhotos([item, ...a]) }}
                            className="text-white text-[10px] font-semibold bg-[#1A3D2B] hover:bg-[#122B1E] px-2 py-1 rounded transition"
                          >
                            Set primary
                          </button>
                        )}
                        <button
                          onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                          title="Remove photo"
                          className="bg-red-500 hover:bg-red-600 text-white rounded p-1 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Floor Plan ── */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-[#1a1a1a]">Floor Plan</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upload a single floor plan image or PDF.</p>
            </div>

            {floorplan ? (
              <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                {floorplan.match(/\.(jpe?g|png|webp|gif)$/i) ? (
                  <img src={getFileUrl(floorplan)} alt="Floor plan" className="w-40 h-28 object-contain bg-white rounded border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-40 h-28 flex flex-col items-center justify-center bg-white rounded border border-gray-200 shrink-0 gap-2">
                    <FileImage size={28} className="text-gray-300" />
                    <span className="text-xs text-gray-400">PDF</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a] truncate">{floorplan.split('/').pop()}</p>
                  <div className="flex gap-3 mt-2">
                    <a href={getFileUrl(floorplan)} target="_blank" rel="noreferrer" className="text-xs text-[#1A3D2B] hover:text-[#122B1E] font-medium">
                      View →
                    </a>
                    <button onClick={() => setFloorplan(null)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <X size={12} /> Remove
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">To replace, remove this and upload a new file.</p>
                </div>
              </div>
            ) : (
              <div
                {...getFpRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  isFpDragActive ? 'border-[#1A3D2B] bg-[#F0EBE0]' : 'border-gray-200 hover:border-[#1A3D2B] hover:bg-gray-50'
                }`}
              >
                <input {...getFpInputProps()} />
                {uploadingFloorplan ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[#1A3D2B]" />
                    <p className="text-sm text-gray-500">Uploading floor plan…</p>
                  </div>
                ) : isFpDragActive ? (
                  <p className="text-sm font-medium text-[#1A3D2B]">Drop floor plan here…</p>
                ) : (
                  <>
                    <FileImage size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-600 font-medium">Click to browse or drag &amp; drop</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or PDF · up to 10MB</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={savePhotos}
              disabled={saving || !!uploadProgress || uploadingFloorplan}
              className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Saving…</>
              ) : photosSaved ? (
                <><CheckCircle size={15} /> Saved</>
              ) : (
                'Save Photos & Floor Plan'
              )}
            </button>
            {photosSaved && (
              <span className="text-sm text-[#1A3D2B] font-medium flex items-center gap-1.5">
                <CheckCircle size={14} />
                Photos saved successfully
              </span>
            )}
            {!photosSaved && !property.listing && photos.length > 0 && (
              <p className="text-xs text-gray-400">A listing record will be created automatically to hold your photos.</p>
            )}
          </div>
        </div>
      )}

      {/* Tenancy Tab */}
      {tab === 'Tenancy' && (
        <div className="space-y-4">
          {property.tenancies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">No tenancies for this property.</p>
              <Link href={`/dashboard/tenancies/new?propertyId=${property.id}`} className="inline-flex items-center gap-2 bg-[#1A3D2B] text-white text-sm font-medium px-4 py-2 rounded-lg">
                <Plus size={15} /> New Tenancy
              </Link>
            </div>
          ) : (
            property.tenancies.map((t) => (
              <Link key={t.id} href={`/dashboard/tenancies/${t.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-[#1A3D2B] transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">
                      {t.tenants.map((tt) => `${tt.tenant.firstName} ${tt.tenant.lastName}`).join(', ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(t.startDate).toLocaleDateString('en-GB')} → {new Date(t.endDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : t.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">£{t.rentAmount.toLocaleString()}/mo · Deposit: £{t.depositAmount.toLocaleString()}</p>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Compliance Tab */}
      {tab === 'Compliance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Certificate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Expiry Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Days Remaining</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Cert</th>
                </tr>
              </thead>
              <tbody>
                {property.complianceItems.map((item) => {
                  const days = daysFromNow(item.expiryDate)
                  return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium">{item.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-600">{item.issueDate ? new Date(item.issueDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className={`px-4 py-3 ${complianceColor(days)}`}>
                        {days === null ? '—' : days < 0 ? 'EXPIRED' : `${days} days`}
                      </td>
                      <td className="px-4 py-3">
                        {item.certificateUrl ? (
                          <a href={item.certificateUrl} target="_blank" className="text-[#4a6fa5] hover:text-[#3a5a8a] text-xs">View</a>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Add compliance item */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Add Compliance Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Certificate Type</label>
                <select className={inputClass} value={newCompliance.type} onChange={(e) => setNewCompliance({ ...newCompliance, type: e.target.value })}>
                  {['GAS_SAFETY','EICR','EPC','HMO_LICENCE','LEGIONELLA','PAT_TESTING','FIRE_SAFETY','RIGHT_TO_RENT'].map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Issue Date</label>
                <input type="date" className={inputClass} value={newCompliance.issueDate} onChange={(e) => setNewCompliance({ ...newCompliance, issueDate: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Expiry Date</label>
                <input type="date" className={inputClass} value={newCompliance.expiryDate} onChange={(e) => setNewCompliance({ ...newCompliance, expiryDate: e.target.value })} />
              </div>
            </div>
            <button onClick={addComplianceItem} disabled={addingCompliance} className="mt-4 flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
              <Plus size={15} /> {addingCompliance ? 'Adding…' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {tab === 'Maintenance' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold">Maintenance Requests</h2>
            <Link href={`/dashboard/maintenance?propertyId=${property.id}`} className="text-xs text-[#1A3D2B]">View all →</Link>
          </div>
          {property.maintenanceReqs.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">No maintenance requests</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50 bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Title</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Contractor</th>
              </tr></thead>
              <tbody>
                {property.maintenanceReqs.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/maintenance/${m.id}`} className="text-[#1A3D2B] hover:text-[#122B1E]">{m.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.priority === 'EMERGENCY' ? 'bg-red-100 text-red-700' : m.priority === 'URGENT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {m.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.contractor?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {tab === 'Notes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500 text-sm">Notes for this property are managed at tenancy/landlord level.</p>
        </div>
      )}
    </div>
  )
}
