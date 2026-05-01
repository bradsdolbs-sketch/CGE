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
      tenant: { include: { user: true } },
      documents: { orderBy: { uploadedAt: 'asc' } },
    },
  })

  if (!application) notFound()

  return <ReferencingDetailClient application={application} />
}
