'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, MessageSquare, Loader2, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type AppData = {
  id: string
  status: string
  affordabilityScore: number | null
  affordabilityPass: boolean | null
  landlordApprovalStatus: string | null
  reportUrl: string | null
  tenant: { firstName: string; lastName: string; user: { email: string } }
  enquiry: {
    property: { addressLine1: string; area: string; postcode: string } | null
    offer: {
      proposedRent: number
      startDate: string
      tenancyTerm: number
      depositAmount: number
      depositScheme: string
    } | null
  } | null
}

function LandlordDecisionContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const tokenFromUrl = searchParams.get('token')
  const decisionFromUrl = searchParams.get('decision')

  const [app, setApp] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(tokenFromUrl ?? '')
  const [decision, setDecision] = useState<'APPROVED' | 'DECLINED' | 'MODIFICATION_REQUESTED' | null>(
    decisionFromUrl as 'APPROVED' | 'DECLINED' | null ?? null
  )
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch application data via a public-ish endpoint using the token
    fetch(`/api/referencing/${id}/landlord-view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setApp(data)
      })
      .catch(() => setError('Failed to load application'))
      .finally(() => setLoading(false))
  }, [id, token])

  // Auto-submit if decision came from email link
  useEffect(() => {
    if (decisionFromUrl === 'APPROVED' && app && !submitted) {
      setDecision('APPROVED')
    } else if (decisionFromUrl === 'DECLINED' && app && !submitted) {
      setDecision('DECLINED')
    }
  }, [decisionFromUrl, app, submitted])

  async function handleSubmit() {
    if (!decision) return
    if (decision === 'MODIFICATION_REQUESTED' && !note.trim()) {
      setError('Please provide a note explaining what modification is required.')
      return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch(`/api/referencing/${id}/landlord-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: note || null, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const scoreClass = (score: number) =>
    score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A3D2B]" />
      </div>
    )
  }

  if (error && !app) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <p className="text-red-600 font-medium mb-2">Unable to load reference report</p>
        <p className="text-sm text-[#8a7968]">{error}</p>
        <p className="text-sm text-[#8a7968] mt-2">This link may have expired. Please contact Central Gate Estates.</p>
      </div>
    )
  }

  if (submitted) {
    const labels: Record<string, string> = {
      APPROVED: 'Tenant Approved',
      DECLINED: 'Tenant Declined',
      MODIFICATION_REQUESTED: 'Modification Requested',
    }
    const colors: Record<string, string> = {
      APPROVED: 'text-green-600',
      DECLINED: 'text-red-600',
      MODIFICATION_REQUESTED: 'text-amber-600',
    }
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className={`text-2xl font-bold mb-2 ${colors[decision ?? '']}`}>{labels[decision ?? '']}</h2>
        <p className="text-[#8a7968] mb-6">
          Your decision has been recorded. Central Gate Estates has been notified and will take the next steps.
        </p>
        <Link href="/portal/landlord/referencing" className="text-sm text-[#1A3D2B] hover:underline">
          ← Back to References
        </Link>
      </div>
    )
  }

  if (app?.landlordApprovalStatus && app.landlordApprovalStatus !== 'PENDING') {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <p className="text-[#1a1a1a] font-semibold text-lg">Decision already recorded</p>
        <p className="text-sm text-[#8a7968] mt-2">
          You already submitted a decision for this reference: <strong>{app.landlordApprovalStatus}</strong>
        </p>
        <Link href="/portal/landlord/referencing" className="text-sm text-[#1A3D2B] hover:underline mt-4 block">
          ← Back to References
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/landlord/referencing" className="text-gray-400 hover:text-[#1a1a1a] transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Reference Approval</h1>
          <p className="text-sm text-[#8a7968]">Review the reference report and make your decision</p>
        </div>
      </div>

      {/* Applicant & Property */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              {app?.tenant.firstName} {app?.tenant.lastName}
            </h2>
            <p className="text-sm text-[#8a7968]">
              {app?.enquiry?.property
                ? `${app.enquiry.property.addressLine1}, ${app.enquiry.property.area}, ${app.enquiry.property.postcode}`
                : 'Property not specified'}
            </p>
          </div>
          {app?.affordabilityScore !== null && app?.affordabilityScore !== undefined && (
            <div className="text-right">
              <p className={`text-3xl font-bold ${scoreClass(app.affordabilityScore)}`}>
                {app.affordabilityScore}<span className="text-lg font-normal text-gray-400">/100</span>
              </p>
              <p className="text-xs text-gray-400">Affordability score</p>
            </div>
          )}
        </div>

        {app?.enquiry?.offer && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Monthly Rent</p>
              <p className="font-semibold text-[#1a1a1a]">£{app.enquiry.offer.proposedRent.toLocaleString()} pcm</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Deposit</p>
              <p className="font-semibold text-[#1a1a1a]">£{app.enquiry.offer.depositAmount.toLocaleString()} ({app.enquiry.offer.depositScheme})</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Start Date</p>
              <p className="font-semibold text-[#1a1a1a]">
                {new Date(app.enquiry.offer.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Term</p>
              <p className="font-semibold text-[#1a1a1a]">{app.enquiry.offer.tenancyTerm} months</p>
            </div>
          </div>
        )}

        {app?.reportUrl && (
          <div className="pt-3 border-t border-gray-100">
            <a
              href={app.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-[#1A3D2B] hover:text-[#122B1E] transition"
            >
              <FileText className="w-4 h-4" /> Download Full Reference Report (PDF)
            </a>
          </div>
        )}
      </div>

      {/* Decision */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-[#1a1a1a]">Your Decision</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setDecision('APPROVED')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
              decision === 'APPROVED'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
            }`}
          >
            <CheckCircle className={`w-6 h-6 flex-shrink-0 ${decision === 'APPROVED' ? 'text-green-600' : 'text-gray-300'}`} />
            <div>
              <p className="font-semibold text-[#1a1a1a]">Approve Tenant</p>
              <p className="text-xs text-[#8a7968]">I am happy to proceed with this applicant. Please prepare the tenancy agreement.</p>
            </div>
          </button>

          <button
            onClick={() => setDecision('DECLINED')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
              decision === 'DECLINED'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
            }`}
          >
            <XCircle className={`w-6 h-6 flex-shrink-0 ${decision === 'DECLINED' ? 'text-red-600' : 'text-gray-300'}`} />
            <div>
              <p className="font-semibold text-[#1a1a1a]">Decline Tenant</p>
              <p className="text-xs text-[#8a7968]">I do not wish to proceed with this applicant.</p>
            </div>
          </button>

          <button
            onClick={() => setDecision('MODIFICATION_REQUESTED')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
              decision === 'MODIFICATION_REQUESTED'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <MessageSquare className={`w-6 h-6 flex-shrink-0 ${decision === 'MODIFICATION_REQUESTED' ? 'text-amber-600' : 'text-gray-300'}`} />
            <div>
              <p className="font-semibold text-[#1a1a1a]">Request Modification</p>
              <p className="text-xs text-[#8a7968]">I have questions or require further information before deciding.</p>
            </div>
          </button>
        </div>

        {decision && (
          <div>
            <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wider mb-1">
              {decision === 'MODIFICATION_REQUESTED' ? 'Modification required (required)' : 'Notes (optional)'}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                decision === 'APPROVED' ? 'Any additional comments…'
                : decision === 'DECLINED' ? 'Reason for declining (optional)…'
                : 'Please describe what information or changes are required…'
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!decision || submitting}
          className="w-full py-3 text-sm font-semibold rounded-lg text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#1A3D2B' }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Submitting…' : 'Submit Decision'}
        </button>
      </div>
    </div>
  )
}

export default function LandlordReferencingDecisionPage() {
  return (
    <Suspense>
      <LandlordDecisionContent />
    </Suspense>
  )
}
