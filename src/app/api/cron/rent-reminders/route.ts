import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRentArrearsTenantEmail, sendRentArrearsLandlordEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Step 1: Batch-flag all PENDING overdue payments as LATE
  const { count: lateCount } = await prisma.rentPayment.updateMany({
    where: { dueDate: { lt: today }, status: 'PENDING' },
    data: { status: 'LATE' },
  })

  // Step 2: Fetch all overdue unpaid/partial payments (LATE + PARTIAL) for notifications & emails
  const overduePayments = await prisma.rentPayment.findMany({
    where: {
      dueDate: { lt: today },
      status: { in: ['LATE', 'PARTIAL'] },
    },
    include: {
      tenancy: {
        include: {
          property: true,
          landlord: { include: { user: true } },
          tenants: {
            where: { isPrimary: true },
            include: { tenant: { include: { user: true } } },
            take: 1,
          },
        },
      },
    },
  })

  if (overduePayments.length === 0) {
    return NextResponse.json({ lateCount, processed: 0, emailsSent: 0, message: 'No overdue payments' })
  }

  // Group payments by tenancy so we send one notification + email per tenancy, not per payment
  const byTenancy = new Map<string, typeof overduePayments>()
  for (const payment of overduePayments) {
    const id = payment.tenancyId
    if (!byTenancy.has(id)) byTenancy.set(id, [])
    byTenancy.get(id)!.push(payment)
  }

  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true, email: true, name: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let emailsSent = 0
  const errors: string[] = []

  for (const [, payments] of byTenancy) {
    const { tenancy } = payments[0]
    const primaryTenantLink = tenancy.tenants[0]
    const tenant = primaryTenantLink?.tenant
    const landlord = tenancy.landlord

    const totalOwed = payments.reduce((sum, p) => sum + (p.amount - p.amountPaid), 0)
    const oldestDue = payments.reduce((oldest, p) =>
      new Date(p.dueDate) < new Date(oldest.dueDate) ? p : oldest
    )
    const daysOverdue = Math.floor((Date.now() - new Date(oldestDue.dueDate).getTime()) / 86400000)
    const address = `${tenancy.property.addressLine1}, ${tenancy.property.area}`
    const tenantLink = `/dashboard/tenancies/${tenancy.id}`

    // In-app notification for agents — deduplicated per tenancy per day
    for (const agent of agents) {
      try {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: agent.id,
            type: 'RENT_ARREARS',
            link: tenantLink,
            createdAt: { gte: todayStart },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: agent.id,
              type: 'RENT_ARREARS',
              title: `Rent arrears — ${address}`,
              message: `£${totalOwed.toLocaleString()} overdue (${daysOverdue} day${daysOverdue === 1 ? '' : 's'}). ${payments.length} payment${payments.length === 1 ? '' : 's'} outstanding.`,
              link: tenantLink,
              read: false,
            },
          })
        }
      } catch (err) {
        errors.push(`Notification for ${address}: ${String(err)}`)
      }
    }

    // Emails to tenant and landlord
    try {
      if (tenant?.user?.email) {
        await sendRentArrearsTenantEmail(
          tenant.user.email,
          `${tenant.firstName} ${tenant.lastName}`,
          tenancy.property.addressLine1,
          totalOwed,
          daysOverdue,
          `${baseUrl}/portal/tenant`,
        )
        emailsSent++
      }
      if (landlord?.user?.email) {
        await sendRentArrearsLandlordEmail(
          landlord.user.email,
          `${landlord.firstName} ${landlord.lastName}`,
          tenancy.property.addressLine1,
          tenant ? `${tenant.firstName} ${tenant.lastName}` : 'The tenant',
          totalOwed,
          daysOverdue,
        )
        emailsSent++
      }
    } catch (err) {
      errors.push(`Email for ${address}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    lateCount,
    processed: byTenancy.size,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
