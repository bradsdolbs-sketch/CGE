import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, ClipboardCheck } from 'lucide-react'
import StartReferencingModal from './StartReferencingModal'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Referencing' }

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

export default async function ReferencingPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const [applications, tenants] = await Promise.all([
    prisma.tenantReferenceApplication.findMany({
      include: { tenant: { include: { user: true } }, documents: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.findMany({
      include: {
        user: true,
        referenceApplications: {
          where: { status: { notIn: ['PASSED', 'FAILED'] } },
          select: { id: true },
        },
      },
      orderBy: { lastName: 'asc' },
    }),
  ])

  const pending   = applications.filter((a) => a.status === 'PENDING_SUBMISSION').length
  const active    = applications.filter((a) => ['IN_PROGRESS','AWAITING_EMPLOYER','AWAITING_LANDLORD','UNDER_REVIEW'].includes(a.status)).length
  const completed = applications.filter((a) => ['PASSED','CONDITIONAL','FAILED'].includes(a.status)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Referencing</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending} pending · {active} in progress · {completed} completed
          </p>
        </div>
        <StartReferencingModal tenants={tenants} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ['Awaiting submission', pending, 'text-gray-600'],
          ['In progress', active, 'text-blue-600'],
          ['Completed', completed, 'text-green-600'],
        ].map(([label, val, cls]) => (
          <div key={String(label)} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-16 text-center">
          <ClipboardCheck size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-500">No referencing applications yet</p>
          <p className="text-sm text-gray-400 mt-1">Start one for a tenant using the button above</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Documents</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Started</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1a1a1a]">{app.tenant.firstName} {app.tenant.lastName}</p>
                      <p className="text-xs text-gray-400">{app.tenant.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${STATUS_STYLE[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {app.affordabilityScore !== null ? (
                        <span className={`font-bold text-sm ${app.affordabilityScore >= 70 ? 'text-green-600' : app.affordabilityScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {app.affordabilityScore}/100
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{app.documents.length} uploaded</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {format(new Date(app.createdAt), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/referencing/${app.id}`} className="text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] transition">
                        View →
                      </Link>
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
