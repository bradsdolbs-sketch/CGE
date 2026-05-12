'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, Send, Calculator, CheckCircle, XCircle, AlertTriangle,
  Loader2, FileText, Download, User, Briefcase, Home, BarChart3,
  Mail, Clock, ShieldCheck, Users,
} from 'lucide-react'

type Doc = { id: string; docType: string; name: string; url: string; uploadedAt: Date }

type GuarantorData = {
  id: string; firstName: string; lastName: string; email: string | null; phone: string | null
  relationship: string | null; guarantorEmployerName: string | null; guarantorJobTitle: string | null
  annualSalary: number | null; guarantorRefStatus: string
  guarantorInvitedAt: Date | null; guarantorSubmittedAt: Date | null
  guarantorAffordabilityScore: number | null; guarantorAffordabilityPass: boolean | null
  guarantorScoreBreakdown: string | null
}

type Application = {
  id: string; status: string; createdAt: Date; submittedAt: Date | null; completedAt: Date | null
  employerName: string | null; employerEmail: string | null; employerPhone: string | null
  jobTitle: string | null; contractType: string | null; annualSalary: number | null
  employmentStartDate: Date | null; employerConfirmed: boolean; employerConfirmedAt: Date | null
  employerConfirmedSalary: number | null; employerNotes: string | null
  prevLandlordName: string | null; prevLandlordEmail: string | null; prevLandlordPhone: string | null
  prevPropertyAddress: string | null; prevTenancyStart: Date | null; prevTenancyEnd: Date | null
  prevMonthlyRent: number | null; reasonForLeaving: string | null
  prevLandlordConfirmed: boolean; prevLandlordConfirmedAt: Date | null
  prevLandlordRating: string | null; prevLandlordArrears: boolean | null; prevLandlordNotes: string | null
  monthlyRentTarget: number | null; affordabilityScore: number | null; affordabilityPass: boolean | null
  scoreBreakdown: string | null; agentNotes: string | null
  companiesHouseNumber: string | null; companiesHouseStatus: string | null; companiesHouseMatch: boolean | null
  idVerificationStatus: string; idVerifiedName: string | null; idVerifiedDob: string | null; idVerifiedAt: Date | null; idVerificationFailReason: string | null
  openBankingStatus: string; openBankingVerifiedSalary: number | null; openBankingVerifiedAt: Date | null
  decisionSource: string | null; decisionReason: string | null
  tenant: { id: string; firstName: string; lastName: string; user: { email: string; name: string | null } }
  documents: Doc[]
}

const STATUS_STYLE: Record<string, string> = {
  PENDING_SUBMISSION: 'bg-gray-100 text-gray-600',
  IN_PROGRESS:        'bg-blue-100 text-blue-700',
  AWAITING_EMPLOYER:  'bg-amber-100 text-amber-700',
  AWAITING_LANDLORD:  'bg-amber-100 text-amber-700',
  UNDER_REVIEW:       'bg-purple-100 text-purple-700',
  PASSED:             'bg-green-100 text-green-700',
  CONDITIONAL:        'bg-orange-100 text-orange-700',
  FAILED:             'bg-red-100 text-red-700',
}

const DOC_LABELS: Record<string, string> = {
  ID_FRONT: 'ID — Front', ID_BACK: 'ID — Back',
  PAYSLIP_1: 'Payslip (latest)', PAYSLIP_2: 'Payslip (−1 mo)', PAYSLIP_3: 'Payslip (−2 mo)',
  BANK_STATEMENT: 'Bank Statement', PROOF_OF_ADDRESS: 'Proof of Address', OTHER: 'Other',
}

