'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Send, Clock, ThumbsUp, ThumbsDown, Upload } from 'lucide-react'
import type { MaintenanceRequest, Property, Contractor, MaintenanceUpdate } from '@prisma/client'

type RequestFull = MaintenanceRequest & {
  property: Property
  contractor: Contractor | null
  updates: MaintenanceUpdate[]
}

const priorityColors = {
  EMERGENCY: 'bg-red-100 text-red-700 border-red-200',
  URGENT: 'bg-amber-100 text-amber-700 border-amber-200',
  ROUTINE: 'bg-blue-100 text-blue-700 border-blue-200',
}

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  AWAITING_PARTS: 'bg-orange-100 text-orange-700',
  AWAITING_APPROVAL: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-teal-100 text-teal-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

export default function MaintenanceDetailClient({ request, contractors }: { request: RequestFull; contractors: Contractor[] }) {
  const router = useRouter()
  const [updateNote, setUpdateNote] = useState('')
  const [updateStatus, setUpdateStatus] = useState(request.status)
  const [assignContractorId, setAssignContractorId] = useState(request.contractorId ?? '')
  const [quoteAmount, setQuoteAmount] = useState(request.quoteAmount ? String(request.quoteAmount) : '')
  const [saving, setSaving] = useState(false)
  const [addingUpdate, setAddingUpdate] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchError, setDispatchError] = useState<string | null>(null)

  async function assignContractor() {
    setSaving(true)
    try {
      await fetch(`/api/maintenance/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId: assignContractorId, quoteAmount: quoteAmount ? parseInt(quoteAmount) : null, status: 'ASSIGNED' }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function approveQuote() {
    setSaving(true)
    try {
      await fetch(`/api/maintenance/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteApproved: true, status: 'IN_PROGRESS' }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function addUpdate() {
    if (!updateNote.trim()) return
    setAddingUpdate(true)
    try {
      await fetch(`/api/maintenance/${request.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updateStatus, note: updateNote }),
      })
      setUpdateNote('')
      router.refresh()
    } finally {
      setAddingUpdate(false)
    }
  }

  async function dispatchToContractor() {
    setDispatching(true)
    setDispatchError(null)
    try {
      const res = await fetch(`/api/maintenance/${request.id}/assign-contractor`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setDispatchError(d.error ?? 'Failed to dispatch')
      } else {
        router.refresh()
      }
    } finally {
      setDispatching(false)
    }
  }

  async function closeJob() {
    setSaving(true)
    try {
      await fetch(`/api/maintenance/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/maintenance" className="text-gray-400 hover:text-[#1a1a1a] transition"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{request.title}</h1>
          <p className="text-sm text-gray-500">{request.property.addressLine1}, {request.property.area}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[request.priority]}`}>{request.priority}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status] ?? ''}`}>{request.status.replace('_', ' ')}</span>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-[#1a1a1a] mb-3">Job Details</h2>
        <p className="text-sm text-gray-700 mb-4">{request.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex gap-2"><span className="text-gray-500 w-28">Category</span><span>{request.category.replace('_', ' ')}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-28">Reported</span><span>{new Date(request.reportedAt).toLocaleDateString('en-GB')}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-28">By Tenant</span><span>{request.reportedByTenant ? 'Yes' : 'No'}</span></div>
          {request.quoteAmount && <div className="flex gap-2"><span className="text-gray-500 w-28">Quote</span><span>£{request.quoteAmount.toLocaleString()}</span></div>}
          {request.invoiceAmount && <div className="flex gap-2"><span className="text-gray-500 w-28">Invoice</span><span>£{request.invoiceAmount.toLocaleString()}</span></div>}
        </div>

        {request.photos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-[#1a1a1a] mb-2">Photos</p>
            <div className="flex gap-3 flex-wrap">
              {request.photos.map((url) => (
                <a key={url} href={url} target="_blank">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contractor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-[#1a1a1a] mb-3">Contractor</h2>
        {request.contractor ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#1a1a1a]">{request.contractor.name}</p>
                <p className="text-sm text-gray-500">{request.contractor.trade}</p>
                <p className="text-sm text-gray-500">{request.contractor.phone}</p>
                {request.contractor.email && (
                  <p className="text-sm text-gray-500">{request.contractor.email}</p>
                )}
              </div>
              {request.status === 'AWAITING_APPROVAL' && (
                <button onClick={approveQuote} disabled={saving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
                  <CheckCircle size={15} />Approve Quote (£{request.quoteAmount?.toLocaleString()})
                </button>
              )}
            </div>

            {/* Magic-link dispatch status */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Job Dispatch</p>
              {request.contractorCompletedAt ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={15} />
                    <span className="text-sm font-semibold">Completed by contractor</span>
                    <span className="text-xs text-gray-400">{new Date(request.contractorCompletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {request.contractorCompletionNote && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Completion Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{request.contractorCompletionNote}</p>
                    </div>
                  )}
                  {request.contractorCompletionPhotos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Completion Photos</p>
                      <div className="flex gap-2 flex-wrap">
                        {request.contractorCompletionPhotos.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {request.contractorReportUrl && (
                    <a href={request.contractorReportUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#1A3D2B] underline">
                      <Upload size={13} />View completion report
                    </a>
                  )}
                </div>
              ) : request.contractorAcceptedAt ? (
                <div className="flex items-center gap-2 text-blue-700">
                  <ThumbsUp size={15} />
                  <span className="text-sm font-semibold">Accepted</span>
                  <span className="text-xs text-gray-400">{new Date(request.contractorAcceptedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ) : request.contractorDeclinedAt ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <ThumbsDown size={15} />
                    <span className="text-sm font-semibold">Declined</span>
                    <span className="text-xs text-gray-400">{new Date(request.contractorDeclinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {request.contractorDeclineReason && (
                    <p className="text-sm text-gray-600 italic">"{request.contractorDeclineReason}"</p>
                  )}
                </div>
              ) : request.contractorNotifiedAt ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock size={15} />
                  <span className="text-sm font-semibold">Awaiting response</span>
                  <span className="text-xs text-gray-400">Sent {new Date(request.contractorNotifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {dispatchError && <p className="text-sm text-red-600">{dispatchError}</p>}
                  {!request.contractor.email ? (
                    <p className="text-sm text-amber-600">⚠ Contractor has no email address — cannot dispatch magic link.</p>
                  ) : (
                    <button
                      onClick={dispatchToContractor}
                      disabled={dispatching}
                      className="flex items-center gap-2 bg-[#c4622d] hover:bg-[#a8501f] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                    >
                      <Send size={14} />{dispatching ? 'Sending…' : 'Dispatch Magic Link'}
                    </button>
                  )}
                </div>
              )}

              {/* Re-dispatch option for notified/accepted (not completed) */}
              {request.contractorNotifiedAt && !request.contractorCompletedAt && request.contractor.email && (
                <button
                  onClick={dispatchToContractor}
                  disabled={dispatching}
                  className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  <Send size={11} />{dispatching ? 'Sending…' : 'Resend link'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assign Contractor</label>
                <select className={inputClass} value={assignContractorId} onChange={(e) => setAssignContractorId(e.target.value)}>
                  <option value="">Select contractor…</option>
                  {contractors.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.trade}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quote Amount (£)</label>
                <input type="number" className={inputClass} value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} placeholder="0" />
              </div>
            </div>
            <button onClick={assignContractor} disabled={!assignContractorId || saving} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
              {saving ? 'Saving…' : 'Assign Contractor'}
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-[#1a1a1a] mb-4">Activity Timeline</h2>
        {request.updates.length === 0 ? (
          <p className="text-sm text-gray-400">No updates yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-3 space-y-4">
            {request.updates.map((u) => (
              <li key={u.id} className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[#1A3D2B]" />
                <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${statusColors[u.status] ?? ''}`}>{u.status.replace('_', ' ')}</span>
                <p className="text-sm text-[#1a1a1a]">{u.note}</p>
              </li>
            ))}
          </ol>
        )}

        {/* Add update */}
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Add Update</h3>
          <div className="grid grid-cols-2 gap-3">
            <select className={inputClass} value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value as typeof updateStatus)}>
              {['NEW','ASSIGNED','IN_PROGRESS','AWAITING_PARTS','AWAITING_APPROVAL','COMPLETED','INVOICED','CANCELLED'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <textarea
            rows={3}
            className={inputClass}
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
            placeholder="Describe the update…"
          />
          <div className="flex gap-3">
            <button onClick={addUpdate} disabled={!updateNote.trim() || addingUpdate} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
              {addingUpdate ? 'Adding…' : 'Add Update'}
            </button>
            {request.status !== 'COMPLETED' && (
              <button onClick={closeJob} disabled={saving} className="flex items-center gap-2 border border-green-500 text-green-600 hover:bg-green-50 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
                <CheckCircle size={14} />Close Job
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
