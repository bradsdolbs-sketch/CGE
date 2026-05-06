'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Star, Phone, Mail, Shield, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight, Wrench } from 'lucide-react'

const TRADE_COLOURS: Record<string, string> = {
  Plumbing: 'bg-blue-50 text-blue-700 border-blue-200',
  Electrical: 'bg-amber-50 text-amber-700 border-amber-200',
  Heating: 'bg-orange-50 text-orange-700 border-orange-200',
  Structural: 'bg-charcoal-100 text-charcoal border-charcoal-300',
  Cleaning: 'bg-green-50 text-green-700 border-green-200',
  Locksmith: 'bg-slate-50 text-slate-600 border-slate-200',
  General: 'bg-cream-200 text-taupe border-cream-300',
}

interface Contractor { id: string; name: string; companyName: string | null; trade: string; phone: string; email: string | null; insuranceExpiry: string | null; gasSafeNumber: string | null; niceicNumber: string | null; rating: number; active: boolean; _count: { jobs: number } }

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(rating) ? 'fill-terracotta text-terracotta' : 'fill-cream-300 text-cream-300'}`} />
      ))}
      <span className="ml-1 text-xs text-taupe font-sans">{rating.toFixed(1)}</span>
    </span>
  )
}

function InsuranceExpiry({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-taupe italic">Not recorded</span>
  const d = new Date(date)
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
  const colour = days < 0 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-green-600'
  const Icon = days < 0 ? AlertTriangle : days <= 30 ? AlertTriangle : CheckCircle
  return (
    <span className={`flex items-center gap-1 text-xs ${colour}`}>
      <Icon className="w-3 h-3" />
      {format(d, 'dd/MM/yyyy')}
      {days < 0 && ' (EXPIRED)'}
    </span>
  )
}

const EMPTY_FORM = { name: '', companyName: '', trade: 'Plumbing', phone: '', email: '', address: '', insuranceExpiry: '', gasSafeNumber: '', niceicNumber: '' }

export default function ContractorsClient({ contractors }: { contractors: Contractor[] }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [tradeFilter, setTradeFilter] = useState('all')

  const trades = ['all', ...Array.from(new Set(contractors.map(c => c.trade))).sort()]
  const filtered = contractors.filter(c => {
    const matchSearch = !search || `${c.name} ${c.companyName || ''} ${c.trade}`.toLowerCase().includes(search.toLowerCase())
    const matchTrade = tradeFilter === 'all' || c.trade === tradeFilter
    return matchSearch && matchTrade
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/contractors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, insuranceExpiry: form.insuranceExpiry || null }) })
    setSubmitting(false)
    setShowModal(false)
    setForm(EMPTY_FORM)
    window.location.reload()
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/contractors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !current }) })
    window.location.reload()
  }

  const active = contractors.filter(c => c.active).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-display font-600 uppercase tracking-editorial text-terracotta mb-1">Operations</p>
          <h1 className="font-display font-800 text-3xl text-charcoal">Contractors</h1>
          <p className="text-sm text-taupe mt-1">{active} active · {contractors.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-terracotta text-cream font-display font-600 text-sm uppercase tracking-wide px-4 py-2 hover:bg-terracotta-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Contractor
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contractors…" className="border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta w-56" />
        <div className="flex gap-2 flex-wrap">
          {trades.map(t => (
            <button key={t} onClick={() => setTradeFilter(t)} className={`text-xs font-display font-600 uppercase tracking-wide px-3 py-1.5 border transition-colors ${tradeFilter === t ? 'bg-charcoal text-cream border-charcoal' : 'bg-white text-taupe border-cream-200 hover:border-charcoal-300'}`}>
              {t === 'all' ? 'All trades' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-cream-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-50">
              {['Name / Company', 'Trade', 'Phone & Email', 'Insurance', 'Accreditations', 'Rating', 'Jobs', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-display font-600 uppercase tracking-editorial text-taupe whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-taupe"><Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No contractors found.</p></td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-sans font-600 text-charcoal">{c.name}</p>
                  {c.companyName && <p className="text-xs text-taupe">{c.companyName}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex text-xs font-display font-600 uppercase tracking-wide px-2 py-0.5 border ${TRADE_COLOURS[c.trade] || 'bg-cream-100 text-taupe border-cream-200'}`}>{c.trade}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-charcoal"><Phone className="w-3 h-3 text-taupe" />{c.phone}</div>
                  {c.email && <div className="flex items-center gap-1 text-xs text-taupe mt-0.5"><Mail className="w-3 h-3" />{c.email}</div>}
                </td>
                <td className="px-4 py-3"><InsuranceExpiry date={c.insuranceExpiry} /></td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {c.gasSafeNumber && <div className="flex items-center gap-1 text-xs text-charcoal"><Shield className="w-3 h-3 text-green-600" /> Gas Safe: {c.gasSafeNumber}</div>}
                    {c.niceicNumber && <div className="flex items-center gap-1 text-xs text-charcoal"><Shield className="w-3 h-3 text-amber-600" /> NICEIC: {c.niceicNumber}</div>}
                    {!c.gasSafeNumber && !c.niceicNumber && <span className="text-xs text-taupe italic">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3"><RatingStars rating={c.rating} /></td>
                <td className="px-4 py-3 text-sm text-charcoal font-display font-700">{c._count.jobs}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c.id, c.active)} className={`flex items-center gap-1.5 text-xs font-display font-600 uppercase tracking-wide transition-colors ${c.active ? 'text-green-600 hover:text-red-500' : 'text-taupe hover:text-green-600'}`}>
                    {c.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contractor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg border border-cream-200 my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h2 className="font-display font-700 text-lg text-charcoal">Add Contractor</h2>
              <button onClick={() => setShowModal(false)} className="text-taupe hover:text-charcoal text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
                </div>
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Company Name</label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Trade *</label>
                  <select required value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta">
                    {['Plumbing', 'Electrical', 'Heating', 'Structural', 'Appliances', 'Cleaning', 'Locksmith', 'Pest Control', 'General'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Phone *</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Insurance Expiry</label>
                  <input type="date" value={form.insuranceExpiry} onChange={e => setForm(f => ({ ...f, insuranceExpiry: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
                </div>
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Gas Safe No.</label>
                  <input value={form.gasSafeNumber} onChange={e => setForm(f => ({ ...f, gasSafeNumber: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
                </div>
                <div>
                  <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">NICEIC No.</label>
                  <input value={form.niceicNumber} onChange={e => setForm(f => ({ ...f, niceicNumber: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans focus:outline-none focus:border-terracotta" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-terracotta text-cream font-display font-600 text-sm uppercase tracking-wide py-2.5 hover:bg-terracotta-600 transition-colors disabled:opacity-50">
                  {submitting ? 'Adding…' : 'Add Contractor'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }} className="px-4 py-2.5 border border-charcoal-200 text-sm font-display font-600 uppercase tracking-wide text-charcoal hover:bg-cream-100 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
