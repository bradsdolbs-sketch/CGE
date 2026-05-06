import { prisma } from '@/lib/prisma'
import RentManagementClient from './RentManagementClient'

export const dynamic = 'force-dynamic'

export default async function RentPage() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const payments = await prisma.rentPayment.findMany({
    include: {
      tenancy: {
        include: {
          property: true,
          tenants: {
            where: { isPrimary: true },
            include: { tenant: { include: { user: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { dueDate: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Rent Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track payments and manage arrears</p>
      </div>
      <RentManagementClient payments={payments} initialMonth={currentMonth} initialYear={currentYear} />
    </div>
  )
}
