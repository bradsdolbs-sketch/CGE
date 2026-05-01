'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, User } from 'lucide-react'
import { format } from 'date-fns'

interface ProfileUser {
  id: string
  name: string | null
  email: string
  role: string
  phone: string | null
  createdAt: Date
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'
const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

export default function ProfileClient({ user }: { user: ProfileUser }) {
  // Profile fields
  const [name, setName] = useState(user.name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password fields
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdError, setPwdError] = useState<string | null>(null)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setSavingProfile(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update profile')
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError(null)
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match'); return }
    if (newPwd.length < 8) { setPwdError('Password must be at least 8 characters'); return }
    setSavingPwd(true)
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update password')
      setPwdSuccess(true)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setTimeout(() => setPwdSuccess(false), 3000)
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSavingPwd(false)
    }
  }

  const initials = (user.name ?? user.email)
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account details and password</p>
      </div>

      {/* Avatar + meta */}
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-5">
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0"
          style={{ background: '#1A3D2B' }}
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[#1a1a1a]">{user.name ?? '—'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0EBE0] text-[#1A3D2B] font-medium capitalize">
              {user.role.toLowerCase()}
            </span>
            <span className="text-xs text-gray-400">
              Since {format(new Date(user.createdAt), 'MMM yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-[#1a1a1a] mb-4">Account Details</h2>

        {profileSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <CheckCircle size={16} /> Profile updated
          </div>
        )}
        {profileError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{profileError}</p>
        )}

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className={labelCls}>Full name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className={labelCls}>Email address</label>
            <input className={`${inputCls} bg-gray-50 text-gray-400`} value={user.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact an admin if needed.</p>
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-[#1a1a1a] mb-4">Change Password</h2>

        {pwdSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <CheckCircle size={16} /> Password updated successfully
          </div>
        )}
        {pwdError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{pwdError}</p>
        )}

        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className={labelCls}>Current password</label>
            <input type="password" className={inputCls} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" className={inputCls} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" className={inputCls} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            {savingPwd && <Loader2 size={14} className="animate-spin" />}
            {savingPwd ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
