'use client'

import Link from 'next/link'
import {
  Home, Building2, FileText, Wrench, FolderOpen, User,
  PoundSterling, AlertTriangle, CheckCircle, X, LogIn,
  TrendingUp, Clock,
} from 'lucide-react'

const NAV = [
  { label: 'Overview', icon: Home },
  { label: 'My Properties', icon: Building2 },
  { label: 'Statements', icon: FileText },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Documents', icon: FolderOpen },
  { label: 'Profile', icon: User },
]

const PROPERTIES = [
  {
    address: '14 Columbia Road',
    area: 'Bethnal Green, E2 7RG',
    status: 'Let',
    tenant: 'James Carter',
    rent: 1875,
    endDate: '28 Feb 2026',
    daysLeft: 305,
    jobs: 0,
  },
  {
    address: '45 Hackney Road',
    area: 'Hackney, E2 8JN',
    status: 'Let',
    tenant: 'Priya Sharma',
    rent: 1950,
    endDate: '15 Aug 2025',
    daysLeft: 108,
    jobs: 1,
  },
]

const MAINTENANCE = [
  {
    title: 'Boiler replacement',
    address: '45 Hackney Road',
    quote: 1200,
    priority: 'URGENT',
    status: 'AWAITING_APPROVAL',
  },
]

const STATEMENTS = [
  { period: 'March 2026', gross: 3825, fees: 459, maintenance: 0, net: 3366 },
  { period: 'February 2026', gross: 3825, fees: 459, maintenance: 185, net: 3181 },
  { period: 'January 2026', gross: 3825, fees: 459, maintenance: 0, net: 3366 },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
}

export default function LandlordDemoPage() {
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
          <strong>Demo mode</strong> — this is a preview with sample data. Sign in to see your real portfolio.
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
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-syne)', color: '#5db07a' }}>Landlord Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 hidden sm:block">Sarah T.</span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm ${
                    i === 0 ? 'bg-[#1A3D2B] text-white font-medium' : 'text-white/50 cursor-default'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {item.label}
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>
                Good morning, Sarah
              </h1>
              <p className="text-sm text-[#8a7968] mt-0.5">Your portfolio overview</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 bg-[#1A3D2B]/10 text-[#1A3D2B] rounded">
              Full Management
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Properties', value: '2', icon: <Building2 size={16} className="text-[#4a6fa5]" />, bg: 'bg-[#4a6fa5]/10' },
              { label: 'Monthly Rent Roll', value: fmt(3825), icon: <PoundSterling size={16} className="text-green-600" />, bg: 'bg-green-100' },
              { label: 'Vacant', value: '0', icon: <CheckCircle size={16} className="text-green-600" />, bg: 'bg-green-100' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 ${s.bg} rounded flex items-center justify-center`}>{s.icon}</div>
                  <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'var(--font-syne)' }}>{s.label}</p>
                </div>
                <p className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Maintenance awaiting approval */}
          {MAINTENANCE.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="font-semibold text-[#1a1a1a] text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                  Maintenance Awaiting Your Approval
                </h2>
              </div>
              {MAINTENANCE.map(job => (
                <div key={job.title} className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{job.title}</p>
                    <p className="text-sm text-[#8a7968]">{job.address}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-1">Quote: {fmt(job.quote)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[#1A3D2B] text-white text-sm font-semibold rounded hover:bg-[#122B1E] transition">
                      Approve
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Properties */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>Your Properties</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {PROPERTIES.map(p => (
                <div key={p.address} className="px-5 py-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>{p.address}</p>
                    <p className="text-xs text-[#8a7968]">{p.area}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#8a7968]">
                      <span>Tenant: <span className="text-[#1a1a1a] font-medium">{p.tenant}</span></span>
                      <span>Rent: <span className="text-[#1a1a1a] font-medium">{fmt(p.rent)}/mo</span></span>
                      <span>Ends: <span className={`font-medium ${p.daysLeft < 120 ? 'text-amber-600' : 'text-green-600'}`}>{p.endDate}</span></span>
                    </div>
                  </div>
                  {p.jobs > 0 ? (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {p.jobs} open job
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle size={11} /> All clear
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent statements */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-syne)' }}>Recent Statements</h2>
              <TrendingUp size={15} className="text-[#8a7968]" />
            </div>
            <div className="divide-y divide-gray-100">
              {STATEMENTS.map(s => (
                <div key={s.period} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{s.period}</p>
                    <p className="text-xs text-[#8a7968]">Gross {fmt(s.gross)} · Fees {fmt(s.fees)}{s.maintenance ? ` · Maint. ${fmt(s.maintenance)}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8a7968]">Net payout</p>
                    <p className="font-semibold text-[#1a1a1a]">{fmt(s.net)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sign in CTA */}
          <div className="bg-[#1A3D2B] rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>Ready to manage your portfolio?</p>
              <p className="text-sm text-white/60 mt-0.5">Sign in to access your real statements, properties, and maintenance dashboard.</p>
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
