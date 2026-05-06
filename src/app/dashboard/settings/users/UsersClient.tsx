'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, ShieldCheck, UserX, RotateCcw, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: Date
  landlordRecord: { id: string } | null
  tenantRecord: { id: string } | null
}

const ROLE_COLOURS: Record<string, string> = {
  ADMIN:    'bg-purple-100 text-purple-700',
  AGENT:    'bg-blue-100 text-blue-700',
  LANDLORD: 'bg-amber-100 text-amber-700',
  TENANT:   'bg-green-100 text-green-700',
}

export default function UsersClient({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  async function sendReset(userId: string, email: string | null) {
    if (!email) return
    setError(null)
    setLoading(`reset-${userId}`)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to send reset email')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(null)
    }
  }

  async function changeRole(userId: string, newRole: string) {
    setError(null)
    setLoading(`role-${userId}`)
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update role')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(null)
    }
  }

  function profileLink(u: User) {
    if (u.role === 'LANDLORD' && u.landlordRecord) return `/dashboard/landlords/${u.landlordRecord.id}`
    if (u.role === 'TENANT' && u.tenantRecord) return `/dashboard/tenants/${u.tenantRecord.id}`
    return null
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="AGENT">Agent</option>
          <option value="LANDLORD">Landlord</option>
          <option value="TENANT">Tenant</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const link = profileLink(u)
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id} className="hover:bg-[#f5f2ee]/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A3D2B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name ? u.name[0].toUpperCase() : u.email?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-[#1a1a1a] truncate">{u.name ?? '—'}</p>
                            {isSelf && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">you</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${ROLE_COLOURS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {format(new Date(u.createdAt), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {link && (
                          <Link
                            href={link}
                            className="p-1.5 text-gray-400 hover:text-[#1A3D2B] transition"
                            title="View profile"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                        <button
                          onClick={() => sendReset(u.id, u.email)}
                          disabled={loading === `reset-${u.id}` || !u.email}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition disabled:opacity-40"
                          title="Send password reset email"
                        >
                          {loading === `reset-${u.id}` ? (
                            <RotateCcw size={14} className="animate-spin" />
                          ) : (
                            <Mail size={14} />
                          )}
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => {
                              const newRole = prompt(
                                `Change role for ${u.name ?? u.email}?\nCurrent: ${u.role}\nEnter new role: ADMIN, AGENT, LANDLORD, TENANT`
                              )
                              if (newRole && ['ADMIN', 'AGENT', 'LANDLORD', 'TENANT'].includes(newRole.toUpperCase())) {
                                changeRole(u.id, newRole.toUpperCase())
                              }
                            }}
                            disabled={!!loading}
                            className="p-1.5 text-gray-400 hover:text-amber-600 transition disabled:opacity-40"
                            title="Change role"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      <p className="text-xs text-gray-400">
        <strong>Mail icon</strong> — sends a password reset link to the user's email. &nbsp;
        <strong>Shield icon</strong> — changes the user's role.
      </p>
    </div>
  )
}
