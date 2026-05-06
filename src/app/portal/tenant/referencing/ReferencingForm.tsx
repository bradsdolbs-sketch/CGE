'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle, X, ChevronRight, ChevronLeft } from 'lucide-react'

type InitialData = {
  employerName: string; employerEmail: string; employerPhone: string
  jobTitle: string; contractType: string; annualSalary: string; employmentStartDate: string
  prevLandlordName: string; prevLandlordEmail: string; prevLandlordPhone: string
  prevPropertyAddress: string; prevTenancyStart: string; prevTenancyEnd: string
  reasonForLeaving: string
}

type ExistingDoc = { id: string; docType: string; name: string; url: string }

const DOC_TYPES = [
  { value: 'ID_FRONT', label: 'Photo ID — Front (passport / driving licence)', required: true },
  { value: 'ID_BACK', label: 'Photo ID — Back', required: false },
  { value: 'PAYSLIP_1', label: 'Payslip — Most recent', required: true },
  { value: 'PAYSLIP_2', label: 'Payslip — 2 months ago', required: false },
  { value: 'PAYSLIP_3', label: 'Payslip — 3 months ago', required: false },
  { value: 'BANK_STATEMENT', label: 'Bank statement (last 3 months)', required: true },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of address (utility bill / council tax)', required: false },
]

const STEPS = ['Employment', 'Previous Tenancy', 'Documents', 'Review & Submit']

