'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Home, Wrench, FileText, CreditCard, User, LogOut, Menu, X, ClipboardCheck,
} from 'lucide-react'

interface Props {
  user: { name: string; email: string }
  openMaintenanceCount: number
  children: React.ReactNode
}

const navItems = [
  { label: 'Overview', href: '/portal/tenant', icon: Home, exact: true },
  { label: 'Referencing', href: '/portal/tenant/referencing', icon: ClipboardCheck },
  { label: 'Maintenance', href: '/portal/tenant/maintenance', icon: Wrench },
  { label: 'Documents', href: '/portal/tenant/documents', icon: FileText },
  { label: 'Payments', href: '/portal/tenant/payments', icon: CreditCard },
  { label: 'Profile', href: '/portal/tenant/profile', icon: User },
]

export default function TenantPortalShell({ user, openMaintenanceCount, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const firstName = user.name.split(' ')[0] || 'Tenant'

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
        <Link href="/portal/tenant" className="flex items-center gap-2 flex-1">
          <span className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
            CGE
          </span>
          <span className="text-[#1A3D2B] font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
            Tenant Portal
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
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-14 bottom-0 left-0 z-50 w-[200px] bg-[#1a1a1a] flex flex-col transform transition-transform duration-200 lg:relative lg:top-0 lg:translate-x-0 lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 ${
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
              const isMaintenance = item.href === '/portal/tenant/maintenance'
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded text-sm transition ${
                    active
                      ? 'bg-[#1A3D2B] text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} className="flex-shrink-0" />
                    {item.label}
                  </span>
                  {isMaintenance && openMaintenanceCount > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-[#1A3D2B] text-white'}`}>
                      {openMaintenanceCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 min-w-0 max-w-5xl">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-white/10 flex lg:hidden z-30">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          const isMaintenance = item.href === '/portal/tenant/maintenance'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition relative ${
                active ? 'text-[#1A3D2B]' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
              {isMaintenance && openMaintenanceCount > 0 && (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-[#1A3D2B] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {openMaintenanceCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
