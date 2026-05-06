'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  jobId: string
}

export default function ApproveMaintenanceButtons({ jobId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'decline' | null>(null)

  async function handle(action: 'approve' | 'decline') {
    setLoading(action)
    try {
      await fetch(`/api/maintenance/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteApproved: action === 'approve',
          status: action === 'approve' ? 'IN_PROGRESS' : 'CANCELLED',
        }),
      })
      router.refresh()
    } catch {
      // silent
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('approve')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded hover:bg-green-700 transition disabled:opacity-50"
      >
        <Check size={12} />
        {loading === 'approve' ? '…' : 'Approve'}
      </button>
      <button
        onClick={() => handle('decline')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 border border-red-400 text-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded hover:bg-red-50 transition disabled:opacity-50"
      >
        <X size={12} />
        {loading === 'decline' ? '…' : 'Decline'}
      </button>
    </div>
  )
}
