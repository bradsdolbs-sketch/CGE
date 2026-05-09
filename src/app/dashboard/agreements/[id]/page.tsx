'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, FileText, CheckCircle, Clock, Send, Loader2, ExternalLink, XCircle,
} from 'lucide-react'

type Agreement = {
  id: string
  status: string
  draftUrl: string
  finalUrl: string | null
  tenantSignedAt: string | null
  tenantSignedName: string | null
  landlordSignedAt: string | null
  landlordSignedName: string | null
  agentApprovedAt: string | null
  createdAt: string
  enquiry: {
    id: string
    firstName: string
    lastName: string
    email: string
    property: { addressLine1: string; area: string; postcode: string } | null
    offer: { proposedRent: number; startDate: string; tenancyTerm: number; depositAmount: number } | null
  } | null
  tenancy: {
    id: string
    rentAmount: number
    startDate: string
    property: { addressLine1: string; area: string; postcode: string } | null
    landlord: { firstName: string; lastName: string; user: { email: string } }
    tenants: { tenant: { firstName: string; lastName: string; user: { email: string } } }[]
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  AGENT_REVIEW: 'Agent Review',
  PENDING_TENANT_SIGNATURE: 'Awaiting Tenant Signature',
  PENDING_LANDLORD_SIGNATURE: 'Awaiting Landlord Signature',
  FULLY_SIGNED: 'Fully Signed',
  CANCELLED: 'Cancelled',
}
const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  AGENT_REVIEW: 'bg-blue-100 text-blue-700',
  PENDING_TENANT_SIGNATURE: 'bg-amber-100 text-amber-700',
  PENDING_LANDLORD_SIGNATURE: 'bg-purple-100 text-purple-700',
  FULLY_SIGNED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function AgreementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [sendingToTenant, setSendingToTenant] = useState(false)

  useEffect(() => {
    fetch(`/api/agreements/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setAgreement(data)
      })
      .catch(() => setError('Failed to load agreement'))
      .finally(() => setLoading(false))
  }, [params.id])

  async function approveAndSendToTenant() {
    if (!agreement) return
    setSendingToTenant(true); setError(null)
    try {
      // Mark as AGENT_REVIEW → PENDING_TENANT_SIGNATURE
      const updateRes = await fetch(`/api/agreements/${agreement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING_TENANT_SIGNATURE', agentApproved: true }),
      })
      if (!updateRes.ok) throw new Error('Failed to update status')

      // Send tenant signing email
      const emailRes = await fetch(`/api/agreements/${agreement.id}/send-tenant-invite`, {
        method: 'POST',
      })
      if (!emailRes.ok) {
        // Non-fatal — status was updated
        setSuccess('Agreement approved. Note: tenant invite email failed — send manually.')
      } else {
        setSuccess('Agreement approved and tenant has been invited to sign.')
      }

      router.refresh()
      // Reload
      const refreshed = await fetch(`/api/agreements/${agreement.id}`).then(r => r.json())
      setAgreement(refreshed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSendingToTenant(false)
    }
  }

  async function cancelAgreement() {
    if (!confirm('Cancel this agreement? This cannot be undone.')) return
    setUpdating(true)
    try {
      await fetch(`/api/agreements/${agreement!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      const refreshed = await fetch(`/api/agreements/${agreement!.id}`).then(r => r.json())
      setAgreement(refreshed)
      setSuccess('Agreement cancelled')
    } catch {
      setError('Failed to cancel')
    } finally {
      setUpdating(false)
    }
  }

  const propertyLabel = agreement?.enquiry?.property
    ? `${agreement.enquiry.property.addressLine1}, ${agreement.enquiry.property.area}`
    : agreement?.tenancy?.property
    ? `${agreement.tenancy.property.addressLine1}, ${agreement.tenancy.property.area}`
    : 'No property'

  const tenantLabel = agreement?.enquiry
    ? `${agreement.enquiry.firstName} ${agreement.enquiry.lastName}`
    : agreement?.tenancy?.tenants?.[0]?.tenant
    ? `${agreement.tenancy.tenants[0].tenant.firstName} ${agreement.tenancy.tenants[0].tenant.lastName}`
    : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A3D2B]" />
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error ?? 'Agreement not found'}</p>
        <Link href="/dashboard/agreements" className="text-sm text-[#1A3D2B] mt-3 block">← Back to Agreements</Link>
      </div>
    )
  }

  const steps = [
    { label: 'Agreement drafted', done: true, date: format(new Date(agreement.createdAt), 'd MMM yyyy') },
    { label: 'Agent approved', done: !!agreement.agentApprovedAt, date: agreement.agentApprovedAt ? format(new Date(agreement.agentApprovedAt), 'd MMM yyyy') : null },
    { label: 'Sent to tenant for signing', done: ['PENDING_TENANT_SIGNATURE','PENDING_LANDLORD_SIGNATURE','FULLY_SIGNED'].includes(agreement.status), date: null },
    { label: 'Tenant signed', done: !!agreement.tenantSignedAt, date: agreement.tenantSignedAt ? format(new Date(agreement.tenantSignedAt), 'd MMM yyyy') : null },
    { label: 'Landlord signed', done: !!agreement.landlordSignedAt, date: agreement.landlordSignedAt ? format(new Date(agreement.landlordSignedAt), 'd MMM yyyy') : null },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agreements" className="text-gray-400 hover:text-[#1a1a1a] transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">{propertyLabel}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${STATUS_CLASS[agreement.status] ?? 'bg-gray-100'}`}>
              {STATUS_LABELS[agreement.status] ?? agreement.status}
            </span>
          </div>
          <p className="text-sm text-[#8a7968] mt-0.5">Tenant: {tenantLabel}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>}

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-2">Actions</p>

        <a
          href={agreement.finalUrl ?? agreement.draftUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {agreement.finalUrl ? 'View Signed PDF' : 'View Draft PDF'}
        </a>

        {agreement.status === 'DRAFT' && (
          <button
            onClick={approveAndSendToTenant}
            disabled={sendingToTenant}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            {sendingToTenant ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sendingToTenant ? 'Sending…' : 'Approve & Send to Tenant'}
          </button>
        )}

        {!['FULLY_SIGNED', 'CANCELLED'].includes(agreement.status) && (
          <button
            onClick={cancelAgreement}
            disabled={updating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition disabled:opacity-50 ml-auto"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel Agreement
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-[#1a1a1a] mb-4">Signing Progress</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-[#1A3D2B]' : 'bg-gray-200'}`}>
                {step.done && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <p className={`text-sm flex-1 ${step.done ? 'text-[#1a1a1a] font-medium' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {step.date && (
                <span className="text-xs text-[#8a7968]">{step.date}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
      {(agreement.tenantSignedAt || agreement.landlordSignedAt) && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#1a1a1a] mb-4">Recorded Signatures</h3>
          <div className="space-y-3">
            {agreement.tenantSignedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    Tenant: <strong>{agreement.tenantSignedName}</strong>
                  </p>
                  <p className="text-xs text-[#8a7968]">
                    Signed {format(new Date(agreement.tenantSignedAt), 'd MMMM yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
            {agreement.landlordSignedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    Landlord: <strong>{agreement.landlordSignedName}</strong>
                  </p>
                  <p className="text-xs text-[#8a7968]">
                    Signed {format(new Date(agreement.landlordSignedAt), 'd MMMM yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      {agreement.enquiry?.offer && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#1a1a1a] mb-4">Offer Terms</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Monthly Rent</p>
              <p className="font-semibold">£{agreement.enquiry.offer.proposedRent.toLocaleString()} pcm</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Deposit</p>
              <p className="font-semibold">£{agreement.enquiry.offer.depositAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Start Date</p>
              <p className="font-semibold">{format(new Date(agreement.enquiry.offer.startDate), 'd MMMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-[#8a7968] uppercase tracking-wider mb-0.5">Term</p>
              <p className="font-semibold">{agreement.enquiry.offer.tenancyTerm} months</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
