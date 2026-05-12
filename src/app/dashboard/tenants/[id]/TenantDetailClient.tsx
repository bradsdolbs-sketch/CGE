'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Mail, Loader2, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, Plus, Trash2, FileText } from 'lucide-react'
import type { Tenant, User, TenancyTenant, Tenancy, Property, RentPayment, Document, Note, RightToRentCheck } from '@prisma/client'
import { mandateStatusLabel } from '@/lib/gocardless-helpers'

type TenantFull = Tenant & {
  user: User
  tenancies: (TenancyTenant & { tenancy: Tenancy & { property: Property; rentPayments: RentPayment[] } })[]
  documents: Document[]
  rightToRentChecks: RightToRentCheck[]
  notesList: (Note & { author: User })[]
}

const TABS = ['Profile', 'Documents', 'Tenancies', 'Right to Rent', 'Notes', 'Direct Debit']
const refColors: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
  NOT_STARTED: 'bg-gray-100 text-gray-500',
  CONDITIONAL: 'bg-amber-100 text-amber-700',
}

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'
const labelClass = 'block text-sm font-medium text-[#1a1a1a] mb-1'

export default function TenantDetailClient({ tenant }: { tenant: TenantFull }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('gc_success') === 'mandate_setup' ? 'Direct Debit' : 'Profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const [welcomeSent, setWelcomeSent] = useState(false)
  const [settingUpDD, setSettingUpDD] = useState(false)
  const [ddError, setDdError] = useState<string | null>(null)
  const gcSuccess = searchParams.get('gc_success')
  const gcError = searchParams.get('gc_error')

  async function setupDirectDebit() {
    setSettingUpDD(true)
    setDdError(null)
    try {
      const res = await fetch('/api/gocardless/mandate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDdError(data.error ?? 'Failed to create mandate')
        return
      }
      // Redirect to GoCardless hosted page
      window.location.href = data.redirectUrl
    } catch {
      setDdError('Network error — please try again')
    } finally {
      setSettingUpDD(false)
    }
  }

  async function sendWelcome() {
    setSendingWelcome(true)
    try {
      await fetch(`/api/tenants/${tenant.id}/welcome`, { method: 'POST' })
      setWelcomeSent(true)
    } finally {
      setSendingWelcome(false)
    }
  }

  const [profile, setProfile] = useState({
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    dob: tenant.dob ? new Date(tenant.dob).toISOString().split('T')[0] : '',
    niNumber: tenant.niNumber ?? '',
    employer: tenant.employer ?? '',
    jobTitle: tenant.jobTitle ?? '',
    annualSalary: tenant.annualSalary ? String(tenant.annualSalary) : '',
    referencingStatus: tenant.referencingStatus,
    notes: tenant.notes ?? '',
  })

  async function saveProfile() {
    setSaving(true)
    try {
      await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tenants" className="text-gray-400 hover:text-[#1a1a1a] transition"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{tenant.firstName} {tenant.lastName}</h1>
          <p className="text-sm text-gray-500">{tenant.user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${refColors[tenant.referencingStatus] ?? 'bg-gray-100 text-gray-600'}`}>
            {tenant.referencingStatus.replace('_', ' ')}
          </span>
          <button
            onClick={sendWelcome}
            disabled={sendingWelcome || welcomeSent}
            className="flex items-center gap-1.5 text-sm font-medium text-[#1A3D2B] hover:text-[#122B1E] transition disabled:opacity-50"
          >
            {sendingWelcome ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {welcomeSent ? 'Email sent!' : sendingWelcome ? 'Sending…' : 'Send welcome email'}
          </button>
        </div>
      </div>

      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Saved successfully.</div>}
      {gcSuccess === 'mandate_setup' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> Direct Debit mandate set up successfully. GoCardless will activate it within 1–3 business days.
        </div>
      )}
      {gcError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <XCircle size={16} /> GoCardless error: {gcError.replace(/_/g, ' ')}. Please try again.
        </div>
      )}

      <div className="border-b border-gray-200 flex gap-0 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab === t ? 'border-[#1A3D2B] text-[#1A3D2B]' : 'border-transparent text-gray-500 hover:text-[#1a1a1a]'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input className={inputClass} value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input className={inputClass} value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" className={inputClass} value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>NI Number</label>
              <input className={inputClass} value={profile.niNumber} onChange={(e) => setProfile({ ...profile, niNumber: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className={labelClass}>Employer</label>
              <input className={inputClass} value={profile.employer} onChange={(e) => setProfile({ ...profile, employer: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Job Title</label>
              <input className={inputClass} value={profile.jobTitle} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Annual Salary (£)</label>
              <input type="number" className={inputClass} value={profile.annualSalary} onChange={(e) => setProfile({ ...profile, annualSalary: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Referencing Status</label>
              <select className={inputClass} value={profile.referencingStatus} onChange={(e) => setProfile({ ...profile, referencingStatus: e.target.value as typeof profile.referencingStatus })}>
                {['NOT_STARTED','IN_PROGRESS','PASSED','FAILED','CONDITIONAL'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea rows={3} className={inputClass} value={profile.notes} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {tenant.documents.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No documents uploaded</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {tenant.documents.map((doc) => (
                <li key={doc.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{doc.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{doc.type.replace('_', ' ')}</span>
                  </div>
                  <a href={doc.url} target="_blank" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">Download</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'Tenancies' && (
        <div className="space-y-3">
          {tenant.tenancies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">No tenancies</div>
          ) : (
            tenant.tenancies.map((tt) => (
              <Link key={tt.tenancyId} href={`/dashboard/tenancies/${tt.tenancyId}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-[#1A3D2B] transition">
                <p className="font-medium text-[#1a1a1a]">{tt.tenancy.property.addressLine1}, {tt.tenancy.property.area}</p>
                <p className="text-sm text-gray-500 mt-1">{new Date(tt.tenancy.startDate).toLocaleDateString('en-GB')} → {new Date(tt.tenancy.endDate).toLocaleDateString('en-GB')}</p>
                <p className="text-sm text-gray-500">£{tt.tenancy.rentAmount.toLocaleString()}/mo</p>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'Right to Rent' && (
        <RightToRentTab tenant={tenant} />
      )}

      {tab === 'Notes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {tenant.notesList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No notes yet</p>
          ) : (
            <ul className="space-y-4">
              {tenant.notesList.map((note) => (
                <li key={note.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-[#1a1a1a]">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{note.author.name} · {new Date(note.createdAt).toLocaleDateString('en-GB')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'Direct Debit' && (
        <div className="max-w-xl space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-[#1A3D2B]" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a] text-sm">GoCardless Direct Debit</p>
                <p className="text-xs text-gray-500">Collect rent automatically on the due date</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Mandate status</p>
                <MandateStatusBadge status={tenant.gcMandateStatus} />
              </div>
              {tenant.gcCustomerId && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">GoCardless customer ID</p>
                  <p className="font-mono text-xs text-gray-600 truncate">{tenant.gcCustomerId}</p>
                </div>
              )}
              {tenant.gcMandateId && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Mandate ID</p>
                  <p className="font-mono text-xs text-gray-600 truncate">{tenant.gcMandateId}</p>
                </div>
              )}
            </div>

            {ddError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle size={14} /> {ddError}
              </div>
            )}

            {/* Action buttons */}
            {!tenant.gcMandateId ? (
              <div className="pt-2">
                <button
                  onClick={setupDirectDebit}
                  disabled={settingUpDD}
                  className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-60"
                >
                  {settingUpDD ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                  {settingUpDD ? 'Creating link…' : 'Set up Direct Debit'}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  You&apos;ll be redirected to GoCardless where the tenant can authorise their bank account.
                </p>
              </div>
            ) : (
              <div className="pt-2 flex items-center gap-3">
                {(tenant.gcMandateStatus === 'cancelled' || tenant.gcMandateStatus === 'failed' || tenant.gcMandateStatus === 'expired') && (
                  <button
                    onClick={setupDirectDebit}
                    disabled={settingUpDD}
                    className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-60"
                  >
                    {settingUpDD ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    {settingUpDD ? 'Creating link…' : 'Set up new mandate'}
                  </button>
                )}
                {tenant.gcMandateId && (
                  <a
                    href={`https://manage${process.env.NEXT_PUBLIC_GC_ENVIRONMENT === 'live' ? '' : '-sandbox'}.gocardless.com/mandates/${tenant.gcMandateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1A3D2B] hover:underline"
                  >
                    View in GoCardless →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">How it works</p>
            <ol className="space-y-2">
              {[
                'Click "Set up Direct Debit" — a GoCardless hosted page opens.',
                'Tenant enters their bank details and authorises the mandate.',
                'GoCardless activates the mandate (1–3 business days).',
                'Use "Collect via GoCardless" on any rent payment row to charge the tenant automatically.',
                'Payment status updates automatically via webhook.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-[#1A3D2B]/10 text-[#1A3D2B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Right to Rent tab ───────────────────────────────────────────────────────

const RTR_DOCUMENT_TYPES = [
  'UK/British Passport',
  'EU/EEA Passport',
  'Biometric Residence Permit (BRP)',
  'Settled Status (EU Settlement Scheme)',
  'Pre-Settled Status (EU Settlement Scheme)',
  'UK Visa',
  'Certificate of Application',
  'Right of Abode Certificate',
  'Indefinite Leave to Remain',
  'Other',
]

const GOV_UK_DOCUMENT_TYPES = [
  'Biometric Residence Permit (BRP)',
  'Pre-Settled Status (EU Settlement Scheme)',
  'UK Visa',
  'Certificate of Application',
  'Other (time-limited leave)',
]

function formatShareCode(raw: string) {
  const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 15)
  const parts = [clean.slice(0, 5), clean.slice(5, 10), clean.slice(10, 15)].filter(Boolean)
  return parts.join('-')
}

function RightToRentTab({ tenant }: { tenant: TenantFull }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [checks, setChecks] = useState<RightToRentCheck[]>(tenant.rightToRentChecks)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifyModal, setVerifyModal] = useState<{ checkId: string } | null>(null)
  const [verifyingName, setVerifyingName] = useState('')
  const [verifyingSubmit, setVerifyingSubmit] = useState(false)
  const [form, setForm] = useState({
    checkDate: new Date().toISOString().split('T')[0],
    checkType: 'MANUAL_DOCUMENT' as 'MANUAL_DOCUMENT' | 'GOV_UK_SHARE_CODE',
    documentType: RTR_DOCUMENT_TYPES[0],
    shareCode: '',
    tenantDob: tenant.dob ? new Date(tenant.dob).toISOString().split('T')[0] : '',
    expiryDate: '',
    checkedBy: '',
    notes: '',
  })

  const soonestExpiry = checks
    .filter((c) => c.expiryDate)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())[0]
  const daysToExpiry = soonestExpiry?.expiryDate
    ? Math.ceil((new Date(soonestExpiry.expiryDate).getTime() - Date.now()) / 86400000)
    : null

  const tenantWa = tenant.whatsapp || tenant.phone
  const waRtrLink = tenantWa ? (() => {
    const num = tenantWa.replace(/\D/g, '').replace(/^0/, '44')
    const msg = encodeURIComponent(`Hi ${tenant.firstName}, we need to conduct a follow-up Right-to-Rent check for your tenancy. Please bring your original documents (passport/visa/biometric card) to our office at your earliest convenience, or contact us to arrange a convenient time. Thank you — Central Gate Estates`)
    return `https://wa.me/${num}?text=${msg}`
  })() : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('checkDate', form.checkDate)
      fd.append('checkType', form.checkType)
      fd.append('documentType', form.documentType)
      if (form.expiryDate) fd.append('expiryDate', form.expiryDate)
      if (form.checkedBy) fd.append('checkedBy', form.checkedBy)
      if (form.notes) fd.append('notes', form.notes)
      if (form.checkType === 'GOV_UK_SHARE_CODE') {
        fd.append('shareCode', form.shareCode)
        fd.append('tenantDob', form.tenantDob)
      }
      const file = fileRef.current?.files?.[0]
      if (file) fd.append('document', file)

      const res = await fetch(`/api/tenants/${tenant.id}/right-to-rent`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      const created = await res.json()
      setChecks((prev) => [created, ...prev])
      setShowForm(false)
      setForm({ checkDate: new Date().toISOString().split('T')[0], checkType: 'MANUAL_DOCUMENT', documentType: RTR_DOCUMENT_TYPES[0], shareCode: '', tenantDob: tenant.dob ? new Date(tenant.dob).toISOString().split('T')[0] : '', expiryDate: '', checkedBy: '', notes: '' })
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkVerified() {
    if (!verifyModal || !verifyingName.trim()) return
    setVerifyingSubmit(true)
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/right-to-rent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkId: verifyModal.checkId, verifiedBy: verifyingName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to mark verified')
      const updated = await res.json()
      setChecks((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      setVerifyModal(null)
      setVerifyingName('')
    } finally {
      setVerifyingSubmit(false)
    }
  }

  async function handleDelete(checkId: string) {
    if (!confirm('Delete this RTR check?')) return
    setDeletingId(checkId)
    try {
      await fetch(`/api/tenants/${tenant.id}/right-to-rent/${checkId}`, { method: 'DELETE' })
      setChecks((prev) => prev.filter((c) => c.id !== checkId))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Expiry warning */}
      {daysToExpiry !== null && daysToExpiry <= 60 && (
        <div className={`flex items-start gap-3 p-4 rounded-lg ${daysToExpiry <= 14 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${daysToExpiry <= 14 ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${daysToExpiry <= 14 ? 'text-red-700' : 'text-amber-700'}`}>
              {daysToExpiry <= 0 ? 'RTR document EXPIRED' : `RTR document expires in ${daysToExpiry} day${daysToExpiry === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">A follow-up check must be completed. Non-compliance carries a civil penalty of up to £20,000.</p>
          </div>
          {waRtrLink && (
            <a href={waRtrLink} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition">
              WhatsApp tenant
            </a>
          )}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#1a1a1a]">Check history</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium bg-[#1A3D2B] hover:bg-[#122B1E] text-white px-3 py-1.5 rounded-lg transition"
        >
          <Plus size={14} /> Record check
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-[#1a1a1a]">New RTR check</p>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Check type toggle */}
          <div className="flex gap-2">
            {(['MANUAL_DOCUMENT', 'GOV_UK_SHARE_CODE'] as const).map((ct) => (
              <button key={ct} type="button"
                onClick={() => setForm({ ...form, checkType: ct, documentType: ct === 'GOV_UK_SHARE_CODE' ? GOV_UK_DOCUMENT_TYPES[0] : RTR_DOCUMENT_TYPES[0] })}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${form.checkType === ct ? 'bg-[#1A3D2B] text-white border-[#1A3D2B]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                {ct === 'MANUAL_DOCUMENT' ? 'Manual document check' : 'GOV.UK Share Code'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Check Date *</label>
              <input type="date" required className={inputClass} value={form.checkDate}
                onChange={(e) => setForm({ ...form, checkDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Document Type *</label>
              <select required className={inputClass} value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
                {(form.checkType === 'GOV_UK_SHARE_CODE' ? GOV_UK_DOCUMENT_TYPES : RTR_DOCUMENT_TYPES).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {form.checkType === 'GOV_UK_SHARE_CODE' && (<>
              <div className="col-span-2">
                <label className={labelClass}>Share Code * <span className="text-gray-400 font-normal">(format: XXXXX-XXXXX-XXXXX)</span></label>
                <div className="flex gap-2">
                  <input required className={`${inputClass} font-mono tracking-widest uppercase`}
                    placeholder="XXXXX-XXXXX-XXXXX" value={form.shareCode}
                    maxLength={17}
                    onChange={(e) => setForm({ ...form, shareCode: formatShareCode(e.target.value) })} />
                  <button type="button"
                    onClick={() => window.open('https://www.gov.uk/view-right-to-rent', '_blank')}
                    className="flex-shrink-0 px-3 py-2 bg-[#00703c] hover:bg-[#005a30] text-white text-xs font-semibold rounded-lg transition whitespace-nowrap">
                    Open GOV.UK ↗
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter the share code, then open GOV.UK and verify using the share code + tenant DOB below.</p>
              </div>
              <div>
                <label className={labelClass}>Tenant Date of Birth *</label>
                <input type="date" required className={inputClass} value={form.tenantDob}
                  onChange={(e) => setForm({ ...form, tenantDob: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Required for the GOV.UK check</p>
              </div>
            </>)}

            <div>
              <label className={labelClass}>Document Expiry</label>
              <input type="date" className={inputClass} value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">Leave blank for settled status / indefinite leave</p>
            </div>
            <div>
              <label className={labelClass}>Checked By</label>
              <input className={inputClass} placeholder="Agent name" value={form.checkedBy}
                onChange={(e) => setForm({ ...form, checkedBy: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Upload Document (optional)</label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1A3D2B]/10 file:text-[#1A3D2B] hover:file:bg-[#1A3D2B]/20 cursor-pointer" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea rows={2} className={inputClass} placeholder="Any additional notes…" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button type="submit" disabled={submitting}
              className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60">
              {submitting ? 'Saving…' : form.checkType === 'GOV_UK_SHARE_CODE' ? 'Save & mark pending verification' : 'Save check'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-[#1a1a1a] transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Mark verified modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-bold text-[#1a1a1a]">Mark GOV.UK check as verified</h3>
            <p className="text-sm text-gray-500">Confirm you have completed the GOV.UK right to rent check for this tenant.</p>
            <div>
              <label className={labelClass}>Your name (for audit trail) *</label>
              <input autoFocus className={inputClass} placeholder="Full name" value={verifyingName}
                onChange={(e) => setVerifyingName(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleMarkVerified} disabled={verifyingSubmit || !verifyingName.trim()}
                className="flex-1 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50">
                {verifyingSubmit ? 'Saving…' : 'Confirm verified'}
              </button>
              <button onClick={() => { setVerifyModal(null); setVerifyingName('') }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-[#1a1a1a] transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {checks.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No right to rent checks recorded</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Verified</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Doc</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => {
                const days = c.expiryDate
                  ? Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / 86400000)
                  : null
                const isGovUk = c.checkType === 'GOV_UK_SHARE_CODE'
                const maskedCode = c.shareCode
                  ? c.shareCode.slice(0, 11) + '*****'
                  : null
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(c.checkDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isGovUk ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isGovUk ? 'GOV.UK' : 'Manual'}
                      </span>
                      {maskedCode && <p className="text-xs text-gray-400 font-mono mt-0.5">{maskedCode}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.documentType}</td>
                    <td className={`px-4 py-3 text-xs ${days !== null && days < 30 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-GB') : '—'}
                      {days !== null && days < 0 && <span className="ml-1 font-bold">EXPIRED</span>}
                      {days !== null && days >= 0 && days < 30 && <span className="ml-1 text-amber-600">({days}d)</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.verified ? (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          ✓ {c.verifiedBy ?? 'Verified'}
                        </span>
                      ) : isGovUk ? (
                        <button onClick={() => setVerifyModal({ checkId: c.id })}
                          className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full transition">
                          Pending — mark verified
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.documentUrl ? (
                        <a href={c.documentUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[#1A3D2B] hover:text-[#122B1E]" title="View document">
                          <FileText size={15} />
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                        className="text-gray-300 hover:text-red-500 transition disabled:opacity-40" title="Delete check">
                        {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Mandate status badge ─────────────────────────────────────────────────────

function MandateStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) {
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium"><Clock size={11} /> Not set up</span>
  }
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    active:                    { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle size={11} /> },
    submitted:                 { cls: 'bg-blue-100 text-blue-700',    icon: <Clock size={11} /> },
    pending_submission:        { cls: 'bg-blue-100 text-blue-700',    icon: <Clock size={11} /> },
    pending_customer_approval: { cls: 'bg-amber-100 text-amber-700',  icon: <Clock size={11} /> },
    failed:                    { cls: 'bg-red-100 text-red-700',      icon: <XCircle size={11} /> },
    cancelled:                 { cls: 'bg-gray-100 text-gray-500',    icon: <XCircle size={11} /> },
    expired:                   { cls: 'bg-gray-100 text-gray-500',    icon: <Clock size={11} /> },
    consumed:                  { cls: 'bg-gray-100 text-gray-500',    icon: <Clock size={11} /> },
  }
  const { cls, icon } = map[status] ?? { cls: 'bg-gray-100 text-gray-500', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {icon}
      {mandateStatusLabel(status)}
    </span>
  )
}
