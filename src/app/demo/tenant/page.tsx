'use client'

import Link from 'next/link'
import {
  Home, Wrench, FileText, CreditCard, User, LogIn,
  CheckCircle, Clock, AlertTriangle, ClipboardCheck, Calendar,
} from 'lucide-react'

const NAV = [
  { label: 'Overview', icon: Home },
  { label: 'Referencing', icon: ClipboardCheck },
  { label: 'Maintenance', icon: Wrench, badge: 1 },
  { label: 'Documents', icon: FileText },
  { label: 'Payments', icon: CreditCard },
  { label: 'Profile', icon: User },
]

const PAYMENTS = [
  { period: 'April 2026', amount: 1875, status: 'DUE', dueDate: '1 Apr 2026' },
  { period: 'March 2026', amount: 1875, status: 'PAID', dueDate: '1 Mar 2026' },
  { period: 'February 2026', amount: 1875, status: 'PAID', dueDate: '1 Feb 2026' },
]

const MAINTENANCE = [
  {
    title: 'Kitchen tap dripping',
    category: 'Plumbing',
    status: 'IN_PROGRESS',
    priority: 'ROUTINE',
    date: '18 Mar 2026',
    contractor: 'FastFix Plumbing',
  },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
}

export default function TenantDemoPage() {
  const totalDays = 365
  const daysElapsed = 60
  const daysRemaining = 305
  const progressPct = Math.round((daysElapsed / totalDays) * 100)

  return (
    <div className="min-h-screen" style={{ background: '#F0EBE0' }}>

      {/* Demo banner */}
      <div
        style={{
          background: '#1A3D2B',
          color: '#f5f2ee',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 60,
        }}
      >
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', margin: 0 }}>
          <strong>Demo mode</strong> — this is a preview with sample data. Sign in to see your real tenancy.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: 'rgba(240,235,224,0.55)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontFamily: 'var(--font-dm-sans)',
              fontWeight: 500,
              fontSize: '12px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            ← Back to site
          </Link>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F0EBE0',
              color: '#1A3D2B',
              padding: '6px 14px',
              borderRadius: '4px',
              fontFamily: 'var(--font-dm-sans)',
              fontWeight: 700,
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            <LogIn size={13} />
            Sign in
          </Link>
        </div>
      </div>

      {/* Portal header */}
      <header className="bg-[#1a1a1a] text-white h-14 flex items-center px-4 gap-4 sticky top-[2.5rem] z-50">
        <div className="flex items-center gap-2 flex-1">
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-syne)' }}>CGE</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-syne)', color: '#5db07a' }}>Tenant Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 hidden sm:block">James C.</span>
          <span className="text-xs bg-[#1A3D2B] text-white/70 px-2 py-1 rounded font-medium">DEMO</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[200px] bg-[#1a1a1a] flex-col sticky top-[calc(2.5rem+3.5rem)] h-[calc(100vh-2.5rem-3.5rem)]">
          <nav className="flex-1 py-6 px-3 space-y-1">
            {NAV.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded text-sm ${
                    i === 0 ? 'bg-[#1A3D2B] text-white font-medium' : 'text-white/50 cursor-default'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} className="flex-shrink-0" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-xs font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
            >
              <LogIn size={15} />
              Sign in to your account
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-8 min-w-0 max-w-4xl space-y-6">

          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>
              Good morning, James
            </h1>
            <p className="text-sm text-[#8a7968] mt-0.5">Your tenancy at 14 Columbia Road</p>
          </div>

          {/* Property + tenancy card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>
                    14 Columbia Road, E2 7RG
                  </h2>
                  <p className="text-xs text-[#8a7968] mt-0.5">Bethnal Green · 2 bed · 1 bath</p>
                </div>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#8a7968] mb-0.5">Monthly Rent</p>
                <p className="font-semibold text-[#1a1a1a]">{fmt(1875)}</p>
              </div>
              <div>
                <p className="text-xs text-[#8a7968] mb-0.5">Start Date</p>
                <p className="font-semibold text-[#1a1a1a]">1 Mar 2026</p>
              </div>
              <div>
                <p className="text-xs text-[#8a7968] mb-0.5">End Date</p>
                <p className="font-semibold text-[#1a1a1a]">28 Feb 2027</p>
              </div>
              <div>
                <p className="text-xs text-[#8a7968] mb-0.5">Days Remaining</p>
                <p className="font-semibold text-[#1a1a1a]">{daysRemaining}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between text-xs text-[#8a7968] mb-1.5">
                <span>{daysElapsed} days elapsed</span>
                <span>{progressPct}% through tenancy</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1A3D2B] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next rent payment */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a]">Next rent payment</p>
                <p className="text-sm text-[#8a7968]">Due 1 April 2026 · <span className="text-amber-600 font-medium">3 days away</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>{fmt(1875)}</p>
              <p className="text-xs text-[#8a7968]">via standing order</p>
            </div>
          </div>

          {/* Recent payments */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>Payment History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {PAYMENTS.map(p => (
                <div key={p.period} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{p.period}</p>
                    <p className="text-xs text-[#8a7968]">Due {p.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-[#1a1a1a]">{fmt(p.amount)}</p>
                    {p.status === 'PAID' ? (
                      <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={11} /> Paid
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock size={11} /> Due
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>Open Maintenance</h2>
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">1 open</span>
            </div>
            {MAINTENANCE.map(m => (
              <div key={m.title} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#1a1a1a]">{m.title}</p>
                  <p className="text-xs text-[#8a7968] mt-0.5">{m.category} · Reported {m.date}</p>
                  <p className="text-xs text-[#1A3D2B] font-medium mt-1">Assigned to {m.contractor}</p>
                </div>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  In Progress
                </span>
              </div>
            ))}
          </div>

          {/* Sign in CTA */}
          <div className="bg-[#1A3D2B] rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>Already a tenant with CGE?</p>
              <p className="text-sm text-white/60 mt-0.5">Sign in to view your real tenancy, raise maintenance requests, and download documents.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-[#1A3D2B] font-bold text-sm px-5 py-2.5 rounded hover:bg-[#F0EBE0] transition whitespace-nowrap"
            >
              <LogIn size={14} />
              Sign in now
            </Link>
          </div>

        </main>
      </div>
    </div>
  )
}
