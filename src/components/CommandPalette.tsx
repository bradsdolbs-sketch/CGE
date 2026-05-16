'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Users, UserCog, ArrowRight, X, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Result {
  id: string
  label: string
  sublabel: string
  href: string
  type: 'property' | 'tenant' | 'landlord'
  status?: string
}

interface SearchResults {
  properties: Result[]
  tenants: Result[]
  landlords: Result[]
}

// ── Quick actions (always visible when no query) ──────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Add new property',    href: '/dashboard/properties/new',  icon: Building2 },
  { label: 'View all tenants',    href: '/dashboard/tenants',         icon: Users },
  { label: 'Rent management',     href: '/dashboard/finance/rent',    icon: Zap },
]

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, string> = {
  AVAILABLE:   'bg-green-100 text-green-700',
  LET:         'bg-blue-100 text-blue-700',
  LET_AGREED:  'bg-blue-100 text-blue-700',
  UNDER_OFFER: 'bg-amber-100 text-amber-700',
  MAINTENANCE: 'bg-red-100 text-red-700',
}

// ── Flat list helper ──────────────────────────────────────────────────────────

function flatResults(results: SearchResults | null): Result[] {
  if (!results) return []
  return [
    ...results.properties,
    ...results.tenants,
    ...results.landlords,
  ]
}

// ── Command Palette ───────────────────────────────────────────────────────────

export default function CommandPalette() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const flat = flatResults(results)
  const total = query.trim().length >= 2 ? flat.length : QUICK_ACTIONS.length

  // ── Open/close ─────────────────────────────────────────────────────────────

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults(null)
    setActiveIdx(0)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  // ── Search ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults(null); setActiveIdx(0); return }

    const ctrl = new AbortController()
    setLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { setResults(data.results); setActiveIdx(0) })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [query])

  // ── Keyboard nav ───────────────────────────────────────────────────────────

  const navigate = useCallback((href: string) => {
    close()
    router.push(href)
  }, [close, router])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim().length >= 2) {
        if (flat[activeIdx]) navigate(flat[activeIdx].href)
      } else {
        const action = QUICK_ACTIONS[activeIdx]
        if (action) navigate(action.href)
      }
    }
  }

  // ── Scroll active item into view ───────────────────────────────────────────

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 text-xs transition-all"
        title="Command palette (⌘K)"
      >
        <Search size={13} />
        <span className="text-gray-500">Search…</span>
        <span className="ml-1 flex items-center gap-0.5">
          <kbd className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 font-mono text-gray-400">⌘</kbd>
          <kbd className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 font-mono text-gray-400">K</kbd>
        </span>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="cmd-backdrop fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="cmd-panel fixed top-[12vh] left-1/2 -translate-x-1/2 z-[101] w-full max-w-xl px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">

          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <Search size={17} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search properties, tenants, landlords…"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <button onClick={close} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">

            {/* No query → Quick actions */}
            {query.trim().length < 2 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Quick actions
                </p>
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon
                  const active = activeIdx === i
                  return (
                    <button
                      key={action.href}
                      data-idx={i}
                      onClick={() => navigate(action.href)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active ? 'bg-[#1A3D2B]/8 text-[#1A3D2B]' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-[#1A3D2B] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                      <ArrowRight size={13} className="ml-auto opacity-40" />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Search results */}
            {query.trim().length >= 2 && results && (
              <>
                {results.properties.length === 0 && results.tenants.length === 0 && results.landlords.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No results for <span className="font-medium text-gray-600">"{query}"</span>
                  </div>
                ) : (
                  (() => {
                    let globalIdx = 0
                    return (
                      <>
                        {results.properties.length > 0 && (
                          <Section label="Properties">
                            {results.properties.map(r => {
                              const idx = globalIdx++
                              return (
                                <ResultRow
                                  key={r.id} result={r} idx={idx}
                                  active={activeIdx === idx}
                                  icon={<Building2 size={14} />}
                                  onHover={() => setActiveIdx(idx)}
                                  onClick={() => navigate(r.href)}
                                />
                              )
                            })}
                          </Section>
                        )}
                        {results.tenants.length > 0 && (
                          <Section label="Tenants">
                            {results.tenants.map(r => {
                              const idx = globalIdx++
                              return (
                                <ResultRow
                                  key={r.id} result={r} idx={idx}
                                  active={activeIdx === idx}
                                  icon={<Users size={14} />}
                                  onHover={() => setActiveIdx(idx)}
                                  onClick={() => navigate(r.href)}
                                />
                              )
                            })}
                          </Section>
                        )}
                        {results.landlords.length > 0 && (
                          <Section label="Landlords">
                            {results.landlords.map(r => {
                              const idx = globalIdx++
                              return (
                                <ResultRow
                                  key={r.id} result={r} idx={idx}
                                  active={activeIdx === idx}
                                  icon={<UserCog size={14} />}
                                  onHover={() => setActiveIdx(idx)}
                                  onClick={() => navigate(r.href)}
                                />
                              )
                            })}
                          </Section>
                        )}
                      </>
                    )
                  })()
                )}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400">
            <span><kbd className="font-mono bg-gray-100 rounded px-1">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-gray-100 rounded px-1">↵</kbd> open</span>
            <span><kbd className="font-mono bg-gray-100 rounded px-1">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultRow({
  result, idx, active, icon, onHover, onClick,
}: {
  result: Result
  idx: number
  active: boolean
  icon: React.ReactNode
  onHover: () => void
  onClick: () => void
}) {
  return (
    <button
      data-idx={idx}
      onClick={onClick}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        active ? 'bg-[#1A3D2B]/8' : 'hover:bg-gray-50'
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        active ? 'bg-[#1A3D2B] text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${active ? 'text-[#1A3D2B]' : 'text-gray-800'}`}>
          {result.label}
        </p>
        <p className="text-xs text-gray-400 truncate">{result.sublabel}</p>
      </div>
      {result.status && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
          STATUS_COLOURS[result.status] ?? 'bg-gray-100 text-gray-500'
        }`}>
          {result.status.replace(/_/g, ' ')}
        </span>
      )}
    </button>
  )
}
