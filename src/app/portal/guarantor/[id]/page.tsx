import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import GuarantorPortalForm from './GuarantorPortalForm'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
  searchParams: { token?: string }
}

export default async function GuarantorPortalPage({ params, searchParams }: Props) {
  const { token } = searchParams

  if (!token) {
    return (
      <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-semibold">Invalid link</p>
          <p className="text-sm text-gray-500 mt-2">This link is missing an access token. Please use the link from your invitation email.</p>
        </div>
      </main>
    )
  }

  const guarantor = await prisma.guarantor.findUnique({
    where: { id: params.id },
    include: {
      tenancy: {
        include: {
          tenants: { include: { tenant: { select: { firstName: true, lastName: true } } }, where: { isPrimary: true }, take: 1 },
          property: { select: { addressLine1: true, addressLine2: true } },
        },
      },
    },
  })

  if (!guarantor || guarantor.portalToken !== token) notFound()
  if (guarantor.portalTokenExpiry && guarantor.portalTokenExpiry < new Date()) {
    return (
      <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-amber-600 font-semibold">Link expired</p>
          <p className="text-sm text-gray-500 mt-2">This invitation link has expired. Please contact your agent to request a new one.</p>
        </div>
      </main>
    )
  }

  const primaryTenant = guarantor.tenancy.tenants[0]?.tenant
  const tenantName = primaryTenant ? `${primaryTenant.firstName} ${primaryTenant.lastName}` : 'the tenant'
  const prop = guarantor.tenancy.property
  const propertyAddress = prop ? [prop.addressLine1, prop.addressLine2].filter(Boolean).join(', ') : 'the property'

  return (
    <main className="min-h-screen bg-[#f5f2ee]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <ShieldCheck size={24} className="text-[#1A3D2B]" />
          <div>
            <p className="font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>CGE Guarantor Application</p>
            <p className="text-xs text-gray-500">For {tenantName} — {propertyAddress}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {guarantor.guarantorRefStatus === 'UNDER_REVIEW' || guarantor.guarantorRefStatus === 'PASSED' || guarantor.guarantorRefStatus === 'FAILED' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
            <ShieldCheck size={40} className="text-[#1A3D2B] mx-auto" />
            <p className="font-bold text-[#1a1a1a] text-xl">Application submitted</p>
            <p className="text-gray-500 text-sm">Thank you, {guarantor.firstName}. We've received your guarantor application and will be in touch shortly.</p>
          </div>
        ) : (
          <GuarantorPortalForm
            guarantorId={params.id}
            token={token}
            tenantName={tenantName}
            propertyAddress={propertyAddress}
            initial={{
              dob: guarantor.dob ? new Date(guarantor.dob).toISOString().substring(0, 10) : '',
              niNumber: guarantor.niNumber ?? '',
              addressLine1: guarantor.addressLine1 ?? '',
              postcode: guarantor.postcode ?? '',
              guarantorEmployerName: guarantor.guarantorEmployerName ?? '',
              guarantorEmployerEmail: guarantor.guarantorEmployerEmail ?? '',
              guarantorJobTitle: guarantor.guarantorJobTitle ?? '',
              guarantorContractType: guarantor.guarantorContractType ?? 'PERMANENT',
              guarantorEmploymentStart: guarantor.guarantorEmploymentStart
                ? new Date(guarantor.guarantorEmploymentStart).toISOString().substring(0, 10)
                : '',
              annualSalary: guarantor.annualSalary ? String(guarantor.annualSalary) : '',
            }}
          />
        )}
      </div>
    </main>
  )
}
