'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { clsx } from 'clsx'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react'

// ─── Nav links ────────────────────────────────────────────────────────────────

const navLinks = [
  { label: 'Properties', href: '/properties' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Landlords', href: '/landlords' },
  { label: 'Tenants', href: '/tenants' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-200"
        style={{
          height: '72px',
          background: scrolled || mobileOpen ? '#fff' : 'rgba(26,26,26,0.92)',
          backdropFilter: scrolled || mobileOpen ? 'none' : 'blur(8px)',
          borderBottom: scrolled || mobileOpen ? '1px solid #ebebeb' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex flex-col leading-none mr-8">
            <span
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 700,
                fontSize: '17px',
                letterSpacing: '-0.02em',
                color: scrolled || mobileOpen ? '#111' : '#f5f2ee',
                borderBottom: '2px solid #1A3D2B',
                paddingBottom: '1px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
            >
              CGE
            </span>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 400,
                fontSize: '9px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: scrolled || mobileOpen ? 'rgba(17,17,17,0.45)' : 'rgba(245,242,238,0.45)',
                marginTop: '3px',
                transition: 'color 0.2s',
              }}
            >
              Central Gate Estates
            </span>
          </Link>

          {/* Nav — centred (hidden on mobile) */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-0">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.07em] transition-colors duration-150 group"
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    color: scrolled
                      ? active ? '#1A3D2B' : '#444'
                      : active ? '#1A3D2B' : 'rgba(245,242,238,0.75)',
                  }}
                >
                  {link.label}
                  <span
                    className={clsx(
                      'absolute bottom-0 left-4 right-4 h-[2px] bg-[#1A3D2B] transition-transform duration-150 origin-left',
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Right — CTA / auth */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-8">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.07em] transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    color: scrolled ? '#444' : 'rgba(245,242,238,0.75)',
                  }}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* Avatar */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: '#1A3D2B', borderRadius: '6px', fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {initials}
                    </div>
                    <ChevronDown
                      className={clsx(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        scrolled ? 'text-[#444]' : 'text-[rgba(245,242,238,0.6)]',
                        userMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#ebebeb] py-1 z-50"
                      style={{ borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    >
                      <div className="px-4 py-3 border-b border-[#ebebeb]">
                        <p className="text-sm font-semibold text-[#111] truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {session.user.name ?? session.user.email}
                        </p>
                        <p className="text-xs text-[#888] capitalize mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {session.user.role?.toLowerCase()}
                        </p>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444] hover:bg-[#fafafa] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#1A3D2B] hover:bg-[#fafafa] transition-colors"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/properties?contact=viewing"
                className="font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: '#1A3D2B',
                  borderRadius: '6px',
                  padding: '9px 20px',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                }}
                data-cursor="hover-cta"
              >
                Book Viewing
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="ml-auto md:hidden">
            <button
              className="p-2 transition-colors"
              style={{ color: scrolled || mobileOpen ? '#111' : '#f5f2ee' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={clsx(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white',
            mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          )}
          style={{ borderBottom: mobileOpen ? '1px solid #ebebeb' : 'none' }}
        >
          <div className="max-w-[1200px] mx-auto px-6 py-4 space-y-0.5">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-3 text-sm font-medium uppercase tracking-[0.07em] border-b border-[#f0f0f0] transition-colors"
                  style={{ fontFamily: 'var(--font-dm-sans)', color: active ? '#1A3D2B' : '#444' }}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-4 space-y-3">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-medium text-[#444] uppercase tracking-[0.07em]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 text-sm font-medium text-[#1A3D2B] uppercase tracking-[0.07em]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/properties?contact=viewing"
                  className="block text-center font-semibold text-white py-3 transition-opacity hover:opacity-90"
                  style={{ background: '#1A3D2B', borderRadius: '6px', fontFamily: 'var(--font-dm-sans)', fontSize: '14px' }}
                >
                  Book Viewing
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for non-hero pages */}
      <div className="h-[72px]" aria-hidden="true" />
    </>
  )
}
