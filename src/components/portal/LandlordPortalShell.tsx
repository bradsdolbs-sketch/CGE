'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Home, Building2, FileText, Wrench, FolderOpen, User, LogOut, Menu, X, ClipboardCheck, PenLine,
  PoundSterling, ShieldCheck, Calendar, BarChart2, Eye, MessageSquare, MoreHorizontal,
} from 'lucide-react'

interface Props {
  user: { name: string; email: string }
  children: React.ReactNode
}

const navItems = [
  { label: 'Overview',      href: '/portal/landlord',              icon: Home,          exact: true },
  { label: 'My Properties', href: '/portal/landlord/properties',   icon: Building2 },
  { label: 'Rent',          href: '/portal/landlord/rent',         icon: PoundSterling },
  { label: 'Compliance',    href: '/portal/landlord/compliance',   icon: ShieldCheck },
  { label: 'Inspections',   href: '/portal/landlord/inspections',  icon: Calendar },
  { label: 'Financials',    href: '/portal/landlord/financials',   icon: BarChart2 },
  { label: 'Viewings',      href: '/portal/landlord/viewings',     icon: Eye },
  { label: 'Maintenance',   href: '/portal/landlord/maintenance',  icon: Wrench },
  { label: 'Statements',    href: '/portal/landlord/statements',   icon: FileText },
  { label: 'Documents',     href: '/portal/landlord/documents',    icon: FolderOpen },
  { label: 'References',    href: '/portal/landlord/referencing',  icon: ClipboardCheck },
  { label: 'Agreements',    href: '/portal/landlord/agreement',    icon: PenLine },
  { label: 'Contact',       href: '/portal/landlord/contact',      icon: MessageSquare },
  { label: 'Profile',       href: '/portal/landlord/profile',      icon: User },
]

// 4 key items shown in mobile bottom bar — rest accessible via sidebar "More"
const mobileBottomItems = [
  { label: 'Overview',    href: '/portal/landlord',             icon: Home,          exact: true },
  { label: 'Properties',  href: '/portal/landlord/properties',  icon: Building2 },
  { label: 'Rent',        href: '/portal/landlord/rent',        icon: PoundSterling },
  { label: 'Maintenance', href: '/portal/landlord/maintenance', icon: Wrench },
]

export default function LandlordPortalShell({ user, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const firstName = user.name.split(' ')[0] || 'Landlord'

  return (
    <div className="min-h-screen bg-[#f5f2ee]">
      {/* Top bar */}
      <header className="bg-[#1a1a1a] text-white h-14 flex items-center px-4 gap-4 sticky top-0 z-40">
        <button
          className="lg:hidden text-white/60 hover:text-white"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
        <Link href="/portal/landlord" className="flex items-center gap-2 flex-1">
          <span className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>CGE</span>
          <span className="text-[#1A3D2B] font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
            Landlord Portal
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70 hidden sm:block">{firstName}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-14 bottom-0 left-0 z-50 w-[200px] bg-[#1a1a1a] flex flex-col transform transition-transform duration-200 lg:relative lg:top-0 lg:translate-x-0 lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 overflow-y-auto ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            className="absolute top-3 right-3 text-white/40 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition ${
                    active
                      ? 'bg-[#1A3D2B] text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 min-w-0 max-w-5xl pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — 4 key items + More */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-white/10 flex lg:hidden z-30">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition ${
                active ? 'text-[#1A3D2B]' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-[10px] text-white/50 hover:text-white transition"
        >
          <MoreHorizontal size={18} />
          More
        </button>
      </nav>
    </div>
  )
}
