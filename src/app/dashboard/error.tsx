'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#8a7968] mb-6">
          This section failed to load. Your data is safe — try refreshing.
        </p>
        {error.digest && (
          <p className="text-xs text-[#8a7968] font-mono mb-4">Ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#1A3D2B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
