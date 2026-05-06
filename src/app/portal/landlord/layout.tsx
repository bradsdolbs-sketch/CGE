import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import LandlordPortalShell from '@/components/portal/LandlordPortalShell'

export default async function LandlordPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'LANDLORD') redirect('/login')

  return (
    <LandlordPortalShell
      user={{ name: session.user.name ?? '', email: session.user.email }}
    >
      {children}
    </LandlordPortalShell>
  )
}
