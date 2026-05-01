import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'

export const metadata = { title: 'My Account' }

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">My Account</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your password</p>
      </div>
      <AccountClient user={{ id: session.user.id, name: session.user.name ?? '', email: session.user.email ?? '' }} />
    </div>
  )
}
