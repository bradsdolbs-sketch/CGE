'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { X, Loader2 } from 'lucide-react'
import type { Enquiry, Property, Viewing } from '@prisma/client'

type EnquiryWithRelations = Enquiry & {
  property: Property | null
  viewings: Viewing[]
}

interface Props {
  enquiries: EnquiryWithRelations[]
  stages: string[]
}

const STAGE_LABELS: Record<string, string> = {
  ENQUIRY: 'Enquiry',
  VIEWING_BOOKED: 'Viewing Booked',
  VIEWING_DONE: 'Viewing Done',
  OFFER_MADE: 'Offer Made',
  REFERENCING: 'Referencing',
  LET_AGREED: 'Let Agreed',
  MOVED_IN: 'Moved In',
}

const STAGE_COLOURS: Record<string, string> = {
  ENQUIRY: 'bg-gray-100 text-gray-700',
  VIEWING_BOOKED: 'bg-blue-50 text-blue-700',
  VIEWING_DONE: 'bg-indigo-50 text-indigo-700',
  OFFER_MADE: 'bg-amber-50 text-amber-700',
  REFERENCING: 'bg-purple-50 text-purple-700',
  LET_AGREED: 'bg-green-50 text-green-700',
  MOVED_IN: 'bg-green-100 text-green-800',
}

interface OfferFormData {
  proposedRent: string
  startDate: string
  tenancyTerm: string
  depositAmount: string
  depositScheme: string
  specialConditions: string
}