export default function ReferencingDetailClient({ application: initial, guarantors: initialGuarantors }: { application: Application; guarantors: GuarantorData[] }) {
  const router = useRouter()
  const [app, setApp] = useState(initial)
  const [activeTab, setActiveTab] = useState<'overview' | 'employment' | 'landlord' | 'documents' | 'score' | 'guarantor'>('overview')
  const [sendingChecks, setSendingChecks] = useState(false)
  const [calculatingScore, setCalculatingScore] = useState(false)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [agentNotes, setAgentNotes] = useState(initial.agentNotes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [chSearching, setChSearching] = useState(false)
  const [chResults, setChResults] = useState<{ companyName: string; companyNumber: string; status: string; address: string | null }[]>([])
  const [chSaving, setChSaving] = useState(false)
  const [guarantors, setGuarantors] = useState<GuarantorData[]>(initialGuarantors)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [scoringId, setScoringId] = useState<string | null>(null)

  const breakdown: Record<string, { score: number; max: number; notes: string }> =
    app.scoreBreakdown ? JSON.parse(app.scoreBreakdown) : {}

  async function searchCompaniesHouse() {
    if (!app.employerName) return
    setChSearching(true); setChResults([])
    try {
      const res = await fetch(`/api/referencing/${app.id}/companies-house?q=${encodeURIComponent(app.employerName)}`)
      const data = await res.json()
      setChResults(data.results ?? [])
    } finally {
      setChSearching(false)
    }
  }

  async function saveCompaniesHouse(item: { companyName: string; companyNumber: string; status: string; address: string | null }) {
    setChSaving(true)
    try {
      const res = await fetch(`/api/referencing/${app.id}/companies-house`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      const data = await res.json()
      setApp((prev) => ({ ...prev, companiesHouseNumber: data.companiesHouseNumber, companiesHouseStatus: data.companiesHouseStatus, companiesHouseMatch: data.companiesHouseMatch }))
      setChResults([])
    } finally {
      setChSaving(false)
    }
  }

  const canSendEmployer = !!app.employerEmail && !app.employerConfirmed
  const canSendLandlord = !!app.prevLandlordEmail && !app.prevLandlordConfirmed
  const canCalculate = ['IN_PROGRESS','AWAITING_EMPLOYER','AWAITING_LANDLORD','UNDER_REVIEW'].includes(app.status)
  const canDecide = app.status === 'UNDER_REVIEW' || app.affordabilityScore !== null

  async function sendChecks(targets: ('employer' | 'landlord')[]) {
    setSendingChecks(true); setError(null)
    try {
      const res = await fetch(`/api/referencing/${app.id}/send-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send: targets }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSuccess(`Verification emails sent to: ${data.sent.join(', ')}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSendingChecks(false)
    }
  }

  async function calculateScore() {
    setCalculatingScore(true); setError(null)
    try {
      const res = await fetch(`/api/referencing/${app.id}/score`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setApp((a) => ({ ...a, ...data.application, scoreBreakdown: JSON.stringify(data.breakdown) }))
      setActiveTab('score')
      setSuccess(`Score calculated: ${data.score}/100`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setCalculatingScore(false)
    }
  }

  async function makeDecision(decision: 'PASSED' | 'CONDITIONAL' | 'FAILED') {
    setDecidingId(decision); setError(null)
    try {
      const res = await fetch(`/api/referencing/${app.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, agentNotes }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setApp((a) => ({ ...a, status: decision, completedAt: new Date() }))
      setSuccess(`Application marked as ${decision}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setDecidingId(null)
    }
  }

  async function generateReport() {
    setGeneratingReport(true); setError(null)
    try {
      const res = await fetch(`/api/referencing/${app.id}/report`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate report')
      setSuccess('Report generated and sent to agents and landlord for approval')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setGeneratingReport(false)
    }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await fetch(`/api/referencing/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentNotes }),
      })
      setSuccess('Notes saved')
    } finally {
      setSavingNotes(false)
    }
  }

  const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-amber-600' : 'text-red-600'
  const scoreBg    = (s: number) => s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'landlord', label: 'Prev. Landlord', icon: Home },
    { id: 'documents', label: `Documents (${app.documents.length})`, icon: FileText },
    { id: 'score', label: 'Score Report', icon: ShieldCheck },
    { id: 'guarantor', label: `Guarantors (${guarantors.length})`, icon: Users },
  ] as const

  async function inviteGuarantor(guarantorId: string) {
    setInvitingId(guarantorId); setError(null)
    try {
      const res = await fetch(`/api/guarantors/${guarantorId}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invite')
      setGuarantors((prev) => prev.map((g) => g.id === guarantorId ? { ...g, guarantorInvitedAt: new Date(), guarantorRefStatus: 'PENDING_SUBMISSION' } : g))
      setSuccess('Invitation sent to guarantor')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setInvitingId(null)
    }
  }

  async function scoreGuarantor(guarantorId: string) {
    setScoringId(guarantorId); setError(null)
    try {
      const res = await fetch(`/api/guarantors/${guarantorId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyRent: app.monthlyRentTarget }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setGuarantors((prev) => prev.map((g) => g.id === guarantorId ? { ...g, ...data.guarantor } : g))
      setSuccess(`Guarantor score calculated`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setScoringId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link href="/dashboard/referencing" className="text-gray-400 hover:text-[#1a1a1a] transition mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              {app.tenant.firstName} {app.tenant.lastName}
            </h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${STATUS_STYLE[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {app.status.replace(/_/g, ' ')}
            </span>
            {app.decisionSource === 'AUTO' && (
              <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Auto-decided</span>
            )}
            {app.decisionSource === 'AGENT_OVERRIDE' && (
              <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Agent decision</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{app.tenant.user.email} · Started {format(new Date(app.createdAt), 'd MMM yyyy')}</p>
          {app.decisionReason && (
            <p className="text-xs text-gray-400 mt-0.5 italic">{app.decisionReason}</p>
          )}
        </div>
        {app.affordabilityScore !== null && (
          <div className="text-right">
            <p className={`text-3xl font-bold ${scoreColor(app.affordabilityScore)}`}>{app.affordabilityScore}<span className="text-lg font-normal text-gray-400">/100</span></p>
            <p className="text-xs text-gray-400">Affordability score</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>}

      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-2">Actions</p>

        {(canSendEmployer || canSendLandlord) && (
          <button
            onClick={() => {
              const targets: ('employer' | 'landlord')[] = []
              if (canSendEmployer) targets.push('employer')
              if (canSendLandlord) targets.push('landlord')
              sendChecks(targets)
            }}
            disabled={sendingChecks}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            {sendingChecks ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Send verification emails
          </button>
        )}

        {canSendEmployer && !canSendLandlord && app.prevLandlordEmail && (
          <button onClick={() => sendChecks(['employer'])} disabled={sendingChecks} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition disabled:opacity-50 hover:bg-blue-200">
            <Mail size={13} /> Employer only
          </button>
        )}

        {canCalculate && (
          <button
            onClick={calculateScore}
            disabled={calculatingScore}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            {calculatingScore ? <Loader2 size={13} className="animate-spin" /> : <Calculator size={13} />}
            {calculatingScore ? 'Calculating…' : 'Calculate score'}
          </button>
        )}

        {canDecide && (
          <div className="flex items-center gap-2 flex-wrap">
            {app.decisionSource === 'AUTO' && (
              <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                Auto-decided · Override:
              </span>
            )}
            <button onClick={() => makeDecision('PASSED')} disabled={!!decidingId} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
              {decidingId === 'PASSED' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} {app.decisionSource === 'AUTO' ? 'Pass' : 'Pass'}
            </button>
            <button onClick={() => makeDecision('CONDITIONAL')} disabled={!!decidingId} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
              {decidingId === 'CONDITIONAL' ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />} Conditional
            </button>
            <button onClick={() => makeDecision('FAILED')} disabled={!!decidingId} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
              {decidingId === 'FAILED' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Fail
            </button>
          </div>
        )}

        {app.affordabilityScore !== null && (
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 ml-auto"
          >
            {generatingReport ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {generatingReport ? 'Generating…' : 'Generate & Send Report'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-0 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === t.id ? 'border-[#1A3D2B] text-[#1A3D2B]' : 'border-transparent text-gray-500 hover:text-[#1a1a1a]'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Progress checklist */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Application Progress</h3>
            <div className="space-y-3">
              {[
                { label: 'Application created', done: true, date: format(new Date(app.createdAt), 'd MMM yyyy') },
                { label: 'Tenant submitted form', done: !!app.submittedAt, date: app.submittedAt ? format(new Date(app.submittedAt), 'd MMM yyyy') : null },
                { label: 'Employer verification email sent', done: !!app.employerEmail && (app.employerConfirmed || ['AWAITING_EMPLOYER','UNDER_REVIEW'].includes(app.status)), date: null },
                { label: 'Employer confirmed', done: app.employerConfirmed, date: app.employerConfirmedAt ? format(new Date(app.employerConfirmedAt), 'd MMM yyyy') : null },
                { label: 'Previous landlord email sent', done: !!app.prevLandlordEmail && (app.prevLandlordConfirmed || ['AWAITING_LANDLORD','UNDER_REVIEW'].includes(app.status)), date: null },
                { label: 'Landlord reference received', done: app.prevLandlordConfirmed, date: app.prevLandlordConfirmedAt ? format(new Date(app.prevLandlordConfirmedAt), 'd MMM yyyy') : null },
                { label: 'Identity verified', done: app.idVerificationStatus === 'VERIFIED', date: app.idVerifiedAt ? format(new Date(app.idVerifiedAt), 'd MMM yyyy') : null },
                { label: 'Score calculated', done: app.affordabilityScore !== null, date: null },
                { label: 'Decision made', done: ['PASSED','CONDITIONAL','FAILED'].includes(app.status), date: app.completedAt ? format(new Date(app.completedAt), 'd MMM yyyy') : null },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-[#1A3D2B]' : 'bg-gray-200'}`}>
                    {step.done && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <p className={`text-sm flex-1 ${step.done ? 'text-[#1a1a1a] font-medium' : 'text-gray-400'}`}>{step.label}</p>
                  {step.date && <p className="text-xs text-gray-400">{step.date}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Annual salary" value={app.annualSalary ? `£${app.annualSalary.toLocaleString()}` : '—'} />
            <StatCard label="Monthly rent" value={app.monthlyRentTarget ? `£${app.monthlyRentTarget.toLocaleString()}` : '—'} />
            <StatCard label="Ratio" value={
              app.annualSalary && app.monthlyRentTarget
                ? `${(app.annualSalary / (app.monthlyRentTarget * 12)).toFixed(1)}×`
                : '—'
            } />
            <StatCard label="Documents" value={`${app.documents.length} uploaded`} />
          </div>

          {/* Agent notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-[#1a1a1a]">Agent Notes</h3>
            <textarea
              rows={4}
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Internal notes about this application…"
              className={`${inputCls} resize-none`}
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {savingNotes ? <Loader2 size={12} className="animate-spin" /> : null}
              {savingNotes ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Employment tab ───────────────────────────────────────────────────── */}
      {activeTab === 'employment' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            <SectionHeader title="Employment Details (Tenant-declared)" />
            <InfoRow label="Employer" value={app.employerName} />
            <InfoRow label="Employer email" value={app.employerEmail} />
            <InfoRow label="Employer phone" value={app.employerPhone} />
            <InfoRow label="Job title" value={app.jobTitle} />
            <InfoRow label="Contract type" value={app.contractType} />
            <InfoRow label="Declared salary" value={app.annualSalary ? `£${app.annualSalary.toLocaleString()} pa` : null} />
            <InfoRow label="Start date" value={app.employmentStartDate ? format(new Date(app.employmentStartDate), 'd MMM yyyy') : null} />
          </div>

          <div className={`bg-white border rounded-xl divide-y divide-gray-50 ${app.employerConfirmed ? 'border-green-200' : 'border-gray-200'}`}>
            <SectionHeader
              title="Employer Verification"
              badge={app.employerConfirmed
                ? { label: 'Confirmed', colour: 'bg-green-100 text-green-700' }
                : { label: 'Awaiting', colour: 'bg-amber-100 text-amber-700' }}
            />
            {app.employerConfirmed ? (
              <>
                <InfoRow label="Confirmed at" value={app.employerConfirmedAt ? format(new Date(app.employerConfirmedAt), 'd MMM yyyy HH:mm') : null} />
                <InfoRow label="Confirmed salary" value={app.employerConfirmedSalary ? `£${app.employerConfirmedSalary.toLocaleString()} pa` : 'Not specified'} />
                {app.employerNotes && <InfoRow label="Employer notes" value={app.employerNotes} />}
              </>
            ) : (
              <div className="px-5 py-4">
                <p className="text-sm text-gray-400 italic">
                  {app.employerEmail ? `Awaiting response from ${app.employerEmail}` : 'No employer email provided'}
                </p>
                {canSendEmployer && (
                  <button
                    onClick={() => sendChecks(['employer'])}
                    disabled={sendingChecks}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <Send size={12} /> Send verification email now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Companies House */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1a1a1a]">Companies House</p>
              {app.employerName && !app.companiesHouseMatch && (
                <button onClick={searchCompaniesHouse} disabled={chSearching}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] transition disabled:opacity-50">
                  {chSearching ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                  {chSearching ? 'Searching…' : 'Look up employer'}
                </button>
              )}
            </div>

            {app.companiesHouseMatch ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${app.companiesHouseStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {app.companiesHouseStatus === 'active' ? '✓ Active' : `⚠ ${app.companiesHouseStatus ?? 'Unknown'}`}
                  </span>
                  <span className="text-xs text-gray-500">#{app.companiesHouseNumber}</span>
                </div>
                {app.companiesHouseStatus !== 'active' && (
                  <p className="text-xs text-red-600 font-medium">Company is not active on Companies House — verify employment directly with the tenant.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Not yet looked up. Search Companies House to validate the employer exists and is active.</p>
            )}

            {chResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 overflow-hidden">
                {chResults.map((r) => (
                  <button key={r.companyNumber} onClick={() => saveCompaniesHouse(r)} disabled={chSaving}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition disabled:opacity-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1a1a1a]">{r.companyName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">#{r.companyNumber}{r.address ? ` · ${r.address}` : ''}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Open Banking */}
          <div className={`bg-white border rounded-xl p-5 space-y-2 ${app.openBankingStatus === 'VERIFIED' ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1a1a1a]">Open Banking Income</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                app.openBankingStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                app.openBankingStatus === 'CONNECTED' ? 'bg-blue-100 text-blue-700' :
                app.openBankingStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                app.openBankingStatus === 'PENDING_AUTH' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {app.openBankingStatus === 'VERIFIED' ? '✓ Verified' :
                 app.openBankingStatus === 'CONNECTED' ? 'Connected' :
                 app.openBankingStatus === 'FAILED' ? 'Failed' :
                 app.openBankingStatus === 'PENDING_AUTH' ? 'Pending auth' :
                 'Not connected'}
              </span>
            </div>
            {app.openBankingStatus === 'VERIFIED' ? (
              <div className="space-y-1 text-sm">
                {app.openBankingVerifiedSalary && <p className="text-gray-700">Detected income: <span className="font-medium">£{app.openBankingVerifiedSalary.toLocaleString()} pa</span></p>}
                {app.openBankingVerifiedAt && <p className="text-xs text-gray-400">Verified {format(new Date(app.openBankingVerifiedAt), 'd MMM yyyy HH:mm')}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                {app.openBankingStatus === 'NOT_STARTED' || !app.openBankingStatus
                  ? 'Tenant has not connected their bank account.'
                  : app.openBankingStatus === 'FAILED'
                  ? 'Connection failed. Tenant can retry from their portal.'
                  : 'Status will update automatically when the tenant completes connection.'}
              </p>
            )}
          </div>

          {/* Identity Verification */}
          <div className={`bg-white border rounded-xl p-5 space-y-2 ${app.idVerificationStatus === 'VERIFIED' ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1a1a1a]">Identity Verification</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                app.idVerificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                app.idVerificationStatus === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                app.idVerificationStatus === 'REQUIRES_INPUT' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {app.idVerificationStatus === 'VERIFIED' ? '✓ Verified' :
                 app.idVerificationStatus === 'PENDING' ? 'In progress' :
                 app.idVerificationStatus === 'REQUIRES_INPUT' ? 'Needs input' :
                 'Not started'}
              </span>
            </div>
            {app.idVerificationStatus === 'VERIFIED' ? (
              <div className="space-y-1 text-sm">
                {app.idVerifiedName && <p className="text-gray-700">Name: <span className="font-medium">{app.idVerifiedName}</span></p>}
                {app.idVerifiedDob && <p className="text-gray-700">DOB: <span className="font-medium">{app.idVerifiedDob}</span></p>}
                {app.idVerifiedAt && <p className="text-xs text-gray-400">Verified {format(new Date(app.idVerifiedAt), 'd MMM yyyy HH:mm')}</p>}
              </div>
            ) : app.idVerificationStatus === 'REQUIRES_INPUT' ? (
              <p className="text-xs text-amber-700">{app.idVerificationFailReason ?? 'Verification could not be completed — tenant needs to retry.'}</p>
            ) : (
              <p className="text-xs text-gray-400">Powered by Stripe Identity. Status updates automatically when the tenant completes verification.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Previous Landlord tab ────────────────────────────────────────────── */}
      {activeTab === 'landlord' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            <SectionHeader title="Previous Tenancy (Tenant-declared)" />
            <InfoRow label="Landlord name" value={app.prevLandlordName} />
            <InfoRow label="Landlord email" value={app.prevLandlordEmail} />
            <InfoRow label="Landlord phone" value={app.prevLandlordPhone} />
            <InfoRow label="Property address" value={app.prevPropertyAddress} />
            <InfoRow label="Tenancy period" value={
              app.prevTenancyStart && app.prevTenancyEnd
                ? `${format(new Date(app.prevTenancyStart), 'MMM yyyy')} – ${format(new Date(app.prevTenancyEnd), 'MMM yyyy')}`
                : null
            } />
            <InfoRow label="Reason for leaving" value={app.reasonForLeaving} />
          </div>

          <div className={`bg-white border rounded-xl divide-y divide-gray-50 ${app.prevLandlordConfirmed ? 'border-green-200' : 'border-gray-200'}`}>
            <SectionHeader
              title="Landlord Reference"
              badge={app.prevLandlordConfirmed
                ? { label: 'Received', colour: 'bg-green-100 text-green-700' }
                : { label: 'Awaiting', colour: 'bg-amber-100 text-amber-700' }}
            />
            {app.prevLandlordConfirmed ? (
              <>
                <InfoRow label="Received at" value={app.prevLandlordConfirmedAt ? format(new Date(app.prevLandlordConfirmedAt), 'd MMM yyyy HH:mm') : null} />
                <InfoRow label="Rating" value={app.prevLandlordRating} highlight={
                  app.prevLandlordRating === 'EXCELLENT' ? 'text-green-600' :
                  app.prevLandlordRating === 'GOOD' ? 'text-blue-600' :
                  app.prevLandlordRating === 'CONCERNS' ? 'text-amber-600' : 'text-red-600'
                } />
                <InfoRow label="Arrears reported" value={app.prevLandlordArrears ? '⚠️ YES — arrears reported' : 'No arrears'} highlight={app.prevLandlordArrears ? 'text-red-600 font-bold' : 'text-green-600'} />
                {app.prevLandlordNotes && <InfoRow label="Notes" value={app.prevLandlordNotes} />}
              </>
            ) : (
              <div className="px-5 py-4">
                <p className="text-sm text-gray-400 italic">
                  {app.prevLandlordEmail ? `Awaiting reference from ${app.prevLandlordEmail}` : 'No previous landlord email provided'}
                </p>
                {canSendLandlord && (
                  <button
                    onClick={() => sendChecks(['landlord'])}
                    disabled={sendingChecks}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <Send size={12} /> Send reference request now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Documents tab ────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {app.documents.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <FileText size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {app.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{DOC_LABELS[doc.docType] ?? doc.docType} · {format(new Date(doc.uploadedAt), 'd MMM yyyy')}</p>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] transition flex-shrink-0"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Score Report tab ─────────────────────────────────────────────────── */}
      {activeTab === 'score' && (
        <div className="space-y-4">
          {app.affordabilityScore === null ? (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center">
              <Calculator size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-500">Score not yet calculated</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Click "Calculate score" in the action bar above once enough data is available</p>
              {canCalculate && (
                <button
                  onClick={calculateScore}
                  disabled={calculatingScore}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 mx-auto"
                >
                  {calculatingScore ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                  {calculatingScore ? 'Calculating…' : 'Calculate now'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Score gauge */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-5xl font-bold ${scoreColor(app.affordabilityScore)}`}>{app.affordabilityScore}</p>
                    <p className="text-sm text-gray-500 mt-1">out of 100</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                      app.affordabilityPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {app.affordabilityPass ? '✓ PASS' : '✗ FAIL'}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">Pass threshold: 60/100</p>
                  </div>
                </div>
                {/* Bar */}
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBg(app.affordabilityScore)}`}
                    style={{ width: `${app.affordabilityScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 — Fail</span><span>60 — Pass</span><span>100 — Excellent</span>
                </div>
              </div>

              {/* Category breakdown */}
              {Object.keys(breakdown).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score Breakdown</p>
                  </div>
                  {Object.entries(breakdown).map(([category, data]) => (
                    <div key={category} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{category}</p>
                        <span className={`text-sm font-bold ${scoreColor(Math.round((data.score / data.max) * 100))}`}>
                          {data.score}/{data.max}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${scoreBg(Math.round((data.score / data.max) * 100))}`}
                          style={{ width: `${(data.score / data.max) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{data.notes}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Credit check stub */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#1a1a1a]">Credit History</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Not available</span>
                </div>
                <p className="text-xs text-gray-400">Credit check integration requires a commercial contract with Experian TenantVerify or CreditSafe. Contact your account manager to enable this feature.</p>
              </div>

              {/* Recalculate */}
              {canCalculate && (
                <button onClick={calculateScore} disabled={calculatingScore} className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium transition">
                  <Calculator size={13} /> Recalculate score
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Guarantor tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'guarantor' && (
        <div className="space-y-4">
          {guarantors.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center">
              <Users size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-500">No guarantors on this tenancy</p>
              <p className="text-sm text-gray-400 mt-1">Add a guarantor on the tenancy record first, then invite them from here.</p>
            </div>
          ) : (
            guarantors.map((g) => {
              const breakdown: Record<string, unknown> = g.guarantorScoreBreakdown ? JSON.parse(g.guarantorScoreBreakdown) : {}
              return (
                <div key={g.id} className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{g.firstName} {g.lastName}</p>
                      <p className="text-xs text-gray-400">{g.relationship ?? 'Guarantor'}{g.email ? ` · ${g.email}` : ''}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      g.guarantorRefStatus === 'PASSED' ? 'bg-green-100 text-green-700' :
                      g.guarantorRefStatus === 'UNDER_REVIEW' ? 'bg-purple-100 text-purple-700' :
                      g.guarantorRefStatus === 'PENDING_SUBMISSION' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {g.guarantorRefStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="px-5 py-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Declared salary</p>
                      <p className="text-sm font-semibold">{g.annualSalary ? `£${g.annualSalary.toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Employer</p>
                      <p className="text-sm font-semibold truncate">{g.guarantorEmployerName ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Score</p>
                      <p className={`text-sm font-semibold ${g.guarantorAffordabilityScore !== null ? (g.guarantorAffordabilityPass ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {g.guarantorAffordabilityScore !== null ? `${g.guarantorAffordabilityScore}/100` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Combined affordability */}
                  {(breakdown as { combinedRatio?: number; combinedPass?: boolean; combined?: number }).combined !== undefined && (
                    <div className="px-5 py-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Combined affordability (tenant + guarantor)</p>
                      <p className="text-sm">
                        Combined salary: <strong>£{((breakdown as { combined: number }).combined).toLocaleString()} pa</strong>
                        {' · '}
                        Ratio: <strong>{(breakdown as { combinedRatio: number }).combinedRatio}×</strong>
                        {' '}
                        <span className={`font-semibold ${(breakdown as { combinedPass: boolean }).combinedPass ? 'text-green-600' : 'text-red-600'}`}>
                          {(breakdown as { combinedPass: boolean }).combinedPass ? '✓ Pass (≥2.5×)' : '✗ Fail (<2.5×)'}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="px-5 py-3 flex items-center gap-3">
                    {!g.guarantorInvitedAt && g.email && (
                      <button
                        onClick={() => inviteGuarantor(g.id)}
                        disabled={invitingId === g.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] transition disabled:opacity-50"
                      >
                        {invitingId === g.id ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                        Send invitation
                      </button>
                    )}
                    {g.guarantorInvitedAt && !g.guarantorInvitedAt && (
                      <button
                        onClick={() => inviteGuarantor(g.id)}
                        disabled={invitingId === g.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                      >
                        <Mail size={12} /> Resend invitation
                      </button>
                    )}
                    {g.guarantorRefStatus === 'UNDER_REVIEW' && (
                      <button
                        onClick={() => scoreGuarantor(g.id)}
                        disabled={scoringId === g.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition disabled:opacity-50"
                      >
                        {scoringId === g.id ? <Loader2 size={12} className="animate-spin" /> : <Calculator size={12} />}
                        Calculate score
                      </button>
                    )}
                    {g.guarantorInvitedAt && (
                      <p className="text-xs text-gray-400 ml-auto">
                        Invited {format(new Date(g.guarantorInvitedAt), 'd MMM yyyy')}
                        {g.guarantorSubmittedAt && ` · Submitted ${format(new Date(g.guarantorSubmittedAt), 'd MMM yyyy')}`}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── Small helper components ───────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-[#1a1a1a]">{value}</p>
    </div>
  )
}

function SectionHeader({ title, badge }: { title: string; badge?: { label: string; colour: string } }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      {badge && <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.colour}`}>{badge.label}</span>}
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: string }) {
  return (
    <div className="flex px-5 py-3 gap-4">
      <span className="w-40 text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium ${highlight ?? 'text-[#1a1a1a]'}`}>{value ?? '—'}</span>
    </div>
  )
}
