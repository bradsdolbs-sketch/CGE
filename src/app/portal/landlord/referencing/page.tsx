import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { CheckCircle, Clock, FileText } from 'lucide-react'

export default async function LandlordReferencingPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findFirst({
    where: { userId: session.user.id },
    select: { id: true, properties: { select: { id: true, enquiries: { select: { id: true } } } } },
  })

  if (!landlord) redirect('/portal/landlord')

  // Get all enquiry IDs under this landlord's properties
  const enquiryIds = landlord.properties.flatMap(p => p.enquiries.map(e => e.id))

  if (enquiryIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Reference Approvals</h1>
          <p className="text-sm text-[#8a7968] mt-1">No referencing applications found for your properties.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-[#1a1a1a] font-medium">All references reviewed</p>
          <p className="text-sm text-[#8a7968] mt-1">No reference reports are currently awaiting your decision.</p>
        </div>
      </div>
    )
  }

  // Get applications for these enquiries with a report
  const applications = await prisma.tenantReferenceApplication.findMany({
    where: {
      enquiryId: { in: enquiryIds },
      reportUrl: { not: null },
    },
    include: {
      tenant: { include: { user: { select: { email: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Fetch enquiry + property + offer for each application
  const appsWithEnquiry = await Promise.all(
    applications.map(async (app) => {
      const enquiry = app.enquiryId
        ? await prisma.enquiry.findUnique({
            where: { id: app.enquiryId },
            include: {
              property: { select: { addressLine1: true, area: true, postcode: true } },
              offer: { select: { proposedRent: true, startDate: true, tenancyTerm: true } },
            },
          })
        : null
      return { ...app, enquiry }
    })
  )

  const pendingApprovals = appsWithEnquiry.filter(
    a => !a.landlordApprovalStatus || a.landlordApprovalStatus === 'PENDING'
  )
  const decidedApprovals = appsWithEnquiry.filter(
    a => a.landlordApprovalStatus && a.landlordApprovalStatus !== 'PENDING'
  )

  const approvalStatusLabel: Record<string, string> = {
    APPROVED: 'Approved',
    DECLINED: 'Declined',
    MODIFICATION_REQUESTED: 'Modification Requested',
  }
  const approvalStatusClass: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    DECLINED: 'bg-red-100 text-red-700',
    MODIFICATION_REQUESTED: 'bg-amber-100 text-amber-700',
  }
  const scoreClass = (score: number) =>
    score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Reference Approvals</h1>
        <p className="text-sm text-[#8a7968] mt-1">Review and approve prospective tenant reference reports for your properties.</p>
      </div>

      {/* Pending */}
      {pendingApprovals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8a7968] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Awaiting Your Decision ({pendingApprovals.length})
          </h2>
          <div className="space-y-3">
            {pendingApprovals.map((app) => (
              <div key={app.id} className="bg-white border border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-[#1a1a1a] text-lg">
                        {app.tenant.firstName} {app.tenant.lastName}
                      </h3>
                      {app.affordabilityScore !== null && (
                        <span className={`text-2xl font-bold ${scoreClass(app.affordabilityScore)}`}>
                          {app.affordabilityScore}<span className="text-sm font-normal text-gray-400">/100</span>
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
                        app.status === 'PASSED' ? 'bg-green-100 text-green-700'
                        : app.status === 'CONDITIONAL' ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[#8a7968] mt-1">
                      {app.enquiry?.property
                        ? `${app.enquiry.property.addressLine1}, ${app.enquiry.property.area}`
                        : 'Property not specified'}
                    </p>
                    {app.enquiry?.offer && (
                      <p className="text-sm text-[#8a7968]">
                        Proposed rent: £{app.enquiry.offer.proposedRent.toLocaleString()} pcm ·{' '}
                        Start: {format(new Date(app.enquiry.offer.startDate), 'd MMM yyyy')} ·{' '}
                        {app.enquiry.offer.tenancyTerm} months
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Report generated {format(new Date(app.updatedAt), 'd MMM yyyy')}
                    </p>
                  </div>
                  {app.reportUrl && (
                    <a
                      href={app.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-[#1A3D2B] hover:text-[#122B1E] transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Report
                    </a>
                  )}
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                  <Link
                    href={`/portal/landlord/referencing/${app.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold rounded-lg transition"
                  >
                    Review &amp; Decide
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingApprovals.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-[#1a1a1a] font-medium">All references reviewed</p>
          <p className="text-sm text-[#8a7968] mt-1">No reference reports are currently awaiting your decision.</p>
        </div>
      )}

      {/* Previous decisions */}
      {decidedApprovals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8a7968] uppercase tracking-wider mb-3">Previous Decisions</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Decision</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {decidedApprovals.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1a1a1a]">{app.tenant.firstName} {app.tenant.lastName}</div>
                      <div className="text-xs text-[#8a7968]">{app.tenant.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#8a7968] text-xs">
                      {app.enquiry?.property?.addressLine1 ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {app.affordabilityScore !== null && (
                        <span className={`font-bold ${scoreClass(app.affordabilityScore)}`}>
                          {app.affordabilityScore}/100
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${approvalStatusClass[app.landlordApprovalStatus ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                        {approvalStatusLabel[app.landlordApprovalStatus ?? ''] ?? app.landlordApprovalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8a7968] text-xs">
                      {app.landlordApprovalAt ? format(new Date(app.landlordApprovalAt), 'd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
