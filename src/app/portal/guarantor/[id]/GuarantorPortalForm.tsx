'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

type FormData = {
  dob: string; niNumber: string; addressLine1: string; postcode: string
  guarantorEmployerName: string; guarantorEmployerEmail: string
  guarantorJobTitle: string; guarantorContractType: string
  guarantorEmploymentStart: string; annualSalary: string
}

const STEPS = ['Personal Details', 'Employment', 'Review & Submit']

export default function GuarantorPortalForm({
  guarantorId, token, tenantName, propertyAddress, initial,
}: {
  guarantorId: string
  token: string
  tenantName: string
  propertyAddress: string
  initial: FormData
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initial)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(k: keyof FormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/guarantors/${guarantorId}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          annualSalary: form.annualSalary ? parseInt(form.annualSalary) : null,
          dob: form.dob || null,
          guarantorEmploymentStart: form.guarantorEmploymentStart || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setSaving(false)
      return false
    }
    setSaving(false)
    return true
  }

  async function next() {
    const ok = await save()
    if (ok) setStep((s) => s + 1)
  }

  async function submit() {
    setSubmitting(true); setError(null)
    try {
      await save()
      const res = await fetch(`/api/guarantors/${guarantorId}/submit?token=${token}`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Submit failed')
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3">
        <CheckCircle size={48} className="text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#1a1a1a]">Application submitted!</h2>
        <p className="text-gray-500">Thank you. We've received your guarantor application and will be in touch shortly.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((_, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className={`flex-1 h-1 ${i === 0 ? 'rounded-l-full' : ''} ${i === STEPS.length - 1 ? 'rounded-r-full' : ''} ${i <= step ? 'bg-[#1A3D2B]' : 'bg-gray-200'} transition-all`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {STEPS.map((label, i) => (
          <p key={i} className={`text-xs font-medium ${i === step ? 'text-[#1A3D2B]' : i < step ? 'text-gray-400' : 'text-gray-300'}`}>{label}</p>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      {/* Step 0: Personal Details */}
      {step === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#1a1a1a]">Personal Details</h2>
          <p className="text-sm text-gray-500">You are applying as guarantor for <strong>{tenantName}</strong> at {propertyAddress}.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Current address *</label>
              <input type="text" className={inputCls} value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="123 Example Street, City" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Postcode *</label>
              <input type="text" className={inputCls} value={form.postcode} onChange={(e) => set('postcode', e.target.value.toUpperCase())} placeholder="SW1A 1AA" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of birth *</label>
              <input type="date" className={inputCls} value={form.dob} onChange={(e) => set('dob', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">National Insurance number</label>
              <input type="text" className={inputCls} value={form.niNumber} onChange={(e) => set('niNumber', e.target.value.toUpperCase())} placeholder="AB 12 34 56 C" />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Employment */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#1a1a1a]">Employment Details</h2>
          <p className="text-sm text-gray-500">As a guarantor, you must earn at least 3× the annual rent.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employer name *</label>
              <input type="text" className={inputCls} value={form.guarantorEmployerName} onChange={(e) => set('guarantorEmployerName', e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employer email (for verification)</label>
              <input type="email" className={inputCls} value={form.guarantorEmployerEmail} onChange={(e) => set('guarantorEmployerEmail', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Job title *</label>
              <input type="text" className={inputCls} value={form.guarantorJobTitle} onChange={(e) => set('guarantorJobTitle', e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Contract type</label>
              <select className={inputCls} value={form.guarantorContractType} onChange={(e) => set('guarantorContractType', e.target.value)}>
                <option value="PERMANENT">Permanent</option>
                <option value="FIXED_TERM">Fixed-term</option>
                <option value="ZERO_HOURS">Zero-hours</option>
                <option value="SELF_EMPLOYED">Self-employed</option>
                <option value="RETIRED">Retired / Pension</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Annual salary / income (£) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                <input type="number" className={`${inputCls} pl-7`} value={form.annualSalary} onChange={(e) => set('annualSalary', e.target.value)} required />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employment start date</label>
              <input type="date" className={inputCls} value={form.guarantorEmploymentStart} onChange={(e) => set('guarantorEmploymentStart', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review & Submit */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-bold text-[#1a1a1a]">Review & Submit</h2>
          <div className="space-y-3">
            {[
              { label: 'Address', value: form.addressLine1 || '—' },
              { label: 'Postcode', value: form.postcode || '—' },
              { label: 'Date of birth', value: form.dob || '—' },
              { label: 'NI number', value: form.niNumber || 'Not provided' },
              { label: 'Employer', value: form.guarantorEmployerName || '—' },
              { label: 'Job title', value: form.guarantorJobTitle || '—' },
              { label: 'Annual income', value: form.annualSalary ? `£${parseInt(form.annualSalary).toLocaleString()}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-[#1a1a1a]">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#F0EBE0] border border-[#1A3D2B]/20 rounded-lg p-4 text-sm">
            <p className="font-semibold text-[#1a1a1a] mb-1">Declaration</p>
            <p className="text-gray-600">I confirm that all information provided is accurate. I understand that as guarantor I am liable for rent and other obligations if the tenant defaults.</p>
          </div>

          <button
            onClick={submit}
            disabled={submitting || !form.guarantorEmployerName || !form.annualSalary}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Submitting…' : 'Submit Guarantor Application →'}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={next}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1A3D2B] hover:bg-[#122B1E] px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save & Continue'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
