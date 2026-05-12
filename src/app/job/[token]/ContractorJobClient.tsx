'use client'

import { useState, useRef } from 'react'

interface JobData {
  id: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  notes: string | null
  propertyAddress: string
  contractorName: string | null
  contractorCompany: string | null
  expired: boolean
  contractorNotifiedAt: string | null
  contractorAcceptedAt: string | null
  contractorDeclinedAt: string | null
  contractorDeclineReason: string | null
  contractorCompletedAt: string | null
  contractorCompletionNote: string | null
  contractorCompletionPhotos: string[]
  contractorReportUrl: string | null
}

const priorityColors: Record<string, string> = {
  EMERGENCY: 'bg-red-100 text-red-700',
  URGENT: 'bg-orange-100 text-orange-700',
  ROUTINE: 'bg-green-100 text-green-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ContractorJobClient({ job, token }: { job: JobData; token: string }) {
  const [view, setView] = useState<'main' | 'decline' | 'complete'>('main')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ action: 'accepted' | 'declined' | 'completed'; at: string } | null>(
    job.contractorAcceptedAt
      ? { action: 'accepted', at: job.contractorAcceptedAt }
      : job.contractorDeclinedAt
      ? { action: 'declined', at: job.contractorDeclinedAt }
      : job.contractorCompletedAt
      ? { action: 'completed', at: job.contractorCompletedAt }
      : null
  )
  const [declineReason, setDeclineReason] = useState('')
  const [completionNote, setCompletionNote] = useState('')
  const [reportUrl, setReportUrl] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const priorityLabel = job.priority.charAt(0) + job.priority.slice(1).toLowerCase()

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/job/${token}/accept`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to accept job')
      }
      setDone({ action: 'accepted', at: new Date().toISOString() })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDecline() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/job/${token}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to decline job')
      }
      setDone({ action: 'declined', at: new Date().toISOString() })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoUpload(files: FileList) {
    setUploadingPhotos(true)
    setError(null)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/job/${token}/upload`, { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json()
        uploaded.push(d.url)
      }
    }
    setPhotos((prev) => [...prev, ...uploaded])
    setUploadingPhotos(false)
  }

  async function handleComplete() {
    if (!completionNote.trim()) {
      setError('Please add completion notes before submitting.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/job/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionNote, photos, reportUrl: reportUrl || undefined }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to submit')
      }
      setDone({ action: 'completed', at: new Date().toISOString() })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // ── Already-actioned state ──────────────────────────────────────────────────
  if (done) {
    const config = {
      accepted: { icon: '✅', title: 'Job Accepted', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
      declined: { icon: '❌', title: 'Job Declined', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
      completed: { icon: '🎉', title: 'Job Marked Complete', color: 'text-[#1A3D2B]', bg: 'bg-green-50 border-green-200' },
    }[done.action]

    return (
      <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{config.icon}</div>
            <h1 className={`text-xl font-bold ${config.color}`}>{config.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{formatDate(done.at)}</p>
          </div>
          <div className={`border rounded-xl p-4 ${config.bg} mb-4`}>
            <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
            <p className="text-gray-500 text-xs mt-1">{job.propertyAddress}</p>
          </div>
          {done.action === 'completed' && job.contractorCompletionNote && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{job.contractorCompletionNote}</p>
            </div>
          )}
          {done.action === 'accepted' && (
            <button
              onClick={() => setView('complete')}
              className="w-full mt-4 bg-[#c4622d] text-white py-3 rounded-xl font-semibold text-sm"
            >
              Mark as Complete
            </button>
          )}
          <p className="text-center text-xs text-gray-400 mt-6">Central Gate Estates · hello@centralgateestates.com</p>
        </div>
      </main>
    )
  }

  // ── Complete form ───────────────────────────────────────────────────────────
  if (view === 'complete') {
    return (
      <main className="min-h-screen bg-[#f5f2ee] p-4 pb-12">
        <div className="max-w-lg mx-auto">
          <Header />
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Mark Job Complete</h2>
            <p className="text-sm text-gray-500 mb-5">{job.title} · {job.propertyAddress}</p>

            <label className="block text-sm font-semibold text-gray-700 mb-1">Completion Notes <span className="text-red-500">*</span></label>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={4}
              placeholder="Describe what was done, materials used, any follow-up needed..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#c4622d] mb-4"
            />

            <label className="block text-sm font-semibold text-gray-700 mb-1">Photos (optional)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#c4622d] transition-colors mb-3"
            >
              {uploadingPhotos ? (
                <p className="text-sm text-gray-500">Uploading...</p>
              ) : (
                <>
                  <p className="text-2xl mb-1">📷</p>
                  <p className="text-sm text-gray-500">Tap to add photos</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
            />
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <label className="block text-sm font-semibold text-gray-700 mb-1">Report PDF URL (optional)</label>
            <input
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c4622d] mb-5"
            />

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <button
              onClick={handleComplete}
              disabled={loading || !completionNote.trim()}
              className="w-full bg-[#1A3D2B] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Completion'}
            </button>
            <button onClick={() => setView('main')} className="w-full text-gray-500 text-sm py-3 mt-2">
              ← Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Decline form ────────────────────────────────────────────────────────────
  if (view === 'decline') {
    return (
      <main className="min-h-screen bg-[#f5f2ee] p-4 pb-12">
        <div className="max-w-lg mx-auto">
          <Header />
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Decline Job</h2>
            <p className="text-sm text-gray-500 mb-5">{job.title} · {job.propertyAddress}</p>

            <label className="block text-sm font-semibold text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="Not available on requested dates, outside of trade area..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-red-400 mb-5"
            />

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <button
              onClick={handleDecline}
              disabled={loading}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50 mb-2"
            >
              {loading ? 'Declining...' : 'Confirm Decline'}
            </button>
            <button onClick={() => setView('main')} className="w-full text-gray-500 text-sm py-3">
              ← Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Main job view ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#f5f2ee] p-4 pb-12">
      <div className="max-w-lg mx-auto">
        <Header />

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{job.title}</h1>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColors[job.priority] ?? 'bg-gray-100 text-gray-600'}`}>
              {priorityLabel}
            </span>
          </div>

          <div className="space-y-2 mb-5">
            <DetailRow icon="📍" label={job.propertyAddress} />
            <DetailRow icon="🔧" label={job.category.charAt(0) + job.category.slice(1).toLowerCase()} />
          </div>

          <div className="border-t border-gray-100 pt-4 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>

          {job.notes && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Access Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{job.notes}</p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setView('decline')}
              className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-[2] bg-[#c4622d] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Accepting...' : 'Accept Job'}
            </button>
          </div>

          <button
            onClick={() => setView('complete')}
            className="w-full mt-3 border border-[#1A3D2B] text-[#1A3D2B] py-3 rounded-xl font-semibold text-sm"
          >
            Mark as Complete
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Central Gate Estates · hello@centralgateestates.com
        </p>
      </div>
    </main>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="w-8 h-1 bg-[#c4622d] rounded-full" />
      <span className="font-bold text-gray-900 text-sm tracking-tight">Central Gate Estates</span>
    </div>
  )
}

function DetailRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-600">
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  )
}
