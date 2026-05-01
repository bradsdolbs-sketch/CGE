'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Plus, FileText, Send, ClipboardList } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-slate-50 text-slate-600 border-slate-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-charcoal-100 text-taupe border-charcoal-200',
}
const TYPE_STYLES: Record<string, string> = {
  CHECK_IN: 'bg-terracotta-50 text-terracotta-600 border-terracotta-200',
  MID_TERM: 'bg-slate-50 text-slate-600 border-slate-200',
  CHECK_OUT: 'bg-charcoal-100 text-charcoal border-charcoal-200',
  ROUTINE: 'bg-cream-200 text-taupe border-cream-300',
}
const TYPE_LABELS: Record<string, string> = { CHECK_IN: 'Check-in', MID_TERM: 'Mid-term', CHECK_OUT: 'Check-out', ROUTINE: 'Routine' }

interface Inspection { id: string; type: string; status: string; scheduledAt: string; completedAt: string | null; conductedBy: string | null; sentToLandlord: boolean; pdfUrl: string | null; property: { addressLine1: string; area: string; postcode: string } }
interface Property { id: string; addressLine1: string; area: string; postcode: string }

export default function InspectionsClient({ inspections, properties }: { inspections: Inspection[]; properties: Property[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ propertyId: '', type: 'ROUTINE', scheduledAt: '', conductedBy: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const filtered = filter === 'all' ? inspections : inspections.filter(i => i.status === filter || i.type === filter)

  const upcoming = inspections.filter(i => i.status === 'SCHEDULED').length
  const completed = inspections.filter(i => i.status === 'COMPLETED').length

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/inspections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSubmitting(false)
    setShowModal(false)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-display font-600 uppercase tracking-editorial text-terracotta mb-1">Operations</p>
          <h1 className="font-display font-800 text-3xl text-charcoal">Inspections</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-terracotta text-cream font-display font-600 text-sm uppercase tracking-wide px-4 py-2 hover:bg-terracotta-600 transition-colors">
          <Plus className="w-4 h-4" /> Schedule Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Upcoming', value: upcoming, colour: 'text-slate' }, { label: 'Completed', value: completed, colour: 'text-green-600' }, { label: 'Total', value: inspections.length, colour: 'text-charcoal' }].map(s => (
          <div key={s.label} className="border border-cream-200 bg-white p-4">
            <p className="text-xs font-display font-600 uppercase tracking-editorial text-taupe">{s.label}</p>
            <p className={`font-display font-800 text-3xl mt-1 ${s.colour}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'SCHEDULED', 'COMPLETED', 'CHECK_IN', 'MID_TERM', 'CHECK_OUT', 'ROUTINE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs font-display font-600 uppercase tracking-wide px-3 py-1.5 border transition-colors ${filter === f ? 'bg-charcoal text-cream border-charcoal' : 'bg-white text-taupe border-cream-200 hover:border-charcoal-300'}`}>
            {f === 'all' ? 'All' : TYPE_LABELS[f] || f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-cream-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-50">
              {['Property', 'Type', 'Scheduled', 'Status', 'Conducted By', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-display font-600 uppercase tracking-editorial text-taupe">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-taupe text-sm"><ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No inspections found.</p></td></tr>
            )}
            {filtered.map(inspection => (
              <tr key={inspection.id} className="hover:bg-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-sans font-500 text-charcoal text-sm">{inspection.property.addressLine1}</p>
                  <p className="text-xs text-taupe">{inspection.property.area} · {inspection.property.postcode}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-display font-600 uppercase tracking-wide border ${TYPE_STYLES[inspection.type] || 'bg-cream-100 text-taupe border-cream-200'}`}>
                    {TYPE_LABELS[inspection.type] || inspection.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-charcoal">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-taupe" />
                    {format(new Date(inspection.scheduledAt), 'dd MMM yyyy')}
                  </div>
                  {inspection.completedAt && <p className="text-xs text-taupe mt-0.5">Completed {format(new Date(inspection.completedAt), 'dd MMM')}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-display font-600 uppercase tracking-wide border ${STATUS_STYLES[inspection.status] || ''}`}>
                    {inspection.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-charcoal">{inspection.conductedBy || <span className="text-taupe italic">TBC</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {inspection.pdfUrl && (
                      <a href={inspection.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-terracotta hover:underline">
                        <FileText className="w-3.5 h-3.5" /> Report
                      </a>
                    )}
                    {inspection.status === 'COMPLETED' && !inspection.sentToLandlord && (
                      <button className="flex items-center gap-1 text-xs text-slate hover:underline">
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md border border-cream-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h2 className="font-display font-700 text-lg text-charcoal">Schedule Inspection</h2>
              <button onClick={() => setShowModal(false)} className="text-taupe hover:text-charcoal text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Property</label>
                <select required value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta">
                  <option value="">Select property…</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.addressLine1}, {p.area}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta">
                  {['CHECK_IN', 'MID_TERM', 'CHECK_OUT', 'ROUTINE'].map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Date & Time</label>
                <input type="datetime-local" required value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Conducted By</label>
                <input value={form.conductedBy} onChange={e => setForm(f => ({ ...f, conductedBy: e.target.value }))} placeholder="Agent name" className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-terracotta text-cream font-display font-600 text-sm uppercase tracking-wide py-2.5 hover:bg-terracotta-600 transition-colors disabled:opacity-50">
                  {submitting ? 'Scheduling…' : 'Schedule'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-charcoal-200 text-sm font-display font-600 uppercase tracking-wide text-charcoal hover:bg-cream-100 transition-colors">
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
