import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'User Management' }

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    include: {
      landlordRecord: { select: { id: true } },
      tenantRecord: { select: { id: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} users in the system</p>
        </div>
      </div>
      <UsersClient users={users} currentUserId={session.user.id} />
    </div>
  )
}
