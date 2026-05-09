import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, Plus, CheckCircle, Clock, Edit3 } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  AGENT_REVIEW: 'Agent Review',
  PENDING_TENANT_SIGNATURE: 'Awaiting Tenant',
  PENDING_LANDLORD_SIGNATURE: 'Awaiting Landlord',
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

export default async function AgreementsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const agreements = await prisma.agreement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      enquiry: {
        include: {
          property: { select: { addressLine1: true, area: true } },
        },
      },
      tenancy: {
        include: {
          property: { select: { addressLine1: true, area: true } },
        },
      },
    },
  })

  function getPropertyLabel(a: typeof agreements[0]) {
    const prop = a.enquiry?.property ?? a.tenancy?.property
    if (!prop) return 'No property'
    return `${prop.addressLine1}, ${prop.area}`
  }

  const pending = agreements.filter(a =>
    ['DRAFT', 'AGENT_REVIEW', 'PENDING_TENANT_SIGNATURE', 'PENDING_LANDLORD_SIGNATURE'].includes(a.status)
  )
  const signed = agreements.filter(a => a.status === 'FULLY_SIGNED')
  const other = agreements.filter(a => a.status === 'CANCELLED')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Agreements</h1>
          <p className="text-sm text-[#8a7968] mt-1">Tenancy agreement drafts and signing status</p>
        </div>
      </div>

      {agreements.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-[#1a1a1a] font-medium">No agreements yet</p>
          <p className="text-sm text-[#8a7968] mt-1">
            Agreements are generated from the referencing pipeline after landlord approval.
          </p>
        </div>
      )}

      {/* Active */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8a7968] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> In Progress ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(a => (
              <Link
                key={a.id}
                href={`/dashboard/agreements/${a.id}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition group"
              >
                <div className="w-9 h-9 bg-[#1A3D2B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit3 className="w-4 h-4 text-[#1A3D2B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1a1a1a] group-hover:text-[#1A3D2B] transition truncate">
                    {getPropertyLabel(a)}
                  </p>
                  <p className="text-xs text-[#8a7968]">
                    Created {format(new Date(a.createdAt), 'd MMM yyyy')}
                    {a.tenantSignedAt ? ` · Tenant signed ${format(new Date(a.tenantSignedAt), 'd MMM')}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_CLASS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Signed */}
      {signed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8a7968] uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Fully Signed ({signed.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Signed</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Landlord</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signed.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/agreements/${a.id}`} className="font-medium text-[#1a1a1a] hover:text-[#1A3D2B] transition">
                        {getPropertyLabel(a)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#8a7968] text-xs">
                      {a.landlordSignedAt ? format(new Date(a.landlordSignedAt), 'd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#8a7968]">{a.tenantSignedName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#8a7968]">{a.landlordSignedName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {a.finalUrl ? (
                        <a
                          href={a.finalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[#1A3D2B] hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancelled */}
      {other.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8a7968] uppercase tracking-wider mb-3">Cancelled</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8a7968]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {other.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/agreements/${a.id}`} className="font-medium text-[#1a1a1a] hover:text-[#1A3D2B] transition">
                        {getPropertyLabel(a)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#8a7968] text-xs">{format(new Date(a.createdAt), 'd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_CLASS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
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
