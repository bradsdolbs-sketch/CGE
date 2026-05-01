import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { Building2, PoundSterling, AlertTriangle, CheckCircle } from 'lucide-react'
import ApproveMaintenanceButtons from './ApproveMaintenanceButtons'

function fmt(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy')
}

function tenancyEndColor(endDate: Date) {
  const days = differenceInDays(new Date(endDate), new Date())
  if (days < 0) return 'text-red-600'
  if (days <= 30) return 'text-red-600'
  if (days <= 60) return 'text-amber-600'
  return 'text-green-600'
}

function serviceLevelLabel(level: string) {
  const map: Record<string, string> = {
    FULL_MANAGEMENT: 'Full Management',
    RENT_COLLECTION: 'Rent Collection',
    TENANT_FIND: 'Tenant Find',
  }
  return map[level] ?? level
}

export default async function LandlordPortalPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    include: {
      properties: {
        include: {
          tenancies: {
            where: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] } },
            include: {
              tenants: {
                include: { tenant: true },
                where: { isPrimary: true },
                take: 1,
              },
            },
            take: 1,
          },
          maintenanceReqs: {
            where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          },
        },
      },
      tenancies: {
        where: {
          status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] },
        },
        select: { rentAmount: true },
      },
      statements: {
        orderBy: { periodStart: 'desc' },
        take: 3,
      },
    },
  })

  if (!landlord) redirect('/login')

  const maintenanceAwaitingApproval = await prisma.maintenanceRequest.findMany({
    where: {
      property: { landlordId: landlord.id },
      status: 'AWAITING_APPROVAL',
    },
    include: { property: true },
    orderBy: { reportedAt: 'desc' },
  })

  const firstName = landlord.firstName
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const totalRentRoll = landlord.tenancies.reduce((sum, t) => sum + t.rentAmount, 0)
  const vacantCount = landlord.properties.filter((p) => p.tenancies.length === 0).length

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {greeting}, {firstName}
          </h1>
          <p className="text-[#8a7968] text-sm mt-0.5">Your portfolio overview</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 bg-[#4a6fa5]/10 text-[#4a6fa5] rounded">
          {serviceLevelLabel(landlord.serviceLevel)}
        </span>
      </div>

      {/* Portfolio stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#4a6fa5]/10 rounded flex items-center justify-center">
              <Building2 size={16} className="text-[#4a6fa5]" />
            </div>
            <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>Total Properties</p>
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            {landlord.properties.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <PoundSterling size={16} className="text-green-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>Monthly Rent Roll</p>
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            {fmt(totalRentRoll)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${vacantCount > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
              <AlertTriangle size={16} className={vacantCount > 0 ? 'text-amber-600' : 'text-green-600'} />
            </div>
            <p className="text-xs uppercase tracking-wider text-[#8a7968]" style={{ fontFamily: 'Syne, sans-serif' }}>Vacant</p>
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            {vacantCount}
          </p>
        </div>
      </div>

      {/* Maintenance awaiting approval */}
      {maintenanceAwaitingApproval.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200">
            <h2 className="font-semibold text-[#1a1a1a] flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              <AlertTriangle size={16} className="text-amber-500" />
              Maintenance Awaiting Your Approval
            </h2>
            <p className="text-xs text-[#8a7968] mt-0.5">These jobs need your approval before we can proceed.</p>
          </div>
          <div className="divide-y divide-amber-100">
            {maintenanceAwaitingApproval.map((job) => (
              <div key={job.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1a1a1a]">{job.title}</p>
                  <p className="text-sm text-[#8a7968]">{job.property.addressLine1}</p>
                  {job.quoteAmount && (
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                      Quote: {fmt(job.quoteAmount)}
                    </p>
                  )}
                </div>
                <ApproveMaintenanceButtons jobId={job.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Your Properties
          </h2>
        </div>
        {landlord.properties.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[#8a7968] text-sm">No properties linked to your account.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {landlord.properties.map((prop) => {
              const activeTenancy = prop.tenancies[0]
              const primaryTenant = activeTenancy?.tenants[0]?.tenant
              const openJobs = prop.maintenanceReqs.length

              return (
                <div key={prop.id} className="px-6 py-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {prop.addressLine1}
                      {prop.addressLine2 ? `, ${prop.addressLine2}` : ''}
                    </p>
                    <p className="text-xs text-[#8a7968]">{prop.area}, {prop.postcode}</p>

                    {activeTenancy ? (
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#8a7968]">
                        <span>
                          Tenant:{' '}
                          <span className="text-[#1a1a1a] font-medium">
                            {primaryTenant
                              ? `${primaryTenant.firstName} ${primaryTenant.lastName}`
                              : 'Multiple'}
                          </span>
                        </span>
                        <span>
                          Rent: <span className="text-[#1a1a1a] font-medium">{fmt(activeTenancy.rentAmount)}/mo</span>
                        </span>
                        <span>
                          Ends:{' '}
                          <span className={`font-medium ${tenancyEndColor(activeTenancy.endDate)}`}>
                            {fmtDate(activeTenancy.endDate)}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600 font-medium">Vacant</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {openJobs > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        {openJobs} open job{openJobs !== 1 ? 's' : ''}
                      </span>
                    )}
                    {openJobs === 0 && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        All clear
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent statements */}
      {landlord.statements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Recent Statements
            </h2>
            <Link href="/portal/landlord/statements" className="text-xs text-[#1A3D2B] hover:text-[#122B1E]">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {landlord.statements.map((stmt) => {
              const netPayout = stmt.rentReceived - stmt.feesDeducted - stmt.maintenanceCosts + stmt.otherCredits - stmt.otherDebits
              return (
                <div key={stmt.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      {format(new Date(stmt.periodStart), 'MMMM yyyy')}
                    </p>
                    <p className="text-xs text-[#8a7968]">
                      {fmtDate(stmt.periodStart)} – {fmtDate(stmt.periodEnd)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[#8a7968]">Net Payout</p>
                      <p className="font-semibold text-[#1a1a1a]">{fmt(netPayout)}</p>
                    </div>
                    {stmt.pdfUrl && (
                      <a
                        href={stmt.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] uppercase tracking-wide"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
