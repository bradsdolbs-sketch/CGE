'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Building2, HardHat } from 'lucide-react'

const PORTALS = [
  {
    key: 'tenant',
    label: 'Tenant',
    icon: Home,
    desc: 'Access your tenancy, payments & maintenance',
    callbackUrl: '/portal/tenant',
    placeholder: 'your@email.com',
  },
  {
    key: 'landlord',
    label: 'Landlord',
    icon: Building2,
    desc: 'View statements, approve jobs & track compliance',
    callbackUrl: '/portal/landlord',
    placeholder: 'your@email.com',
  },
  {
    key: 'contractor',
    label: 'Contractor',
    icon: HardHat,
    desc: 'View your assigned jobs and updates',
    callbackUrl: '/',
    placeholder: 'your@email.com',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  const [selected, setSelected] = useState('tenant')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const portal = PORTALS.find(p => p.key === selected)!

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: portal.callbackUrl,
      })
      if (result?.error) {
        setError('Invalid email or password.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0EBE0' }}>
      {/* Header */}
      <div className="bg-[#1e2420] px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-syne)', borderBottom: '2px solid #5db07a', paddingBottom: '1px' }}>CGE</span>
          <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '10px' }}>Central Gate Estates</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">

          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>
              Sign in to your portal
            </h1>
            <p className="text-sm text-gray-500 mt-1">Select your account type to continue</p>
          </div>

          {resetSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Password updated successfully. Please sign in with your new password.
            </div>
          )}

          {/* Portal selector */}
          <div className="grid grid-cols-3 gap-3">
            {PORTALS.map(p => {
              const Icon = p.icon
              const active = selected === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => { setSelected(p.key); setError(null) }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                    active
                      ? 'border-[#1A3D2B] bg-white shadow-sm'
                      : 'border-transparent bg-white/60 hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-[#1A3D2B]' : 'bg-gray-100'}`}>
                    <Icon size={17} className={active ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <span className={`text-xs font-bold ${active ? 'text-[#1A3D2B]' : 'text-gray-500'}`}>
                    {p.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-7">
            <div className="mb-5">
              <p className="font-semibold text-[#1a1a1a] text-sm">{portal.label} Portal</p>
              <p className="text-xs text-gray-400 mt-0.5">{portal.desc}</p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={e => setEmail(e.target.value)}
                  placeholder={portal.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B] transition"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B] transition"
                />
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-[#1A3D2B] hover:text-[#122B1E] transition">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 text-sm"
              >
                {loading ? 'Signing in…' : `Sign in to ${portal.label} Portal`}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
