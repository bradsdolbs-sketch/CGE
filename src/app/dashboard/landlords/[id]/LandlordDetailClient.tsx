'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Mail } from 'lucide-react'
import type { Landlord, User, Property, Listing, Tenancy, LandlordStatement, Fee, Note } from '@prisma/client'

type LandlordFull = Landlord & {
  user: User
  properties: (Property & { listing: Listing | null; tenancies: Tenancy[] })[]
  statements: LandlordStatement[]
  fees: Fee[]
  notesList: (Note & { author: User })[]
}

const TABS = ['Profile', 'Properties', 'Statements', 'Fees', 'Notes']
const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'
const labelClass = 'block text-sm font-medium text-[#1a1a1a] mb-1'

function fmt(pence: number) { return `£${pence.toLocaleString()}` }

export default function LandlordDetailClient({ landlord }: { landlord: LandlordFull }) {
  const [tab, setTab] = useState('Profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const [welcomeSent, setWelcomeSent] = useState(false)

  async function sendWelcomeEmail() {
    setSendingWelcome(true)
    try {
      await fetch(`/api/landlords/${landlord.id}/welcome`, { method: 'POST' })
      setWelcomeSent(true)
      setTimeout(() => setWelcomeSent(false), 4000)
    } finally {
      setSendingWelcome(false)
    }
  }
  const [profile, setProfile] = useState({
    firstName: landlord.firstName,
    lastName: landlord.lastName,
    companyName: landlord.companyName ?? '',
    phone: landlord.phone ?? '',
    addressLine1: landlord.addressLine1 ?? '',
    addressLine2: landlord.addressLine2 ?? '',
    postcode: landlord.postcode ?? '',
    preferredContact: landlord.preferredContact,
    serviceLevel: landlord.serviceLevel,
    ukResident: landlord.ukResident,
    nrlSchemeRef: landlord.nrlSchemeRef ?? '',
    notes: landlord.notes ?? '',
  })

  async function saveProfile() {
    setSaving(true)
    try {
      await fetch(`/api/landlords/${landlord.id}`, {
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
        <Link href="/dashboard/landlords" className="text-gray-400 hover:text-[#1a1a1a] transition"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{landlord.firstName} {landlord.lastName}</h1>
          {landlord.companyName && <p className="text-sm text-gray-500">{landlord.companyName}</p>}
        </div>
        <button
          onClick={sendWelcomeEmail}
          disabled={sendingWelcome}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition disabled:opacity-50"
        >
          <Mail size={15} />
          {sendingWelcome ? 'Sending…' : welcomeSent ? 'Sent ✓' : 'Send welcome email'}
        </button>
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
            <div className="col-span-2">
              <label className={labelClass}>Company Name</label>
              <input className={inputClass} value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Preferred Contact</label>
              <select className={inputClass} value={profile.preferredContact} onChange={(e) => setProfile({ ...profile, preferredContact: e.target.value })}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Service Level</label>
              <select className={inputClass} value={profile.serviceLevel} onChange={(e) => setProfile({ ...profile, serviceLevel: e.target.value })}>
                <option value="FULL_MANAGEMENT">Full Management</option>
                <option value="RENT_COLLECTION">Rent Collection</option>
                <option value="LET_ONLY">Let Only</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={profile.addressLine1} onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })} placeholder="Address line 1" />
            </div>
            <div>
              <label className={labelClass}>Postcode</label>
              <input className={inputClass} value={profile.postcode} onChange={(e) => setProfile({ ...profile, postcode: e.target.value.toUpperCase() })} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="nrl" checked={!profile.ukResident} onChange={(e) => setProfile({ ...profile, ukResident: !e.target.checked })} className="w-4 h-4 accent-[#1A3D2B]" />
              <label htmlFor="nrl" className="text-sm">Non-Resident Landlord (NRL)</label>
            </div>
            {!profile.ukResident && (
              <div>
                <label className={labelClass}>NRL Scheme Ref</label>
                <input className={inputClass} value={profile.nrlSchemeRef} onChange={(e) => setProfile({ ...profile, nrlSchemeRef: e.target.value })} />
              </div>
            )}
          </div>

          {/* Masked bank details */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <h3 className="font-medium text-[#1a1a1a] mb-3">Bank Details (masked)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Account Name</label>
                <input disabled className={`${inputClass} bg-gray-50 text-gray-500`} value={landlord.bankAccountName ?? '—'} />
              </div>
              <div>
                <label className={labelClass}>Sort Code</label>
                <input disabled className={`${inputClass} bg-gray-50 text-gray-500`} value={landlord.bankSortCode ?? '—'} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input disabled className={`${inputClass} bg-gray-50 text-gray-500`} value={landlord.bankAccountNumber ?? '—'} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea rows={3} className={inputClass} value={profile.notes} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} />
          </div>
          <button onClick={saveProfile} disabled={saving} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      )}

      {tab === 'Properties' && (
        <div className="space-y-3">
          {landlord.properties.map((p) => (
            <Link key={p.id} href={`/dashboard/properties/${p.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-[#1A3D2B] transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[#1a1a1a]">{p.addressLine1}</p>
                  <p className="text-sm text-gray-500">{p.area}, {p.postcode}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'LET' ? 'bg-teal-100 text-teal-700' : p.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              {p.listing && <p className="text-sm text-gray-500 mt-1">£{p.listing.price.toLocaleString()}/mo</p>}
            </Link>
          ))}
        </div>
      )}

      {tab === 'Statements' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {landlord.statements.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No statements generated</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rent Received</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fees</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Net Payout</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">PDF</th>
              </tr></thead>
              <tbody>
                {landlord.statements.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">{new Date(s.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – {new Date(s.periodEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{fmt(s.rentReceived)}</td>
                    <td className="px-4 py-3 text-red-500">-{fmt(s.feesDeducted)}</td>
                    <td className="px-4 py-3 font-bold">{fmt(s.closingBalance)}</td>
                    <td className="px-4 py-3">
                      {s.pdfUrl ? (
                        <a href={s.pdfUrl} target="_blank" className="flex items-center gap-1 text-xs text-[#1A3D2B] hover:text-[#122B1E]">
                          <Download size={13} />PDF
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Fees' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {landlord.fees.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No fees recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Amount</th>
              </tr></thead>
              <tbody>
                {landlord.fees.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">{new Date(f.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{f.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{f.description ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{fmt(f.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Notes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {landlord.notesList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No notes yet</p>
          ) : (
            <ul className="space-y-4">
              {landlord.notesList.map((note) => (
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
