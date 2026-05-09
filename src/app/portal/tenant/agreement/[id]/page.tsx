'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, FileText, PenLine } from 'lucide-react'

type AgreementView = {
  id: string
  status: string
  draftUrl: string
  tenantSignedAt: string | null
  propertyAddress: string
  proposedRent: number
  startDate: string
  tenancyTerm: number
  depositAmount: number
  depositScheme: string
  landlordName: string
}

function TenantSigningContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const id = params.id as string

  const [data, setData] = useState<AgreementView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [signedName, setSignedName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    fetch(`/api/agreements/${id}/tenant-view?token=${token ?? ''}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load agreement'))
      .finally(() => setLoading(false))
  }, [id, token])

  async function handleSign() {
    if (!agreed || !signedName.trim()) return
    setSubmitting(true); setError(null)
    try {
      const res = await fetch(`/api/agreements/${id}/sign-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedName: signedName.trim(), token }),
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error ?? 'Failed to sign')
      setSigned(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A3D2B]" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <p className="text-red-600 font-medium mb-2">Unable to load agreement</p>
        <p className="text-sm text-[#8a7968]">{error}</p>
        <p className="text-sm text-[#8a7968] mt-2">This link may have expired. Please contact Central Gate Estates.</p>
      </div>
    )
  }

  if (data?.tenantSignedAt && !signed) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <p className="text-[#1a1a1a] font-semibold text-lg">You have already signed this agreement</p>
        <p className="text-sm text-[#8a7968] mt-2">
          Your signature was recorded on {new Date(data.tenantSignedAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}.
        </p>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Agreement Signed</h2>
        <p className="text-[#8a7968]">
          Thank you. Your signature has been recorded. The landlord has been notified and will be asked to countersign.
          You will receive a copy of the fully signed agreement once both parties have signed.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Sign Your Tenancy Agreement</h1>
        <p className="text-sm text-[#8a7968] mt-1">
          {data?.propertyAddress ?? 'Please read the full agreement before signing.'}
        </p>
      </div>

      {/* Key terms */}
      {data && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#1a1a1a] mb-3">Key Terms</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Monthly Rent</p>
              <p className="font-semibold">£{data.proposedRent.toLocaleString()} pcm</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Deposit</p>
              <p className="font-semibold">£{data.depositAmount.toLocaleString()} ({data.depositScheme})</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Start Date</p>
              <p className="font-semibold">
                {new Date(data.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Term</p>
              <p className="font-semibold">{data.tenancyTerm} months</p>
            </div>
          </div>
          {data.draftUrl && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={data.draftUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-[#1A3D2B] hover:text-[#122B1E] transition"
              >
                <FileText className="w-4 h-4" /> Read Full Agreement (PDF)
              </a>
            </div>
          )}
        </div>
      )}

      {/* Signing form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-[#1a1a1a]">Sign the Agreement</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#1A3D2B] flex-shrink-0"
          />
          <span className="text-sm text-[#404040]">
            I confirm that I have read and understood the full Assured Shorthold Tenancy Agreement, and I agree to be bound by its terms and conditions.
          </span>
        </label>

        <div>
          <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wider mb-1.5">
            Type your full legal name to sign
          </label>
          <div className="relative">
            <PenLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={signedName}
              onChange={e => setSignedName(e.target.value)}
              placeholder="Full legal name"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
            />
          </div>
          <p className="text-xs text-[#8a7968] mt-1">
            This acts as your electronic signature under the Electronic Communications Act 2000.
          </p>
        </div>

        <button
          onClick={handleSign}
          disabled={!agreed || !signedName.trim() || submitting}
          className="w-full py-3 text-sm font-semibold rounded-lg text-white transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: '#1A3D2B' }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          {submitting ? 'Signing…' : 'Sign Agreement'}
        </button>

        <p className="text-xs text-[#8a7968] text-center">
          By signing, your name, timestamp, and IP address will be recorded as your electronic signature.
        </p>
      </div>
    </div>
  )
}

export default function TenantAgreementPage() {
  return (
    <Suspense>
      <TenantSigningContent />
    </Suspense>
  )
}
