import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Key, Building2, Bell, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const [userCount, propertyCount] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
  ])

  const sections = [
    {
      href: '/dashboard/settings/users',
      icon: Users,
      title: 'User Management',
      description: 'View, deactivate, or change roles for all system users',
      meta: `${userCount} users`,
    },
    {
      href: '/dashboard/properties',
      icon: Building2,
      title: 'Properties',
      description: 'Manage your property portfolio',
      meta: `${propertyCount} properties`,
    },
    {
      href: '/dashboard/settings/account',
      icon: Key,
      title: 'My Account',
      description: 'Update your name, email, or password',
      meta: null,
    },
    {
      href: '/dashboard/notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'View and manage system notifications',
      meta: null,
    },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">System configuration and account management</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#f5f2ee]/60 transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1A3D2B]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#1A3D2B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a]">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </div>
              {s.meta && (
                <span className="text-xs text-gray-400 font-medium hidden sm:block">{s.meta}</span>
              )}
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#1A3D2B] transition flex-shrink-0" />
            </Link>
          )
        })}
      </div>

      {/* System info */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3">System Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Platform</dt>
            <dd className="font-medium text-[#1a1a1a]">Central Gate Estates v1.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Environment</dt>
            <dd className="font-medium text-[#1a1a1a]">{process.env.NODE_ENV}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Logged in as</dt>
            <dd className="font-medium text-[#1a1a1a]">{session.user.email} ({session.user.role})</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
