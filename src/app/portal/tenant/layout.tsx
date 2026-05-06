import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TenantPortalShell from '@/components/portal/TenantPortalShell'

export default async function TenantPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/login')

  // Get open maintenance count for badge
  const tenant = await prisma.tenant.findUnique({
    where: { userId: session.user.id },
    include: {
      tenancies: {
        include: {
          tenancy: {
            include: {
              property: {
                include: {
                  maintenanceReqs: {
                    where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const openMaintenanceCount =
    tenant?.tenancies[0]?.tenancy?.property?.maintenanceReqs?.length ?? 0

  return (
    <TenantPortalShell
      user={{ name: session.user.name ?? '', email: session.user.email }}
      openMaintenanceCount={openMaintenanceCount}
    >
      {children}
    </TenantPortalShell>
  )
}
