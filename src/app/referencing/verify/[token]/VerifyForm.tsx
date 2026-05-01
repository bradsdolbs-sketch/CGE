'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function VerifyForm({
  token,
  role,
  applicationId,
}: {
  token: string
  role: 'employer' | 'landlord'
  applicationId: string
}) {
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Employer state
  const [confirms, setConfirms] = useState<boolean | null>(null)
  const [actualSalary, setActualSalary] = useState('')
  const [notes, setNotes] = useState('')

  // Landlord state
  const [rating, setRating] = useState('')
  const [arrears, setArrears] = useState<boolean | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (confirms === null) { setError('Please select an option'); return }
    setError(null)
    setSubmitting(true)

    const body = role === 'employer'
      ? { confirms, actualSalary: actualSalary || null, notes }
      : { confirms, rating, arrears: arrears ?? false, notes }

    try {
      const res = await fetch(`/api/referencing/verify/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Submission failed')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'
  const radioCls = (active: boolean) =>
    `flex-1 px-4 py-3 border-2 rounded-lg text-sm font-medium text-center cursor-pointer transition ${
      active ? 'border-[#1A3D2B] bg-[#F0EBE0] text-[#1A3D2B]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
    }`

  if (done) {
    return (
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-8 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Thank you</h2>
        <p className="text-gray-500">
          Your {role === 'employer' ? 'employment verification' : 'tenancy reference'} has been submitted successfully.
          Central Gate Estates will review and process this shortly.
        </p>
        <p className="text-sm text-gray-400 mt-4">You may close this window.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">
          {role === 'employer' ? 'Employment Verification' : 'Tenancy Reference'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'employer'
            ? 'Please confirm the employment details we have on file for this applicant.'
            : 'Please provide a reference for this former tenant.'}
        </p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      {/* Confirms employment / tenancy */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">
          {role === 'employer'
            ? 'Do you confirm this person is / was employed by your organisation?'
            : 'Do you confirm this person was a tenant at your property?'}
        </label>
        <div className="flex gap-3">
          <button type="button" className={radioCls(confirms === true)} onClick={() => setConfirms(true)}>Yes, I confirm</button>
          <button type="button" className={radioCls(confirms === false)} onClick={() => setConfirms(false)}>No, I cannot confirm</button>
        </div>
      </div>

      {confirms && role === 'employer' && (
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">
            Actual annual salary (if different from what was declared)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
            <input
              type="number"
              value={actualSalary}
              onChange={(e) => setActualSalary(e.target.value)}
              placeholder="Leave blank if the declared amount is correct"
              className={`${inputCls} pl-7`}
            />
          </div>
        </div>
      )}

      {confirms && role === 'landlord' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">Overall rating as a tenant</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'EXCELLENT', label: '⭐ Excellent', desc: 'Always paid on time, looked after the property' },
                { value: 'GOOD', label: '👍 Good', desc: 'Generally reliable, minor issues only' },
                { value: 'CONCERNS', label: '⚠️ Some Concerns', desc: 'Some issues worth discussing' },
                { value: 'POOR', label: '❌ Poor', desc: 'Significant problems, would not recommend' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRating(opt.value)}
                  className={`text-left px-4 py-3 border-2 rounded-lg transition ${
                    rating === opt.value ? 'border-[#1A3D2B] bg-[#F0EBE0]' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#1a1a1a]">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">
              Were there any rent arrears during the tenancy?
            </label>
            <div className="flex gap-3">
              <button type="button" className={radioCls(arrears === false)} onClick={() => setArrears(false)}>No arrears</button>
              <button type="button" className={radioCls(arrears === true)} onClick={() => setArrears(true)}>Yes, there were arrears</button>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">
          Additional comments <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Any additional context you'd like to share…"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || confirms === null}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold rounded-lg transition disabled:opacity-50"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitting ? 'Submitting…' : 'Submit Response'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Central Gate Estates Ltd · Regulated Letting Agent · <a href="mailto:hello@centralgateestates.com" className="text-[#1A3D2B]">hello@centralgateestates.com</a>
      </p>
    </form>
  )
}
