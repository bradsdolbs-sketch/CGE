'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in',
  MID_TERM: 'Mid-term',
  CHECK_OUT: 'Check-out',
  ROUTINE: 'Routine',
}

const STATUS_OPTIONS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

interface Inspection {
  id: string
  type: string
  status: string
  scheduledAt: string
  completedAt: string | null
  conductedBy: string | null
  notes: string | null
  pdfUrl: string | null
  sentToLandlord: boolean
  property: { addressLine1: string; area: string; postcode: string }
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'
const labelCls = 'block text-sm text-gray-500 mb-1'

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({
    status: '',
    conductedBy: '',
    completedAt: '',
    notes: '',
    pdfUrl: '',
  })

  useEffect(() => {
    fetch(`/api/inspections/${id}`)
      .then((r) => r.json())
      .then(({ inspection }) => {
        setInspection(inspection)
        setForm({
          status: inspection.status,
          conductedBy: inspection.conductedBy ?? '',
          completedAt: inspection.completedAt
            ? new Date(inspection.completedAt).toISOString().substring(0, 10)
            : '',
          notes: inspection.notes ?? '',
          pdfUrl: inspection.pdfUrl ?? '',
        })
        setLoading(false)
      })
  }, [id])

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      const body: Record<string, unknown> = {
        status: form.status,
        conductedBy: form.conductedBy || null,
        notes: form.notes || null,
        pdfUrl: form.pdfUrl || null,
        completedAt: form.completedAt || null,
      }
      const res = await fetch(`/api/inspections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setInspection(data.inspection)
      router.refresh()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  if (!inspection) {
    return <p className="text-gray-500 py-10 text-center">Inspection not found.</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inspections" className="text-gray-400 hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            {TYPE_LABELS[inspection.type] ?? inspection.type} — {inspection.property.addressLine1}
          </h1>
          <p className="text-sm text-gray-500">
            {inspection.property.area}, {inspection.property.postcode} ·{' '}
            Scheduled {new Date(inspection.scheduledAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inspection.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {inspection.status.replace('_', ' ')}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className={labelCls}>Status</label>
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Conducted by</label>
          <input
            className={inputCls}
            placeholder="Agent or inspector name"
            value={form.conductedBy}
            onChange={(e) => setForm((f) => ({ ...f, conductedBy: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelCls}>Completed date</label>
          <input
            type="date"
            className={inputCls}
            value={form.completedAt}
            onChange={(e) => setForm((f) => ({ ...f, completedAt: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Inspection notes…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelCls}>Report PDF URL</label>
          <input
            className={inputCls}
            placeholder="https://…"
            value={form.pdfUrl}
            onChange={(e) => setForm((f) => ({ ...f, pdfUrl: e.target.value }))}
          />
          {inspection.pdfUrl && (
            <a
              href={inspection.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1A3D2B] hover:underline mt-1 inline-block"
            >
              View current report →
            </a>
          )}
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            href="/dashboard/inspections"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg transition"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  )
}
