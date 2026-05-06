'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

export default function AccountClient({
  user,
}: {
  user: { id: string; name: string; email: string }
}) {
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPwd !== confirmPwd) { setError('Passwords do not match'); return }
    if (newPwd.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update password')
      setSuccess(true)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      {/* Read-only info */}
      <div className="space-y-3 pb-5 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Name</p>
          <p className="text-sm font-medium text-[#1a1a1a]">{user.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
          <p className="text-sm font-medium text-[#1a1a1a]">{user.email}</p>
        </div>
      </div>

      {/* Password change */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">Change Password</h2>

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CheckCircle size={16} className="text-green-600" />
            Password updated successfully
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Current password</label>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">New password</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm new password</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
