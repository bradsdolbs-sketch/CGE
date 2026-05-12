import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReferencingDetailClient from './ReferencingDetailClient'

export const dynamic = 'force-dynamic'

export default async function ReferencingDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) redirect('/login')

  const application = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: {
      tenant: {
        include: {
          user: true,
          tenancies: {
            include: { tenancy: { include: { guarantors: true } } },
            take: 1,
            orderBy: { tenancy: { createdAt: 'desc' } },
          },
        },
      },
      documents: { orderBy: { uploadedAt: 'asc' } },
    },
  })

  if (!application) notFound()

  const guarantors = application.tenant.tenancies[0]?.tenancy.guarantors ?? []

  return <ReferencingDetailClient application={application} guarantors={guarantors} />
}
