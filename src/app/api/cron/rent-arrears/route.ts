import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRentArrearsLandlordEmail } from '@/lib/email'
import { differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/cron/rent-arrears
// Runs Mon–Fri at 09:00 UTC via Vercel Cron
// Emails landlords about overdue rent and creates agent notifications
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const latePayments = await prisma.rentPayment.findMany({
    where: {
      status: { in: ['LATE', 'PARTIAL'] },
      dueDate: { lt: now },
    },
    include: {
      tenancy: {
        include: {
          property: true,
          landlord: { include: { user: true } },
          tenants: {
            where: { isPrimary: true },
            include: { tenant: true },
            take: 1,
          },
        },
      },
    },
  })

  if (latePayments.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, payments: 0 })
  }

  // Group by landlord
  const byLandlord = new Map<string, {
    landlord: typeof latePayments[0]['tenancy']['landlord']
    payments: typeof latePayments
  }>()

  for (const p of latePayments) {
    const ll = p.tenancy.landlord
    if (!byLandlord.has(ll.id)) {
      byLandlord.set(ll.id, { landlord: ll, payments: [] })
    }
    byLandlord.get(ll.id)!.payments.push(p)
  }

  // Notify agents
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true },
  })

  const totalOwed = latePayments.reduce((s, p) => s + (p.amount - p.amountPaid), 0)
  if (agents.length > 0) {
    await prisma.notification.createMany({
      data: agents.map(a => ({
        userId: a.id,
        type: 'GENERAL' as const,
        title: `Rent arrears: ${latePayments.length} overdue payment${latePayments.length > 1 ? 's' : ''}`,
        message: `Total outstanding: £${totalOwed.toLocaleString()} across ${byLandlord.size} landlord${byLandlord.size > 1 ? 's' : ''}`,
        link: '/dashboard/finance/rent?status=LATE',
      })),
      skipDuplicates: true,
    })
  }

  // Email each landlord (only for payments >3 days overdue to avoid noise)
  let sent = 0
  for (const { landlord, payments } of byLandlord.values()) {
    // Only email if at least one payment is >3 days overdue
    const urgentPayments = payments.filter(p =>
      differenceInDays(now, new Date(p.dueDate)) >= 3
    )
    if (urgentPayments.length === 0) continue

    // Use the first (most overdue) payment for the email
    const worst = urgentPayments.sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0]

    const daysOverdue = differenceInDays(now, new Date(worst.dueDate))
    const tenant = worst.tenancy.tenants[0]?.tenant
    const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Your tenant'
    const amountOwed = worst.amount - worst.amountPaid
    const propertyAddress = `${worst.tenancy.property.addressLine1}, ${worst.tenancy.property.area}`

    await sendRentArrearsLandlordEmail(
      landlord.user.email,
      landlord.firstName,
      propertyAddress,
      tenantName,
      amountOwed,
      daysOverdue,
    ).catch(console.error)
    sent++
  }

  console.log(`[cron/rent-arrears] ${latePayments.length} late payments, ${sent} landlord emails sent`)
  return NextResponse.json({ ok: true, sent, payments: latePayments.length })
}
