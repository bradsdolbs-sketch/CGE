import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/cron/rtr-expiry
 *
 * Checks all Right-to-Rent checks expiring in ≤60 days and:
 *   1. Creates an in-app notification for the agent
 *   2. Sends an email alert to agents
 *
 * Run this daily. Called by external cron (header x-cron-secret) or manually
 * by admin from the dashboard.
 *
 * Penalty for non-compliance: up to £20,000 per tenant.
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
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  // Find all RTR checks expiring in the next 60 days (not already expired long ago)
  const expiring = await prisma.rightToRentCheck.findMany({
    where: {
      expiryDate: {
        gte: now,          // not already expired
        lte: in60Days,     // within 60-day window
      },
    },
    include: {
      tenant: {
        include: {
          user: true,
          tenancies: {
            where: { tenancy: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER'] } } },
            include: { tenancy: { include: { property: true } } },
            take: 1,
          },
        },
      },
    },
  })

  if (expiring.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No RTR checks expiring in the next 60 days' })
  }

  // Get all admin/agent users to notify
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true, email: true, name: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  let notificationsSent = 0
  let emailsSent = 0
  const errors: string[] = []

  for (const check of expiring) {
    const tenant = check.tenant
    const tenantName = `${tenant.firstName} ${tenant.lastName}`
    const property = tenant.tenancies[0]?.tenancy?.property
    const propertyAddress = property
      ? `${property.addressLine1}, ${property.area}`
      : 'Unknown property'

    const daysUntil = Math.ceil(
      (new Date(check.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    const urgency = daysUntil <= 7 ? '⚠️ URGENT' : daysUntil <= 14 ? '🔴' : '🟡'
    const title = `${urgency} RTR check expiring — ${tenantName}`
    const message = `${tenantName}'s Right-to-Rent document expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'} (${new Date(check.expiryDate!).toLocaleDateString('en-GB')}). Property: ${propertyAddress}.`

    // Create in-app notifications for all agents
    for (const agent of agents) {
      try {
        // Avoid duplicate notifications: check if one already exists for this check today
        const existing = await prisma.notification.findFirst({
          where: {
            userId: agent.id,
            link: `/dashboard/tenants/${tenant.id}`,
            title,
            createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: agent.id,
              type: 'COMPLIANCE_EXPIRY',
              title,
              message,
              link: `/dashboard/tenants/${tenant.id}`,
              read: false,
            },
          })
          notificationsSent++
        }
      } catch (err) {
        errors.push(`Notification for ${tenantName}: ${String(err)}`)
      }
    }

    // Send email to all agents (only for 60/30/14/7/1 day thresholds to avoid daily spam)
    const alertThresholds = [60, 30, 14, 7, 1]
    if (alertThresholds.includes(daysUntil)) {
      for (const agent of agents) {
        if (!agent.email) continue
        try {
          const urgencyColor = daysUntil <= 14 ? '#dc3545' : '#e07b3b'
          const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
            <h2 style="color:#1A3D2B;margin-bottom:4px;">Right-to-Rent Alert</h2>
            <p style="color:#555;margin-top:0;">A tenant's RTR check is due for renewal. Non-compliance carries a civil penalty of up to <strong>£20,000</strong>.</p>
            <div style="background:#fff8f0;border:2px solid ${urgencyColor};border-radius:8px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0;font-weight:700;color:${urgencyColor};">${tenantName} — expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}</p>
              <p style="margin:6px 0 0;color:#555;font-size:13px;">Expiry: ${new Date(check.expiryDate!).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:6px 0;color:#888;width:40%;">Tenant</td><td style="padding:6px 0;font-weight:500;">${tenantName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Document</td><td style="padding:6px 0;">${check.documentType ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Property</td><td style="padding:6px 0;">${propertyAddress}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Original check</td><td style="padding:6px 0;">${new Date(check.checkDate).toLocaleDateString('en-GB')}</td></tr>
            </table>
            <a href="${baseUrl}/dashboard/tenants/${tenant.id}" style="display:inline-block;background:#1A3D2B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">View Tenant Record →</a>
          </body></html>`
          await sendEmail({
            to: agent.email,
            subject: `${urgency} RTR expiring in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — ${tenantName}`,
            html,
          })
          emailsSent++
        } catch (err) {
          errors.push(`Email to ${agent.email} for ${tenantName}: ${String(err)}`)
        }
      }
    }
  }

  return NextResponse.json({
    processed: expiring.length,
    notificationsSent,
    emailsSent,
    errors: errors.length ? errors : undefined,
  })
}
