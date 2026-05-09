import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/renewals
 *
 * Checks all active tenancies expiring within 90 days and:
 *   1. Auto-marks them EXPIRING_SOON in the DB
 *   2. Creates an in-app notification for all agents
 *   3. Sends an email alert at 90/60/30/14 day thresholds
 *
 * Run daily. Called by external cron (x-cron-secret header) or manually by admin.
 */
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const now = new Date()
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  // Find active tenancies expiring within 90 days
  const expiring = await prisma.tenancy.findMany({
    where: {
      status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
      endDate: { gte: now, lte: in90Days },
    },
    include: {
      property: true,
      landlord: { include: { user: true } },
      tenants: {
        take: 1,
        include: { tenant: { include: { user: true } } },
      },
    },
  })

  if (expiring.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No tenancies expiring within 90 days' })
  }

  // Auto-update status to EXPIRING_SOON for tenancies within 60 days
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  await prisma.tenancy.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { gte: now, lte: in60Days },
    },
    data: { status: 'EXPIRING_SOON' },
  })

  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true, email: true, name: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const alertThresholds = [90, 60, 30, 14]
  let notificationsSent = 0
  let emailsSent = 0
  const errors: string[] = []

  for (const tenancy of expiring) {
    const property = tenancy.property
    const tenant = tenancy.tenants[0]?.tenant
    const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown tenant'
    const address = `${property.addressLine1}, ${property.area}`

    const daysUntil = Math.ceil(
      (new Date(tenancy.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    const urgency = daysUntil <= 14 ? '🔴' : daysUntil <= 30 ? '🟡' : '🔵'
    const title = `${urgency} Tenancy expiring in ${daysUntil} days — ${address}`
    const message = `${tenantName}'s tenancy at ${address} ends on ${new Date(tenancy.endDate).toLocaleDateString('en-GB')}. Renewal action required.`

    // In-app notifications (daily, deduped)
    for (const agent of agents) {
      try {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: agent.id,
            link: `/dashboard/tenancies/${tenancy.id}`,
            title,
            createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: agent.id,
              type: 'LEASE_EXPIRY',
              title,
              message,
              link: `/dashboard/tenancies/${tenancy.id}`,
              read: false,
            },
          })
          notificationsSent++
        }
      } catch (err) {
        errors.push(`Notification for ${address}: ${String(err)}`)
      }
    }

    // Emails only at key thresholds
    if (alertThresholds.includes(daysUntil)) {
      for (const agent of agents) {
        if (!agent.email) continue
        try {
          const urgencyColor = daysUntil <= 30 ? '#dc3545' : '#e07b3b'
          const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
            <h2 style="color:#1A3D2B;margin-bottom:4px;">Tenancy Renewal Alert</h2>
            <p style="color:#555;margin-top:0;">A tenancy is approaching its end date. Early renewal avoids void periods and secures continued revenue.</p>
            <div style="background:#fff8f0;border:2px solid ${urgencyColor};border-radius:8px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0;font-weight:700;color:${urgencyColor};">${address} — expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}</p>
              <p style="margin:6px 0 0;color:#555;font-size:13px;">End date: ${new Date(tenancy.endDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:6px 0;color:#888;width:40%;">Property</td><td style="padding:6px 0;font-weight:500;">${address}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Tenant</td><td style="padding:6px 0;">${tenantName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Landlord</td><td style="padding:6px 0;">${tenancy.landlord.firstName} ${tenancy.landlord.lastName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Current rent</td><td style="padding:6px 0;">£${tenancy.rentAmount.toLocaleString()} pcm</td></tr>
              <tr><td style="padding:6px 0;color:#888;">End date</td><td style="padding:6px 0;">${new Date(tenancy.endDate).toLocaleDateString('en-GB')}</td></tr>
            </table>
            <a href="${baseUrl}/dashboard/tenancies/${tenancy.id}" style="display:inline-block;background:#1A3D2B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">View Tenancy →</a>
          </body></html>`

          await sendEmail({
            to: agent.email,
            subject: `${urgency} Renewal needed in ${daysUntil} days — ${address}`,
            html,
          })
          emailsSent++
        } catch (err) {
          errors.push(`Email to ${agent.email} for ${address}: ${String(err)}`)
        }
      }
    }
  }

  // Rent review date alerts — flag tenancies with rentReviewDate within 30 days
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const rentReviews = await prisma.tenancy.findMany({
    where: {
      status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
      rentReviewDate: { gte: now, lte: in30Days },
    },
    include: { property: true },
  })

  for (const tenancy of rentReviews) {
    const address = `${tenancy.property.addressLine1}, ${tenancy.property.area}`
    const daysUntil = Math.ceil((new Date(tenancy.rentReviewDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const title = `Rent review due in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — ${address}`
    const link = `/dashboard/tenancies/${tenancy.id}`

    for (const agent of agents) {
      try {
        const existing = await prisma.notification.findFirst({
          where: { userId: agent.id, link, title, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: agent.id,
              type: 'GENERAL',
              title,
              message: `Rent review date for ${address} is ${new Date(tenancy.rentReviewDate!).toLocaleDateString('en-GB')}. Consider issuing a rent increase notice.`,
              link,
              read: false,
            },
          })
          notificationsSent++
        }
      } catch (err) {
        errors.push(`Rent review notification for ${address}: ${String(err)}`)
      }
    }
  }

  return NextResponse.json({
    processed: expiring.length,
    rentReviewsAlerted: rentReviews.length,
    notificationsSent,
    emailsSent,
    errors: errors.length ? errors : undefined,
  })
}
