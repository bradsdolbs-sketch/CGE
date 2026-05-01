'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HEATING', label: 'Heating / Boiler' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'LOCKSMITH', label: 'Locksmith' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'GENERAL', label: 'General' },
  { value: 'EMERGENCY', label: 'Emergency' },
]

const PRIORITIES = [
  { value: 'ROUTINE', label: 'Routine', desc: 'Within 2–4 weeks', colour: 'bg-blue-100 text-blue-800' },
  { value: 'URGENT', label: 'Urgent', desc: 'Within 48 hours', colour: 'bg-amber-100 text-amber-800' },
  { value: 'EMERGENCY', label: 'Emergency', desc: 'Immediate response', colour: 'bg-red-100 text-red-800' },
]

interface Property { id: string; addressLine1: string; area: string; postcode: string }
interface Contractor { id: string; name: string; trades: string[]; phone: string }

export default function NewMaintenancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProperty = searchParams.get('propertyId') ?? ''

  const [properties, setProperties] = useState<Property[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    propertyId: preselectedProperty,
    category: '',
    priority: 'ROUTINE',
    title: '',
    description: '',
    contractorId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/properties?limit=200').then(r => r.json()),
      fetch('/api/contractors?limit=200').then(r => r.json()),
    ]).then(([pData, cData]) => {
      setProperties(pData.properties ?? [])
      setContractors(cData.contractors ?? [])
      setLoading(false)
    })
  }, [])

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.propertyId || !form.category || !form.title || !form.description) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const body: Record<string, string> = {
        propertyId: form.propertyId,
        category: form.category,
        priority: form.priority,
        title: form.title,
        description: form.description,
      }
      if (form.contractorId) body.contractorId = form.contractorId

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to create request')
      }
      const data = await res.json()
      router.push(`/dashboard/maintenance/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/maintenance"
            className="text-sm text-gray-500 hover:text-[#1A3D2B] transition-colors"
          >
            ← Back to Maintenance
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#1A3D2B]" style={{ fontFamily: 'var(--font-syne)' }}>
            Log Maintenance Request
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new job. Emergency requests will immediately email all agents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property */}
          <div>
            <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
              Property <span className="text-red-500">*</span>
            </label>
            <select
              value={form.propertyId}
              onChange={e => set('propertyId', e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] bg-white"
              required
            >
              <option value="">Select a property…</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.addressLine1}, {p.area} {p.postcode}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('category', c.value)}
                  className={`px-3 py-2 rounded text-sm font-medium border transition-all ${
                    form.category === c.value
                      ? 'bg-[#1A3D2B] text-white border-[#1A3D2B]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#1A3D2B]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('priority', p.value)}
                  className={`p-3 rounded border text-left transition-all ${
                    form.priority === p.value
                      ? 'bg-[#1A3D2B] text-white border-[#1A3D2B]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#1A3D2B]'
                  }`}
                >
                  <div className="font-semibold text-sm">{p.label}</div>
                  <div className={`text-xs mt-0.5 ${form.priority === p.value ? 'text-white/70' : 'text-gray-400'}`}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
            {form.priority === 'EMERGENCY' && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                ⚠️ An emergency alert email will be sent to all agents immediately upon submission.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Leaking tap in kitchen"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Describe the issue in detail — location in property, when it started, severity…"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] resize-none"
              required
            />
          </div>

          {/* Assign Contractor (optional) */}
          {contractors.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                Assign Contractor <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={form.contractorId}
                onChange={e => set('contractorId', e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] bg-white"
              >
                <option value="">Assign later…</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.trades.join(', ')} · {c.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#1A3D2B] text-white text-sm font-semibold rounded hover:bg-[#122B1E] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Request'}
            </button>
            <Link
              href="/dashboard/maintenance"
              className="px-6 py-2.5 text-sm text-gray-600 hover:text-[#1A3D2B] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
  )
}
