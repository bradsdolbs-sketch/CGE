'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Pencil, X, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import type { Tenancy, TenancyTenant, Tenant, User, Property, Landlord, Guarantor, RentPayment, Document, Note } from '@prisma/client'

type TenancyFull = Tenancy & {
  property: Property
  landlord: Landlord & { user: User }
  tenants: (TenancyTenant & { tenant: Tenant & { user: User } })[]
  guarantors: Guarantor[]
  rentPayments: RentPayment[]
  documents: Document[]
  notesList: (Note & { author: User })[]
}

const paymentStatusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-gray-100 text-gray-600',
  LATE: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  VOID: 'bg-gray-100 text-gray-400',
}

const STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'HOLDING_OVER', 'TERMINATED']

const TABS = ['Details', 'Tenants', 'Financials', 'Documents', 'Notes']

function fmt(amount: number) {
  return `£${amount.toLocaleString('en-GB')}`
}

function fmtInput(amount: number) {
  return String(amount)
}

function toISODate(d: Date | string) {
  return new Date(d).toISOString().substring(0, 10)
}

// ── Edit form state type ──────────────────────────────────────────────────────
type EditState = {
  startDate: string
  endDate: string
  breakClauseDate: string
  rentAmount: string
  depositAmount: string
  depositScheme: string
  depositRef: string
  status: string
  notes: string
}

// ── Guarantor form state ──────────────────────────────────────────────────────
type GuarantorForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  relationship: string
}

const emptyGuarantor: GuarantorForm = { firstName: '', lastName: '', email: '', phone: '', relationship: '' }

