'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-[#c4622d] font-semibold text-sm tracking-widest uppercase mb-4">Error</p>
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
          Something went wrong
        </h1>
        <p className="text-[#8a7968] mb-8">
          An unexpected error occurred. Try again, or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-[#8a7968] font-mono mb-6">Ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#1A3D2B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 border border-[#d5cfc8] text-[#1a1a1a] text-sm font-semibold rounded-lg hover:bg-white transition"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  )
}
