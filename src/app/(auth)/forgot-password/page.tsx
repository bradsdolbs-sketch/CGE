'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send reset email')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
            {submitted ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Check your email</h1>
                <p className="text-sm text-gray-500 mb-6">
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. It expires in 1 hour.
                </p>
                <Link
                  href="/login"
                  className="text-sm text-[#1A3D2B] hover:text-[#122B1E] font-medium transition"
                >
                  ← Back to login
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Forgot your password?</h1>
                <p className="text-sm text-gray-500 mb-8">
                  Enter your email and we&apos;ll send you a reset link.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent transition"
                      placeholder="your@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-[#1A3D2B] hover:text-[#122B1E] transition">
                    ← Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