export default function TenancyDetailClient({ tenancy }: { tenancy: TenancyFull }) {
  const router = useRouter()
  const [tab, setTab] = useState('Details')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  // ── Details edit state ──────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState<EditState>({
    startDate: toISODate(tenancy.startDate),
    endDate: toISODate(tenancy.endDate),
    breakClauseDate: tenancy.breakClauseDate ? toISODate(tenancy.breakClauseDate) : '',
    rentAmount: fmtInput(tenancy.rentAmount),
    depositAmount: fmtInput(tenancy.depositAmount),
    depositScheme: tenancy.depositScheme ?? '',
    depositRef: tenancy.depositRef ?? '',
    status: tenancy.status,
    notes: tenancy.notes ?? '',
  })

  // ── Guarantor state ─────────────────────────────────────────────────────────
  const [addingGuarantor, setAddingGuarantor] = useState(false)
  const [guarantorForm, setGuarantorForm] = useState<GuarantorForm>(emptyGuarantor)
  const [guarantorSaving, setGuarantorSaving] = useState(false)
  const [guarantorError, setGuarantorError] = useState<string | null>(null)
  const [deletingGuarantor, setDeletingGuarantor] = useState<string | null>(null)

  const totalDue = tenancy.rentPayments.reduce((s, p) => s + p.amount, 0)
  const totalPaid = tenancy.rentPayments.reduce((s, p) => s + p.amountPaid, 0)
  const totalOutstanding = totalDue - totalPaid

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function markPaid(paymentId: string, amount: number) {
    setMarkingPaid(paymentId)
    try {
      await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amountPaid: amount, paidDate: new Date().toISOString() }),
      })
      router.refresh()
    } finally {
      setMarkingPaid(null)
    }
  }

  async function saveDetails() {
    setSaving(true)
    setSaveError(null)
    try {
      const body: Record<string, unknown> = {
        startDate: form.startDate,
        endDate: form.endDate,
        rentAmount: parseInt(form.rentAmount),
        depositAmount: parseInt(form.depositAmount),
        depositScheme: form.depositScheme || null,
        depositRef: form.depositRef || null,
        status: form.status,
        notes: form.notes || null,
      }
      if (form.breakClauseDate) body.breakClauseDate = form.breakClauseDate
      else body.breakClauseDate = null

      const res = await fetch(`/api/tenancies/${tenancy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setEditing(false)
      router.refresh()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function addGuarantor() {
    if (!guarantorForm.firstName || !guarantorForm.lastName) {
      setGuarantorError('First and last name are required')
      return
    }
    setGuarantorSaving(true)
    setGuarantorError(null)
    try {
      const res = await fetch(`/api/tenancies/${tenancy.id}/guarantors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guarantorForm),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to add guarantor')
      setAddingGuarantor(false)
      setGuarantorForm(emptyGuarantor)
      router.refresh()
    } catch (e) {
      setGuarantorError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setGuarantorSaving(false)
    }
  }

  async function deleteGuarantor(id: string) {
    setDeletingGuarantor(id)
    try {
      await fetch(`/api/tenancies/${tenancy.id}/guarantors/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeletingGuarantor(null)
    }
  }

  // ── Field helpers ────────────────────────────────────────────────────────────
  function field(key: keyof EditState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    }
  }

  const inputCls = 'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tenancies" className="text-gray-400 hover:text-[#1a1a1a] transition"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{tenancy.property.addressLine1}</h1>
          <p className="text-sm text-gray-500">Tenancy #{tenancy.id.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
          tenancy.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          tenancy.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600'
        }`}>{tenancy.status.replace(/_/g, ' ')}</span>
      </div>

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

      {/* ── Details tab ────────────────────────────────────────────────────── */}
      {tab === 'Details' && (
        <div className="space-y-4">
          {/* Edit / Save toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Last updated {new Date(tenancy.updatedAt).toLocaleDateString('en-GB')}
            </p>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-[#1A3D2B] hover:text-[#122B1E] transition"
              >
                <Pencil size={14} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                <button
                  onClick={() => { setEditing(false); setSaveError(null) }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={saveDetails}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {/* Read-only: Property + Landlord */}
            <div className="flex px-6 py-3">
              <span className="w-40 text-sm text-gray-500 flex-shrink-0">Property</span>
              <span className="text-sm text-[#1a1a1a] font-medium">
                {tenancy.property.addressLine1}, {tenancy.property.area}, {tenancy.property.postcode}
              </span>
            </div>
            <div className="flex px-6 py-3">
              <span className="w-40 text-sm text-gray-500 flex-shrink-0">Landlord</span>
              <span className="text-sm text-[#1a1a1a] font-medium">{tenancy.landlord.firstName} {tenancy.landlord.lastName}</span>
            </div>

            {/* Editable fields */}
            {[
              { label: 'Status', key: 'status' as const, type: 'select' },
              { label: 'Start Date', key: 'startDate' as const, type: 'date' },
              { label: 'End Date', key: 'endDate' as const, type: 'date' },
              { label: 'Break Clause', key: 'breakClauseDate' as const, type: 'date' },
              { label: 'Rent (£/mo)', key: 'rentAmount' as const, type: 'number' },
              { label: 'Deposit (£)', key: 'depositAmount' as const, type: 'number' },
              { label: 'Deposit Scheme', key: 'depositScheme' as const, type: 'text' },
              { label: 'Deposit Ref', key: 'depositRef' as const, type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex items-center px-6 py-3 gap-4">
                <span className="w-40 text-sm text-gray-500 flex-shrink-0">{label}</span>
                {editing ? (
                  type === 'select' ? (
                    <select className={inputCls} {...field(key)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  ) : (
                    <input type={type} className={inputCls} {...field(key)} />
                  )
                ) : (
                  <span className="text-sm text-[#1a1a1a] font-medium">
                    {key === 'rentAmount' ? `£${form.rentAmount} pcm` :
                     key === 'depositAmount' ? `£${form.depositAmount}` :
                     key === 'startDate' || key === 'endDate' || key === 'breakClauseDate'
                       ? form[key] ? new Date(form[key]).toLocaleDateString('en-GB') : '—'
                       : form[key] || '—'}
                  </span>
                )}
              </div>
            ))}

            {/* Notes (textarea) */}
            <div className="px-6 py-3">
              <span className="block text-sm text-gray-500 mb-1.5">Notes</span>
              {editing ? (
                <textarea
                  rows={3}
                  className={`${inputCls} resize-none`}
                  {...field('notes')}
                />
              ) : (
                <p className="text-sm text-[#1a1a1a]">{form.notes || '—'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tenants tab ────────────────────────────────────────────────────── */}
      {tab === 'Tenants' && (
        <div className="space-y-4">
          {/* Tenants list */}
          {tenancy.tenants.map((tt) => (
            <div key={tt.tenantId} className="bg-white rounded-xl border border-gray-200 p-5 flex justify-between items-center">
              <div>
                <p className="font-medium text-[#1a1a1a]">{tt.tenant.firstName} {tt.tenant.lastName}</p>
                <p className="text-sm text-gray-500">{tt.tenant.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  tt.tenant.referencingStatus === 'PASSED' ? 'bg-green-100 text-green-700' :
                  tt.tenant.referencingStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  tt.tenant.referencingStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {tt.tenant.referencingStatus.replace(/_/g, ' ')}
                </span>
                {tt.isPrimary && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0EBE0] text-[#1A3D2B]">Primary</span>}
                <Link href={`/dashboard/tenants/${tt.tenantId}`} className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">View →</Link>
              </div>
            </div>
          ))}

          {/* Guarantors section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1a1a1a]">Guarantors ({tenancy.guarantors.length})</h3>
              {!addingGuarantor && (
                <button
                  onClick={() => setAddingGuarantor(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#1A3D2B] hover:text-[#122B1E] transition"
                >
                  <Plus size={14} /> Add guarantor
                </button>
              )}
            </div>

            {tenancy.guarantors.map((g) => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1a1a1a]">{g.firstName} {g.lastName}</p>
                  <div className="flex gap-3 mt-0.5">
                    {g.email && <p className="text-xs text-gray-500">{g.email}</p>}
                    {g.phone && <p className="text-xs text-gray-500">{g.phone}</p>}
                    {g.relationship && <p className="text-xs text-gray-400">{g.relationship}</p>}
                  </div>
                </div>
                <button
                  onClick={() => deleteGuarantor(g.id)}
                  disabled={deletingGuarantor === g.id}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition disabled:opacity-40"
                  title="Remove guarantor"
                >
                  {deletingGuarantor === g.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            ))}

            {tenancy.guarantors.length === 0 && !addingGuarantor && (
              <p className="text-sm text-gray-400 italic">No guarantors on this tenancy</p>
            )}

            {/* Add guarantor form */}
            {addingGuarantor && (
              <div className="bg-white border border-[#1A3D2B]/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1a1a1a]">Add Guarantor</p>
                  <button onClick={() => { setAddingGuarantor(false); setGuarantorForm(emptyGuarantor); setGuarantorError(null) }}>
                    <X size={15} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                {guarantorError && <p className="text-xs text-red-600">{guarantorError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">First name *</label>
                    <input
                      type="text"
                      value={guarantorForm.firstName}
                      onChange={(e) => setGuarantorForm((f) => ({ ...f, firstName: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last name *</label>
                    <input
                      type="text"
                      value={guarantorForm.lastName}
                      onChange={(e) => setGuarantorForm((f) => ({ ...f, lastName: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={guarantorForm.email}
                      onChange={(e) => setGuarantorForm((f) => ({ ...f, email: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={guarantorForm.phone}
                      onChange={(e) => setGuarantorForm((f) => ({ ...f, phone: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Relationship to tenant</label>
                    <input
                      type="text"
                      placeholder="e.g. Parent, Employer"
                      value={guarantorForm.relationship}
                      onChange={(e) => setGuarantorForm((f) => ({ ...f, relationship: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={addGuarantor}
                    disabled={guarantorSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {guarantorSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {guarantorSaving ? 'Adding…' : 'Add'}
                  </button>
                  <button onClick={() => { setAddingGuarantor(false); setGuarantorForm(emptyGuarantor) }} className="text-sm text-gray-500 hover:text-gray-700 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Financials tab ─────────────────────────────────────────────────── */}
      {tab === 'Financials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Total Due', fmt(totalDue), 'text-[#1a1a1a]'],
              ['Total Received', fmt(totalPaid), 'text-green-600'],
              ['Outstanding', fmt(totalOutstanding), totalOutstanding > 0 ? 'text-red-600 font-bold' : 'text-green-600'],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${cls}`}>{val}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Paid Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {tenancy.rentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">{new Date(p.dueDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 font-medium">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status !== 'PAID' && (
                        <button
                          onClick={() => markPaid(p.id, p.amount)}
                          disabled={markingPaid === p.id}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-60"
                        >
                          <CheckCircle size={13} />
                          {markingPaid === p.id ? 'Marking…' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Documents tab ──────────────────────────────────────────────────── */}
      {tab === 'Documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {tenancy.documents.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No documents uploaded</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {tenancy.documents.map((doc) => (
                <li key={doc.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.type.replace(/_/g, ' ')}</p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">Download</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Notes tab ──────────────────────────────────────────────────────── */}
      {tab === 'Notes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {tenancy.notesList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No notes yet</p>
          ) : (
            <ul className="space-y-4">
              {tenancy.notesList.map((note) => (
                <li key={note.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-[#1a1a1a]">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{note.author.name} · {new Date(note.createdAt).toLocaleDateString('en-GB')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
