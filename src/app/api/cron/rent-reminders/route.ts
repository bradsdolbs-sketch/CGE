import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRentArrearsTenantEmail, sendRentArrearsLandlordEmail } from '@/lib/email'

// Can be called manually from the dashboard (POST) or by an external cron (with secret header)
export async function POST(req: NextRequest) {
  // Allow either authenticated agent OR cron secret header
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

  // Find all overdue unpaid payments
  const overduePayments = await prisma.rentPayment.findMany({
    where: {
      dueDate: { lt: today },
      status: { in: ['PENDING', 'PARTIAL'] },
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
    return NextResponse.json({ processed: 0, message: 'No overdue payments found' })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  let emailsSent = 0
  const errors: string[] = []

  for (const payment of overduePayments) {
    const { tenancy } = payment
    const primaryTenantLink = tenancy.tenants[0]
    const tenant = primaryTenantLink?.tenant
    const landlord = tenancy.landlord

    const daysOverdue = Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / 86400000)
    const amountOwed = payment.amount - payment.amountPaid

    try {
      // Mark as LATE
      await prisma.rentPayment.update({
        where: { id: payment.id },
        data: { status: 'LATE' },
      })

      // Email tenant
      if (tenant?.user?.email) {
        await sendRentArrearsTenantEmail(
          tenant.user.email,
          `${tenant.firstName} ${tenant.lastName}`,
          tenancy.property.addressLine1,
          amountOwed,
          daysOverdue,
          `${baseUrl}/portal/tenant`,
        )
        emailsSent++
      }

      // Email landlord
      if (landlord?.user?.email) {
        await sendRentArrearsLandlordEmail(
          landlord.user.email,
          `${landlord.firstName} ${landlord.lastName}`,
          tenancy.property.addressLine1,
          tenant ? `${tenant.firstName} ${tenant.lastName}` : 'The tenant',
          amountOwed,
          daysOverdue,
        )
        emailsSent++
      }

      // Create in-app notification for agents
      const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'AGENT'] } } })
      for (const agent of agents) {
        await prisma.notification.create({
          data: {
            userId: agent.id,
            type: 'RENT_ARREARS',
            title: 'Rent Arrears',
            message: `${tenancy.property.addressLine1} — £${amountOwed.toLocaleString()} overdue (${daysOverdue} days). Landlord & tenant have been emailed.`,
            link: `/dashboard/finance/rent`,
          },
        })
      }
    } catch (err) {
      errors.push(`Payment ${payment.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return NextResponse.json({
    processed: overduePayments.length,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
