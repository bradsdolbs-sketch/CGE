import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReferencingForm from './ReferencingForm'
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Referencing' }

export default async function TenantReferencingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/login')

  const tenant = await prisma.tenant.findUnique({
    where: { userId: session.user.id },
    include: {
      referenceApplications: {
        include: { documents: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!tenant) redirect('/login')

  const application = tenant.referenceApplications[0] ?? null

  // No active application
  if (!application) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>Referencing</h1>
          <p className="text-[#8a7968] text-sm mt-0.5">Your referencing application</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-[#1a1a1a]">No referencing application yet</p>
          <p className="text-sm text-gray-500 mt-1">Your agent will send you a referencing invitation once your holding deposit has been received.</p>
        </div>
      </div>
    )
  }

  // Show status for completed/under review applications
  if (['PASSED', 'FAILED', 'CONDITIONAL', 'UNDER_REVIEW'].includes(application.status)) {
    const statusConfig = {
      PASSED: { icon: CheckCircle, colour: 'text-green-600', bg: 'bg-green-50 border-green-200', msg: 'Congratulations — your referencing has passed. Your agent will be in touch to confirm next steps.' },
      CONDITIONAL: { icon: CheckCircle, colour: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', msg: 'Your referencing has passed conditionally. Your agent will contact you to discuss the conditions.' },
      FAILED: { icon: XCircle, colour: 'text-red-600', bg: 'bg-red-50 border-red-200', msg: 'Unfortunately your referencing application was unsuccessful. Please contact your agent to discuss options.' },
      UNDER_REVIEW: { icon: Clock, colour: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', msg: 'All checks are in. Your agent is reviewing your application and will be in touch shortly.' },
    }
    const cfg = statusConfig[application.status as keyof typeof statusConfig]
    const Icon = cfg.icon

    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>Referencing</h1>
          <p className="text-[#8a7968] text-sm mt-0.5">Your referencing application</p>
        </div>
        <div className={`border rounded-lg p-6 ${cfg.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <Icon size={24} className={cfg.colour} />
            <p className="font-bold text-[#1a1a1a] text-lg">{application.status.replace(/_/g, ' ')}</p>
          </div>
          <p className="text-sm text-gray-700">{cfg.msg}</p>
          {application.affordabilityScore !== null && (
            <p className="text-xs text-gray-500 mt-3">Affordability score: <strong>{application.affordabilityScore}/100</strong></p>
          )}
        </div>
      </div>
    )
  }

  // Awaiting checks — show progress
  if (['AWAITING_EMPLOYER', 'AWAITING_LANDLORD', 'IN_PROGRESS'].includes(application.status)) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>Referencing</h1>
          <p className="text-[#8a7968] text-sm mt-0.5">Your referencing application</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={20} className="text-blue-500" />
            <p className="font-semibold text-[#1a1a1a]">Checks in progress</p>
          </div>
          <p className="text-sm text-gray-600 mb-5">Your application has been submitted. We are currently awaiting responses from your employer and/or previous landlord. This typically takes 1–3 business days.</p>
          <div className="space-y-3">
            {[
              {
                label: 'Application submitted',
                done: true,
                date: application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-GB') : null,
              },
              {
                label: 'Employer verification',
                done: application.employerConfirmed,
                date: application.employerConfirmedAt ? new Date(application.employerConfirmedAt).toLocaleDateString('en-GB') : null,
              },
              {
                label: 'Previous landlord reference',
                done: application.prevLandlordConfirmed,
                date: application.prevLandlordConfirmedAt ? new Date(application.prevLandlordConfirmedAt).toLocaleDateString('en-GB') : null,
              },
              { label: 'Agent review', done: false, date: null },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {step.done && <CheckCircle size={12} className="text-white" />}
                </div>
                <p className={`text-sm ${step.done ? 'text-[#1a1a1a] font-medium' : 'text-gray-400'}`}>{step.label}</p>
                {step.date && <p className="text-xs text-gray-400 ml-auto">{step.date}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // PENDING_SUBMISSION — show the form
  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>Referencing</h1>
        <p className="text-[#8a7968] text-sm mt-0.5">Complete your referencing application</p>
      </div>
      <ReferencingForm
        applicationId={application.id}
        initial={{
          employerName: application.employerName ?? '',
          employerEmail: application.employerEmail ?? '',
          employerPhone: application.employerPhone ?? '',
          jobTitle: application.jobTitle ?? '',
          contractType: application.contractType ?? 'PERMANENT',
          annualSalary: application.annualSalary ? String(application.annualSalary) : '',
          employmentStartDate: application.employmentStartDate
            ? new Date(application.employmentStartDate).toISOString().substring(0, 10)
            : '',
          prevLandlordName: application.prevLandlordName ?? '',
          prevLandlordEmail: application.prevLandlordEmail ?? '',
          prevLandlordPhone: application.prevLandlordPhone ?? '',
          prevPropertyAddress: application.prevPropertyAddress ?? '',
          prevTenancyStart: application.prevTenancyStart
            ? new Date(application.prevTenancyStart).toISOString().substring(0, 10)
            : '',
          prevTenancyEnd: application.prevTenancyEnd
            ? new Date(application.prevTenancyEnd).toISOString().substring(0, 10)
            : '',
          reasonForLeaving: application.reasonForLeaving ?? '',
        }}
        existingDocs={application.documents}
      />
    </div>
  )
}
