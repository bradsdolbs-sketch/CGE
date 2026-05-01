'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'

interface TenantProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  whatsapp: string
  employer: string
  jobTitle: string
  annualSalary: number | null
  email: string
  whatsappOptIn: boolean
}

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/tenants/me')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setPhone(data.phone ?? '')
        setWhatsapp(data.whatsapp ?? '')
        setWhatsappOptIn(data.whatsappOptIn ?? false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)

    try {
      const res = await fetch('/api/tenants/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, whatsapp, whatsappOptIn }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save profile')
      }
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 4000)
    } catch (err: any) {
      setProfileError(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }

    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to change password')
      }
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err: any) {
      setPwError(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8 pb-20 lg:pb-0">
      <div>
        <h1
          className="text-3xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Profile
        </h1>
        <p className="text-[#8a7968] text-sm mt-0.5">Manage your personal details and preferences</p>
      </div>

      {/* Personal details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Personal Details
          </h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm bg-gray-50 text-[#8a7968] cursor-not-allowed"
            />
            <p className="text-xs text-[#8a7968] mt-1">Contact your agent to change your email address.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 900000"
                className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+44 7700 900000"
                className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                className="w-4 h-4 accent-[#1A3D2B]"
              />
              <span className="text-sm text-[#1a1a1a]">
                Receive updates via WhatsApp (maintenance updates, reminders)
              </span>
            </label>
          </div>

          {profileError && (
            <p className="text-red-600 text-sm">{profileError}</p>
          )}
          {profileSuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle size={16} />
              Profile saved successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="bg-[#1A3D2B] text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#122B1E] transition rounded disabled:opacity-50"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Employment (read-only) */}
      {(profile?.employer || profile?.jobTitle) && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Employment
            </h2>
            <p className="text-xs text-[#8a7968] mt-0.5">Contact your agent to update employment details.</p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>Employer</p>
              <p className="text-sm font-medium text-[#1a1a1a] mt-1">{profile.employer ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>Job Title</p>
              <p className="text-sm font-medium text-[#1a1a1a] mt-1">{profile.jobTitle ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>Annual Salary</p>
              <p className="text-sm font-medium text-[#1a1a1a] mt-1">
                {profile.annualSalary
                  ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(profile.annualSalary)
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Change Password
          </h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7968]"
              >
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7968]"
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-[#8a7968] mt-1">Minimum 8 characters.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#1a1a1a] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]"
            />
          </div>

          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle size={16} />
              Password changed successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="bg-[#1a1a1a] text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#333] transition rounded disabled:opacity-50"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {pwSaving ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
