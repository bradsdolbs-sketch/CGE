'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronDown, MapPin, Mail, Phone, Bed, Home, Loader2, Trash2, ExternalLink, Sparkles } from 'lucide-react'
import type { PropertyLead } from '@prisma/client'
import { format } from 'date-fns'

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACKS = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST', 'NURTURE'] as const
const STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED_WON', 'CLOSED_LOST'] as const

const TRACK_COLORS: Record<string, string> = {
  NEW:           'bg-blue-100 text-blue-700',
  CONTACTED:     'bg-indigo-100 text-indigo-700',
  QUALIFIED:     'bg-amber-100 text-amber-700',
  PROPOSAL_SENT: 'bg-purple-100 text-purple-700',
  WON:           'bg-green-100 text-green-700',
  LOST:          'bg-gray-100 text-gray-400',
  NURTURE:       'bg-orange-100 text-orange-700',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:         'bg-sky-100 text-sky-700',
  IN_PROGRESS:  'bg-amber-100 text-amber-700',
  CLOSED_WON:   'bg-green-100 text-green-700',
  CLOSED_LOST:  'bg-gray-100 text-gray-400',
}

const SERVICE_LABELS: Record<string, string> = {
  FULL_MANAGEMENT: 'Full management',
  TENANT_FIND:     'Tenant find',
  RENT_COLLECTION: 'Rent collection',
  NOT_SURE:        'Not sure',
}