export default function ReferencingForm({
  applicationId,
  initial,
  existingDocs,
}: {
  applicationId: string
  initial: InitialData
  existingDocs: ExistingDoc[]
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<InitialData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [docs, setDocs] = useState<ExistingDoc[]>(existingDocs)
  const [submitted, setSubmitted] = useState(false)

  function set(k: keyof InitialData, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function saveProgress() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/referencing/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          annualSalary: form.annualSalary ? parseInt(form.annualSalary) : null,
          employmentStartDate: form.employmentStartDate || null,
          prevTenancyStart: form.prevTenancyStart || null,
          prevTenancyEnd: form.prevTenancyEnd || null,
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

  async function nextStep() {
    const ok = await saveProgress()
    if (ok) setStep((s) => s + 1)
  }

  async function uploadDoc(docType: string, file: File) {
    setUploadingDoc(docType)
    setError(null)
    try {
      // 1. Upload file
      const fd = new FormData()
      fd.append('file', file)
      fd.append('subdir', 'referencing')
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!upRes.ok) throw new Error((await upRes.json()).error ?? 'Upload failed')
      const { url } = await upRes.json()

      // 2. Save document record
      const docRes = await fetch(`/api/referencing/${applicationId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: file.name, docType, size: file.size }),
      })
      if (!docRes.ok) throw new Error((await docRes.json()).error ?? 'Failed to save')
      const doc = await docRes.json()

      // Replace or add
      setDocs((prev) => {
        const filtered = prev.filter((d) => d.docType !== docType)
        return [...filtered, doc]
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingDoc(null)
    }
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      // Save latest data first
      await saveProgress()

      const res = await fetch(`/api/referencing/${applicationId}/submit`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Submission failed')
      setSubmitted(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Application submitted!</h2>
        <p className="text-gray-500">We'll now contact your employer and previous landlord to verify your details. This usually takes 1–3 business days. We'll keep you updated here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
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

      {/* ── Step 0: Employment ──────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#1a1a1a]">Employment Details</h2>
          <p className="text-sm text-gray-500">We will contact your employer to verify this information.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employer / Company name *</label>
              <input type="text" className={inputCls} value={form.employerName} onChange={(e) => set('employerName', e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">HR / Employer email *</label>
              <input type="email" className={inputCls} value={form.employerEmail} onChange={(e) => set('employerEmail', e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Job title *</label>
              <input type="text" className={inputCls} value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Contract type *</label>
              <select className={inputCls} value={form.contractType} onChange={(e) => set('contractType', e.target.value)}>
                <option value="PERMANENT">Permanent</option>
                <option value="FIXED_TERM">Fixed-term contract</option>
                <option value="ZERO_HOURS">Zero-hours contract</option>
                <option value="SELF_EMPLOYED">Self-employed</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Annual salary (£) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                <input type="number" className={`${inputCls} pl-7`} value={form.annualSalary} onChange={(e) => set('annualSalary', e.target.value)} required />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employment start date</label>
              <input type="date" className={inputCls} value={form.employmentStartDate} onChange={(e) => set('employmentStartDate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employer phone (optional)</label>
              <input type="tel" className={inputCls} value={form.employerPhone} onChange={(e) => set('employerPhone', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Previous tenancy ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#1a1a1a]">Previous Tenancy</h2>
          <p className="text-sm text-gray-500">We will contact your previous landlord for a reference. If this is your first rental, leave these blank.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Previous landlord name</label>
              <input type="text" className={inputCls} value={form.prevLandlordName} onChange={(e) => set('prevLandlordName', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Previous landlord email</label>
              <input type="email" className={inputCls} value={form.prevLandlordEmail} onChange={(e) => set('prevLandlordEmail', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Previous property address</label>
              <input type="text" className={inputCls} value={form.prevPropertyAddress} onChange={(e) => set('prevPropertyAddress', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tenancy start</label>
              <input type="date" className={inputCls} value={form.prevTenancyStart} onChange={(e) => set('prevTenancyStart', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tenancy end</label>
              <input type="date" className={inputCls} value={form.prevTenancyEnd} onChange={(e) => set('prevTenancyEnd', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Reason for leaving</label>
              <textarea rows={2} className={`${inputCls} resize-none`} value={form.reasonForLeaving} onChange={(e) => set('reasonForLeaving', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Documents ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#1a1a1a]">Supporting Documents</h2>
          <p className="text-sm text-gray-500">Upload your supporting documents. Items marked * are required.</p>
          <div className="space-y-3">
            {DOC_TYPES.map((dt) => {
              const existing = docs.find((d) => d.docType === dt.value)
              const uploading = uploadingDoc === dt.value
              return (
                <div key={dt.value} className={`flex items-center justify-between p-3 border rounded-lg ${existing ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {existing
                      ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      : <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${dt.required ? 'border-[#1A3D2B]' : 'border-gray-300'}`} />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">
                        {dt.label}{dt.required && <span className="text-[#1A3D2B] ml-1">*</span>}
                      </p>
                      {existing && <p className="text-xs text-gray-500 truncate">{existing.name}</p>}
                    </div>
                  </div>
                  <label className="flex-shrink-0 cursor-pointer">
                    <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      uploading ? 'bg-gray-100 text-gray-400' : 'bg-[#1A3D2B] text-white hover:bg-[#122B1E]'
                    }`}>
                      {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {existing ? 'Replace' : 'Upload'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(dt.value, f) }}
                    />
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-bold text-[#1a1a1a]">Review & Submit</h2>

          <div className="space-y-3">
            <ReviewRow label="Employer" value={form.employerName || '—'} />
            <ReviewRow label="Employer email" value={form.employerEmail || '—'} />
            <ReviewRow label="Job title" value={form.jobTitle || '—'} />
            <ReviewRow label="Contract" value={form.contractType} />
            <ReviewRow label="Annual salary" value={form.annualSalary ? `£${parseInt(form.annualSalary).toLocaleString()}` : '—'} />
            <ReviewRow label="Previous landlord" value={form.prevLandlordName || 'Not provided'} />
            <ReviewRow label="Documents uploaded" value={`${docs.length} / ${DOC_TYPES.filter((d) => d.required).length} required`} />
          </div>

          <div className="bg-[#F0EBE0] border border-[#1A3D2B]/20 rounded-lg p-4 text-sm text-[#1a1a1a]">
            <p className="font-semibold mb-1">Declaration</p>
            <p className="text-gray-600">I confirm that all information provided in this application is accurate and truthful. I understand that providing false information may result in my application being declined and legal action being taken.</p>
          </div>

          {/* Validate required docs */}
          {DOC_TYPES.filter((d) => d.required && !docs.find((u) => u.docType === d.value)).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Missing required documents: {DOC_TYPES.filter((d) => d.required && !docs.find((u) => u.docType === d.value)).map((d) => d.label.split(' — ')[0]).join(', ')}
            </div>
          )}

          <button
            onClick={submit}
            disabled={saving || !form.employerName || !form.annualSalary || !form.jobTitle}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Submitting…' : 'Submit Application →'}
          </button>
          <p className="text-xs text-gray-400 text-center">By submitting you agree to the declaration above. Your employer and previous landlord will be contacted automatically.</p>
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
            onClick={nextStep}
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-[#1a1a1a]">{value}</span>
    </div>
  )
}
