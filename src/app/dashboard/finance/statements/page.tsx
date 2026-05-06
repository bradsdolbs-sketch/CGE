import { prisma } from '@/lib/prisma'
import StatementsClient from './StatementsClient'

export const dynamic = 'force-dynamic'

export default async function StatementsPage() {
  const [landlords, statements] = await Promise.all([
    prisma.landlord.findMany({
      include: { user: true },
      orderBy: { lastName: 'asc' },
    }),
    prisma.landlordStatement.findMany({
      include: { landlord: { include: { user: true } } },
      orderBy: { periodStart: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Landlord Statements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate and view monthly statements</p>
      </div>
      <StatementsClient landlords={landlords} statements={statements} />
    </div>
  )
}