function OfferModal({
  enquiry,
  onClose,
  onSaved,
}: {
  enquiry: EnquiryWithRelations
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<OfferFormData>({
    proposedRent: enquiry.maxBudget ? String(enquiry.maxBudget) : '',
    startDate: '',
    tenancyTerm: '12',
    depositAmount: '',
    depositScheme: 'TDS',
    specialConditions: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const field = (key: keyof OfferFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!enquiry.propertyId) {
      setError('This enquiry has no linked property. Assign a property first.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Save offer
      const offerRes = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId: enquiry.id,
          propertyId: enquiry.propertyId,
          proposedRent: Number(form.proposedRent),
          startDate: form.startDate,
          tenancyTerm: Number(form.tenancyTerm),
          depositAmount: Number(form.depositAmount),
          depositScheme: form.depositScheme,
          specialConditions: form.specialConditions || null,
        }),
      })
      if (!offerRes.ok) {
        const d = await offerRes.json()
        throw new Error(d.error ?? 'Failed to save offer')
      }

      // Advance stage to OFFER_MADE
      const stageRes = await fetch(`/api/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'OFFER_MADE' }),
      })
      if (!stageRes.ok) throw new Error('Failed to advance stage')

      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]'
  const labelCls = 'block text-xs font-semibold text-[#8a7968] uppercase tracking-wider mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-[#1a1a1a] text-base">Capture Offer Terms</h2>
            <p className="text-xs text-[#8a7968] mt-0.5">
              {enquiry.firstName} {enquiry.lastName}
              {enquiry.property ? ` — ${enquiry.property.addressLine1}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monthly Rent (£)</label>
              <input type="number" required min="1" className={inputCls} placeholder="1500" {...field('proposedRent')} />
            </div>
            <div>
              <label className={labelCls}>Deposit (£)</label>
              <input type="number" required min="1" className={inputCls} placeholder="1730" {...field('depositAmount')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" required className={inputCls} {...field('startDate')} />
            </div>
            <div>
              <label className={labelCls}>Term (months)</label>
              <input type="number" required min="1" max="60" className={inputCls} {...field('tenancyTerm')} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Deposit Scheme</label>
            <select className={inputCls} {...field('depositScheme')}>
              <option value="TDS">TDS (Tenancy Deposit Scheme)</option>
              <option value="DPS">DPS (Deposit Protection Service)</option>
              <option value="myDeposits">myDeposits</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Special Conditions (optional)</label>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="e.g. No pets, professional reference required…"
              {...field('specialConditions')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-[#8a7968] hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#1A3D2B' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save & Advance to Offer Made'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApplicantsClient({ enquiries, stages }: Props) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [offerModalEnquiry, setOfferModalEnquiry] = useState<EnquiryWithRelations | null>(null)

  const filtered = enquiries.filter((e) => {
    const q = search.toLowerCase()
    return (
      !q ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.property?.addressLine1 ?? '').toLowerCase().includes(q)
    )
  })

  async function advanceStage(enquiry: EnquiryWithRelations) {
    const currentIdx = stages.indexOf(enquiry.stage)
    if (currentIdx === stages.length - 1) return
    const nextStage = stages[currentIdx + 1]

    // If advancing to OFFER_MADE, show the offer modal instead
    if (nextStage === 'OFFER_MADE') {
      setOfferModalEnquiry(enquiry)
      return
    }

    setUpdatingId(enquiry.id)
    try {
      await fetch(`/api/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      })
      window.location.reload()
    } catch {
      setUpdatingId(null)
    }
  }

  return (
    <>
      {offerModalEnquiry && (
        <OfferModal
          enquiry={offerModalEnquiry}
          onClose={() => setOfferModalEnquiry(null)}
          onSaved={() => { setOfferModalEnquiry(null); window.location.reload() }}
        />
      )}

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            placeholder="Search applicants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
          />
          <div className="flex border border-gray-200 rounded overflow-hidden ml-auto">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 text-sm font-medium transition ${view === 'kanban' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#8a7968] hover:bg-gray-50'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium transition ${view === 'list' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#8a7968] hover:bg-gray-50'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Kanban */}
        {view === 'kanban' && (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const cards = filtered.filter((e) => e.stage === stage)
              return (
                <div key={stage} className="flex-shrink-0 w-60">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8a7968]">
                      {STAGE_LABELS[stage] ?? stage}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {cards.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cards.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded p-4 text-center text-xs text-gray-400">
                        Empty
                      </div>
                    )}
                    {cards.map((enquiry) => (
                      <KanbanCard
                        key={enquiry.id}
                        enquiry={enquiry}
                        stages={stages}
                        updating={updatingId === enquiry.id}
                        onAdvance={() => advanceStage(enquiry)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List */}
        {view === 'list' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Enquired</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No applicants found</td>
                  </tr>
                )}
                {filtered.map((enquiry) => {
                  const nextIdx = stages.indexOf(enquiry.stage) + 1
                  const canAdvance = nextIdx < stages.length
                  return (
                    <tr key={enquiry.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1a1a1a]">{enquiry.firstName} {enquiry.lastName}</div>
                        <div className="text-xs text-[#8a7968]">{enquiry.email}</div>
                      </td>
                      <td className="px-4 py-3 text-[#8a7968]">
                        {enquiry.property ? (
                          <Link href={`/dashboard/properties/${enquiry.property.id}`} className="hover:text-[#1A3D2B] transition">
                            {enquiry.property.addressLine1}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">No property</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STAGE_COLOURS[enquiry.stage] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STAGE_LABELS[enquiry.stage] ?? enquiry.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#8a7968]">
                        {enquiry.maxBudget ? `£${enquiry.maxBudget.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#8a7968] text-xs">
                        {format(new Date(enquiry.createdAt), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        {canAdvance && (
                          <button
                            onClick={() => advanceStage(enquiry)}
                            disabled={updatingId === enquiry.id}
                            className="text-xs font-medium text-[#1A3D2B] hover:text-[#122B1E] transition disabled:opacity-50"
                          >
                            → {STAGE_LABELS[stages[nextIdx]] ?? stages[nextIdx]}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function KanbanCard({
  enquiry,
  stages,
  updating,
  onAdvance,
}: {
  enquiry: EnquiryWithRelations
  stages: string[]
  updating: boolean
  onAdvance: () => void
}) {
  const nextIdx = stages.indexOf(enquiry.stage) + 1
  const canAdvance = nextIdx < stages.length

  return (
    <div className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition">
      <div className="font-medium text-sm text-[#1a1a1a] mb-0.5">
        {enquiry.firstName} {enquiry.lastName}
      </div>
      <div className="text-xs text-[#8a7968] mb-2 truncate">{enquiry.email}</div>
      {enquiry.property && (
        <div className="text-xs text-[#8a7968] mb-2 bg-gray-50 rounded px-2 py-1 truncate">
          {enquiry.property.addressLine1}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8a7968]">
          {format(new Date(enquiry.createdAt), 'd MMM')}
        </span>
        {canAdvance && (
          <button
            onClick={onAdvance}
            disabled={updating}
            className="text-xs font-medium text-[#1A3D2B] hover:text-[#122B1E] transition disabled:opacity-50"
          >
            {updating ? '…' : 'Advance →'}
          </button>
        )}
      </div>
    </div>
  )
}
