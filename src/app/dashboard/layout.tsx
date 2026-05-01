import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login?callbackUrl=/dashboard')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT') {
    redirect('/login')
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })

  return (
    <DashboardShell
      user={{ name: session.user.name ?? '', email: session.user.email, role: session.user.role }}
      unreadNotifications={unreadCount}
    >
      {children}
    </DashboardShell>
  )
}
