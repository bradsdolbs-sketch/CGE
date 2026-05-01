'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function StaffLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const resetSuccess = searchParams.get('reset') === 'success'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })
      if (result?.error) {
        setError('Invalid email or password.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#1e2420' }}>
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <Link href="/">
            <span
              className="text-white font-bold text-2xl"
              style={{ fontFamily: 'var(--font-syne)', borderBottom: '2px solid #5db07a', paddingBottom: '2px' }}
            >
              CGE
            </span>
          </Link>
          <p className="text-white/30 text-xs mt-3 uppercase tracking-widest" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Staff Access
          </p>
        </div>

        {resetSuccess && (
          <div className="mb-5 p-3 bg-green-900/40 border border-green-700/50 rounded-lg text-sm text-green-300">
            Password updated. Please sign in.
          </div>
        )}
        {error && (
          <div className="mb-5 p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#5db07a]/40 focus:border-[#5db07a]/50 transition"
              placeholder="you@centralgateestates.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#5db07a]/40 focus:border-[#5db07a]/50 transition"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-white/30 hover:text-white/60 transition">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50"
            style={{ background: '#1A3D2B', color: '#f5f2ee' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#122B1E')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1A3D2B')}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  )
}
