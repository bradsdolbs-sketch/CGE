'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
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

export default function ApplicantsClient({ enquiries, stages }: Props) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
    setUpdatingId(enquiry.id)
    try {
      await fetch(`/api/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      })
      // Reload to get fresh data
      window.location.reload()
    } catch {
      setUpdatingId(null)
    }
  }

  return (
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
