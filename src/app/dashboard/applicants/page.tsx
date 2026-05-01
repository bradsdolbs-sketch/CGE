import { prisma } from '@/lib/prisma'
import ApplicantsClient from './ApplicantsClient'

export const dynamic = 'force-dynamic'

const STAGES = ['ENQUIRY', 'VIEWING_BOOKED', 'VIEWING_DONE', 'OFFER_MADE', 'REFERENCING', 'LET_AGREED', 'MOVED_IN']

export default async function ApplicantsPage() {
  const enquiries = await prisma.enquiry.findMany({
    where: { stage: { notIn: ['REJECTED'] } },
    include: { property: true, viewings: { take: 1, orderBy: { scheduledAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Applicant Pipeline</h1>
        <p className="text-sm text-gray-500 mt-0.5">{enquiries.length} active applicants</p>
      </div>
      <ApplicantsClient enquiries={enquiries} stages={STAGES} />
    </div>
  )
}
