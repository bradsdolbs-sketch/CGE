import { prisma } from '@/lib/prisma'
import ContractorJobClient from './ContractorJobClient'

export const dynamic = 'force-dynamic'

interface JobData {
  id: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  notes: string | null
  propertyAddress: string
  contractorName: string | null
  contractorCompany: string | null
  expired: boolean
  contractorNotifiedAt: string | null
  contractorAcceptedAt: string | null
  contractorDeclinedAt: string | null
  contractorDeclineReason: string | null
  contractorCompletedAt: string | null
  contractorCompletionNote: string | null
  contractorCompletionPhotos: string[]
  contractorReportUrl: string | null
}

async function getJob(token: string): Promise<JobData | null> {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { contractorToken: token },
    include: {
      property: { select: { addressLine1: true, area: true } },
      contractor: { select: { name: true, companyName: true } },
    },
  })

  if (!request) return null

  return {
    id: request.id,
    title: request.title,
    description: request.description,
    priority: request.priority,
    status: request.status,
    category: request.category,
    notes: request.notes,
    propertyAddress: `${request.property.addressLine1}, ${request.property.area}`,
    contractorName: request.contractor?.name ?? null,
    contractorCompany: request.contractor?.companyName ?? null,
    expired: !!(request.contractorTokenExpiry && request.contractorTokenExpiry < new Date()),
    contractorNotifiedAt: request.contractorNotifiedAt?.toISOString() ?? null,
    contractorAcceptedAt: request.contractorAcceptedAt?.toISOString() ?? null,
    contractorDeclinedAt: request.contractorDeclinedAt?.toISOString() ?? null,
    contractorDeclineReason: request.contractorDeclineReason,
    contractorCompletedAt: request.contractorCompletedAt?.toISOString() ?? null,
    contractorCompletionNote: request.contractorCompletionNote,
    contractorCompletionPhotos: request.contractorCompletionPhotos,
    contractorReportUrl: request.contractorReportUrl,
  }
}

export default async function JobPage({ params }: { params: { token: string } }) {
  const job = await getJob(params.token)

  if (!job) {
    return (
      <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-500 text-sm">This job link is invalid. Please check the email you received or contact Central Gate Estates.</p>
        </div>
      </main>
    )
  }

  if (job.expired && !job.contractorAcceptedAt && !job.contractorDeclinedAt && !job.contractorCompletedAt) {
    return (
      <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500 text-sm">This job link has expired. Please contact Central Gate Estates to request a new one.</p>
          <p className="mt-4 text-sm text-gray-400">📧 hello@centralgateestates.com</p>
        </div>
      </main>
    )
  }

  return <ContractorJobClient job={job} token={params.token} />
}
