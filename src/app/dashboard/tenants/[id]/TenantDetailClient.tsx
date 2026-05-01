'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import type { Tenant, User, TenancyTenant, Tenancy, Property, RentPayment, Document, Note, RightToRentCheck } from '@prisma/client'

type TenantFull = Tenant & {
  user: User
  tenancies: (TenancyTenant & { tenancy: Tenancy & { property: Property; rentPayments: RentPayment[] } })[]
  documents: Document[]
  rightToRentChecks: RightToRentCheck[]
  notesList: (Note & { author: User })[]
}

const TABS = ['Profile', 'Documents', 'Tenancies', 'Right to Rent', 'Notes']
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
  const [tab, setTab] = useState('Profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const [welcomeSent, setWelcomeSent] = useState(false)

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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tenant.rightToRentChecks.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No right to rent checks recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Check Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Document Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Checked By</th>
              </tr></thead>
              <tbody>
                {tenant.rightToRentChecks.map((c) => {
                  const days = c.expiryDate ? Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / 86400000) : null
                  return (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3">{new Date(c.checkDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 text-gray-600">{c.documentType}</td>
                      <td className={`px-4 py-3 ${days !== null && days < 30 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-GB') : '—'}
                        {days !== null && days < 0 && <span className="ml-1 text-red-600 text-xs font-bold">EXPIRED</span>}
                        {days !== null && days >= 0 && days < 30 && <span className="ml-1 text-amber-600 text-xs">({days}d)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.checkedBy ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
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
    </div>
  )
}
