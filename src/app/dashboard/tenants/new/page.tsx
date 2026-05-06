'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const REFERENCING_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFERRED', label: 'Referred' },
]

export default function NewTenantPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    niNumber: '',
    employer: '',
    jobTitle: '',
    annualSalary: '',
    employerContact: '',
    referencingStatus: 'NOT_STARTED',
    notes: '',
  })

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email) {
      setError('First name, last name and email are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          annualSalary: form.annualSalary ? parseInt(form.annualSalary) : undefined,
          dob: form.dob || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to create tenant')
      }
      const data = await res.json()
      router.push(`/dashboard/tenants/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/tenants"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3D2B] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Tenants
          </Link>
          <h1
            className="mt-3 text-2xl font-bold text-[#1A3D2B]"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Add Tenant
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            A portal account will be created with a temporary password: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">changeme123</code>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details */}
          <section>
            <h2 className="text-sm font-bold text-[#1A3D2B] uppercase tracking-wider mb-4">
              Personal Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => set('dob', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  NI Number
                </label>
                <input
                  type="text"
                  value={form.niNumber}
                  onChange={e => set('niNumber', e.target.value)}
                  placeholder="AB123456C"
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] font-mono uppercase"
                />
              </div>
            </div>
          </section>

          {/* Employment */}
          <section>
            <h2 className="text-sm font-bold text-[#1A3D2B] uppercase tracking-wider mb-4">
              Employment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Employer
                </label>
                <input
                  type="text"
                  value={form.employer}
                  onChange={e => set('employer', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={e => set('jobTitle', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Annual Salary (£)
                </label>
                <input
                  type="number"
                  value={form.annualSalary}
                  onChange={e => set('annualSalary', e.target.value)}
                  placeholder="35000"
                  min="0"
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Employer Contact
                </label>
                <input
                  type="text"
                  value={form.employerContact}
                  onChange={e => set('employerContact', e.target.value)}
                  placeholder="HR email or phone"
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                />
              </div>
            </div>
          </section>

          {/* Referencing */}
          <section>
            <h2 className="text-sm font-bold text-[#1A3D2B] uppercase tracking-wider mb-4">
              Referencing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                  Referencing Status
                </label>
                <select
                  value={form.referencingStatus}
                  onChange={e => set('referencingStatus', e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] bg-white"
                >
                  {REFERENCING_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#1A3D2B] mb-1.5">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Any additional notes about this tenant…"
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] resize-none"
              />
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#1A3D2B] text-white text-sm font-semibold rounded hover:bg-[#122B1E] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Tenant'}
            </button>
            <Link
              href="/dashboard/tenants"
              className="px-6 py-2.5 text-sm text-gray-600 hover:text-[#1A3D2B] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
  )
}
