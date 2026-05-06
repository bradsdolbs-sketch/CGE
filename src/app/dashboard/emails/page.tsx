import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Mail, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Email Log' }

export default async function EmailsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const emails = await prisma.emailLog.findMany({
    include: { sentBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Email Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">All outbound emails sent by the system</p>
      </div>

      {emails.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-16 text-center">
          <Mail size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No emails sent yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Sent by</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1a1a1a] truncate max-w-[180px]">{email.toName ?? email.toEmail}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{email.toEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[240px]">{email.subject}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{email.sentBy?.name ?? 'System'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {format(new Date(email.createdAt), 'd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      {email.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={13} /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle size={13} /> {email.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            Last {emails.length} emails
          </div>
        </div>
      )}
    </div>
  )
}
