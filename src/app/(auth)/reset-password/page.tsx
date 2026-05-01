'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to reset password')
      router.push('/login?reset=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-sm text-[#1A3D2B] hover:text-[#122B1E] font-medium transition">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Set a new password</h1>
      <p className="text-sm text-gray-500 mb-8">Must be at least 8 characters.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f5f2ee] flex flex-col">
      <div className="bg-[#1a1a1a] px-6 py-4">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          Central Gate Estates
        </Link>
        <span className="block w-8 h-0.5 bg-[#1A3D2B] mt-1" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
