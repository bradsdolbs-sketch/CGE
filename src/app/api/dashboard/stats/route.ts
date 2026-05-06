import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, startOfDay, subDays } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in30Days = addDays(now, 30)
  const in60Days = addDays(now, 60)
  const sevenDaysAgo = subDays(now, 7)

  const [
    totalProperties,
    vacantProperties,
    rentRollResult,
    arrearsResult,
    openMaintenanceJobs,
    expiringCompliance30,
    newEnquiriesThisWeek,
    viewingsThisWeek,
    upcomingRenewals30,
    upcomingRenewals60,
  ] = await Promise.all([
    prisma.property.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.property.count({ where: { status: 'AVAILABLE' } }),
    prisma.tenancy.aggregate({
      _sum: { rentAmount: true },
      where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
    }),
    prisma.rentPayment.aggregate({
      _sum: { amount: true, amountPaid: true },
      where: { status: { in: ['LATE', 'PARTIAL'] } },
    }),
    prisma.maintenanceRequest.count({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    }),
    prisma.complianceItem.count({
      where: { expiryDate: { lte: addDays(now, 30), gte: now } },
    }),
    prisma.enquiry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.viewing.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.tenancy.count({
      where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] }, endDate: { gte: now, lte: in30Days } },
    }),
    prisma.tenancy.count({
      where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] }, endDate: { gte: now, lte: in60Days } },
    }),
  ])

  const totalRentRoll = rentRollResult._sum.rentAmount ?? 0
  const arrearsOwed = arrearsResult._sum.amount ?? 0
  const arrearsPaid = arrearsResult._sum.amountPaid ?? 0
  const arrearsTotal = Math.max(0, arrearsOwed - arrearsPaid)

  return NextResponse.json({
    totalProperties,
    vacantProperties,
    totalRentRoll,
    arrearsTotal,
    upcomingRenewals30,
    upcomingRenewals60,
    openMaintenanceJobs,
    newEnquiriesThisWeek,
    viewingsThisWeek,
    expiringCompliance: expiringCompliance30,
  })
}
