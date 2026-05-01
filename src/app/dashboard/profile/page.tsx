import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  })

  if (!user) redirect('/login')

  return <ProfileClient user={user} />
}
