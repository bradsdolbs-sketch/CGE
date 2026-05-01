'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Building2, ListChecks, ShieldCheck,
  Users, UserCog, UserSearch, FileText, RotateCcw,
  Banknote, Receipt, DollarSign,
  Wrench, ClipboardList, HardHat,
  Mail, Bell, Menu, X, ChevronDown, LogOut, Settings, ClipboardCheck,
} from 'lucide-react'

// ── Page title context ────────────────────────────────────────────────────────
interface TitleContextValue { title: string; setTitle: (t: string) => void }
const TitleContext = createContext<TitleContextValue>({ title: 'Dashboard', setTitle: () => {} })
export function usePageTitle() { return useContext(TitleContext) }

// ── Nav items ─────────────────────────────────────────────────────────────────
const navSections = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Properties',
    items: [
      { label: 'Properties', href: '/dashboard/properties', icon: Building2 },
      { label: 'Listings', href: '/dashboard/listings', icon: ListChecks },
      { label: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Tenants', href: '/dashboard/tenants', icon: Users },
      { label: 'Landlords', href: '/dashboard/landlords', icon: UserCog },
      { label: 'Applicants', href: '/dashboard/applicants', icon: UserSearch },
    ],
  },
  {
    label: 'Tenancies',
    items: [
      { label: 'Active Tenancies', href: '/dashboard/tenancies', icon: FileText },
      { label: 'Renewals', href: '/dashboard/tenancies?filter=renewals', icon: RotateCcw },
      { label: 'Referencing', href: '/dashboard/referencing', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Rent', href: '/dashboard/finance/rent', icon: Banknote },
      { label: 'Statements', href: '/dashboard/finance/statements', icon: Receipt },
      { label: 'Fees', href: '/dashboard/finance/fees', icon: DollarSign },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench },
      { label: 'Inspections', href: '/dashboard/inspections', icon: ClipboardList },
      { label: 'Contractors', href: '/dashboard/contractors', icon: HardHat },
    ],
  },
  {
    label: 'Communications',
    items: [
      { label: 'Emails', href: '/dashboard/emails', icon: Mail },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShellUser { name: string; email: string; role: string }

interface Props {
  user: ShellUser
  children: React.ReactNode
  unreadNotifications?: number
}

export default function DashboardShell({ user, children, unreadNotifications = 0 }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [title, setTitle] = useState('Dashboard')
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href.split('?')[0])
  }

  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      <div className="flex h-screen bg-[#f5f2ee] overflow-hidden">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-60 bg-[#1a1a1a] flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
            <Link href="/dashboard" className="block">
              <span className="text-white font-bold text-base leading-tight">Central Gate</span>
              <span className="block text-[#1A3D2B] font-bold text-base leading-tight">Estates</span>
              <span className="block w-8 h-0.5 bg-[#1A3D2B] mt-2" />
            </Link>
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                            active
                              ? 'bg-[#1A3D2B] text-white font-medium'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon size={15} className="flex-shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Agent footer */}
          <div className="border-t border-white/10 p-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#1A3D2B] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{user.name}</p>
                <p className="text-white/40 text-[10px] truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-white/50 hover:text-white text-xs transition"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
            <button
              className="text-gray-500 hover:text-[#1a1a1a] lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <h1 className="font-semibold text-[#1a1a1a] text-base flex-1 truncate">{title}</h1>

            {/* Search */}
            <div className="hidden md:flex items-center">
              <input
                type="search"
                placeholder="Search…"
                className="w-56 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent"
              />
            </div>

            {/* Notification bell */}
            <Link href="/dashboard/notifications" className="relative text-gray-500 hover:text-[#1a1a1a] transition">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-[#1A3D2B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TitleContext.Provider>
  )
}