const TIMING_LABELS: Record<string, string> = {
  immediately:    'Immediately',
  '1_month':      'Within 1 month',
  '3_months':     'Within 3 months',
  '6_months':     'Within 6 months',
  just_exploring: 'Just exploring',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadsClient({ leads: initial }: { leads: PropertyLead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initial)
  const [q, setQ] = useState('')
  const [trackFilter, setTrackFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<PropertyLead | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [drawerNotes, setDrawerNotes] = useState('')

  // Stats
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.track === 'NEW').length
  const wonLeads = leads.filter((l) => l.track === 'WON').length
  const paidLeads = leads.filter((l) => l.paidValuation).length

  // Filtered
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (trackFilter && l.track !== trackFilter) return false
      if (statusFilter && l.status !== statusFilter) return false
      if (q) {
        const search = q.toLowerCase()
        return (
          l.name.toLowerCase().includes(search) ||
          l.email.toLowerCase().includes(search) ||
          l.postcode.toLowerCase().includes(search) ||
          (l.phone ?? '').includes(search)
        )
      }
      return true
    })
  }, [leads, q, trackFilter, statusFilter])

  function openDrawer(lead: PropertyLead) {
    setSelected(lead)
    setDrawerNotes(lead.agentNotes ?? '')
  }

  async function updateLead(id: string, patch: Partial<Pick<PropertyLead, 'track' | 'status' | 'agentNotes'>>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) return
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
      if (selected?.id === id) setSelected(updated)
    } finally {
      setSaving(false)
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead permanently?')) return
    setDeleting(true)
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      setLeads((prev) => prev.filter((l) => l.id !== id))
      setSelected(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total leads', value: totalLeads },
          { label: 'New / uncontacted', value: newLeads, accent: newLeads > 0 },
          { label: 'Won', value: wonLeads },
          { label: 'Paid valuations', value: paidLeads },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`bg-white rounded-xl border p-4 text-center ${accent ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <p className={`text-2xl font-bold ${accent ? 'text-blue-700' : 'text-[#1a1a1a]'}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, postcode…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
          />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          <option value="">All tracks</option>
          {TRACKS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <a href="/landlords/valuation" target="_blank" className="flex items-center gap-1.5 text-sm text-[#1A3D2B] hover:underline ml-auto">
          <ExternalLink size={14} /> Preview bot
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Lead</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Postcode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">Property</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">Est. rent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Track</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No leads found</td></tr>
            ) : (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer transition ${selected?.id === lead.id ? 'bg-[#1A3D2B]/5' : ''}`}
                  onClick={() => openDrawer(lead)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a1a1a]">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.email}</p>
                    {lead.paidValuation && <span className="text-xs text-amber-600 font-medium">💳 Paid</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    <span className={`text-xs font-medium ${lead.inCatchment ? 'text-green-600' : 'text-orange-500'}`}>
                      {lead.postcode} {!lead.inCatchment && '(OOA)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                    {[lead.bedrooms && `${lead.bedrooms}bd`, lead.propertyType].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs font-medium">
                    {lead.estimatedRentLow && lead.estimatedRentHigh
                      ? `£${lead.estimatedRentLow.toLocaleString()}–£${lead.estimatedRentHigh.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TRACK_COLORS[lead.track] ?? 'bg-gray-100 text-gray-500'}`}>
                      {lead.track.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                    {format(new Date(lead.createdAt), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronDown size={14} className={`text-gray-400 transition ${selected?.id === lead.id ? 'rotate-180' : ''}`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Side drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/30" />
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[#1a1a1a] text-lg">{selected.name}</h2>
                  {selected.paidValuation && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Paid</span>}
                  {!selected.inCatchment && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Out of area</span>}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{format(new Date(selected.createdAt), 'd MMM yyyy HH:mm')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-[#1a1a1a] p-1"><X size={18} /></button>
            </div>

            {/* Contact */}
            <div className="p-5 border-b border-gray-50 space-y-2">
              <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-[#1A3D2B] hover:underline">
                <Mail size={14} className="text-gray-400" /> {selected.email}
              </a>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-[#1A3D2B] hover:underline">
                  <Phone size={14} className="text-gray-400" /> {selected.phone}
                </a>
              )}
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" /> {selected.postcode}
              </p>
            </div>

            {/* Property details */}
            <div className="p-5 border-b border-gray-50 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Property</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Type', value: selected.propertyType },
                  { label: 'Bedrooms', value: selected.bedrooms ? `${selected.bedrooms} bed` : null },
                  { label: 'Condition', value: selected.condition },
                  { label: 'Furnishing', value: selected.furnishing },
                  { label: 'Floor area', value: selected.sqft ? `${selected.sqft} sqft` : null },
                  { label: 'EPC', value: selected.epcRating },
                  { label: 'Service', value: SERVICE_LABELS[selected.serviceInterest] ?? selected.serviceInterest },
                  { label: 'Timing', value: TIMING_LABELS[selected.timing ?? ''] ?? selected.timing },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-medium text-[#1a1a1a] capitalize">{value}</p>
                  </div>
                ) : null)}
                {selected.estimatedRentLow && selected.estimatedRentHigh && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Estimated rent</p>
                    <p className="font-bold text-[#1A3D2B] text-lg">
                      £{selected.estimatedRentLow.toLocaleString()} – £{selected.estimatedRentHigh.toLocaleString()}<span className="text-sm font-normal text-gray-500"> /mo</span>
                    </p>
                  </div>
                )}
              </div>
              {selected.features && (() => {
                try {
                  const feats = JSON.parse(selected.features)
                  return feats.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {feats.map((f: string) => (
                          <span key={f} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{f}</span>
                        ))}
                      </div>
                    </div>
                  ) : null
                } catch { return null }
              })()}
            </div>

            {/* Pipeline controls */}
            <div className="p-5 border-b border-gray-50 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pipeline</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Track</label>
                  <select
                    value={selected.track}
                    onChange={(e) => updateLead(selected.id, { track: e.target.value as never })}
                    disabled={saving}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
                  >
                    {TRACKS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select
                    value={selected.status}
                    onChange={(e) => updateLead(selected.id, { status: e.target.value as never })}
                    disabled={saving}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Agent notes */}
            <div className="p-5 flex-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Agent notes</label>
              <textarea
                rows={5}
                value={drawerNotes}
                onChange={(e) => setDrawerNotes(e.target.value)}
                placeholder="Add notes, follow-up actions, valuation thoughts…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] resize-none"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => updateLead(selected.id, { agentNotes: drawerNotes })}
                  disabled={saving || drawerNotes === selected.agentNotes}
                  className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save notes
                </button>
                <button
                  onClick={() => deleteLead(selected.id)}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 ml-auto"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
