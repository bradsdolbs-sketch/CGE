import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const THRESHOLDS = [30, 14, 7]

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function urgencyEmoji(days: number) {
  return days <= 7 ? '🔴' : days <= 14 ? '🟠' : '🟡'
}

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
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [expiringCerts, expiringRTR] = await Promise.all([
    prisma.complianceItem.findMany({
      where: { expiryDate: { gte: now, lte: in30Days } },
      include: { property: true },
    }),
    prisma.rightToRentCheck.findMany({
      where: { expiryDate: { gte: now, lte: in30Days } },
      include: { tenant: { include: { user: true } } },
    }),
  ])

  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true, email: true, name: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  let notificationsSent = 0
  let emailsSent = 0
  const errors: string[] = []

  // ── Property compliance certs ──────────────────────────────────────────────
  for (const cert of expiringCerts) {
    const days = daysUntil(cert.expiryDate!)
    const emoji = urgencyEmoji(days)
    const certLabel = cert.type.replace(/_/g, ' ')
    const address = `${cert.property.addressLine1}, ${cert.property.area}`
    const title = `${emoji} ${certLabel} expiring in ${days} day${days === 1 ? '' : 's'} — ${address}`
    const link = `/dashboard/compliance`

    for (const agent of agents) {
      try {
        const existing = await prisma.notification.findFirst({
          where: { userId: agent.id, type: 'COMPLIANCE_EXPIRY', title, createdAt: { gte: todayStart } },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: agent.id,
              type: 'COMPLIANCE_EXPIRY',
              title,
              message: `${certLabel} certificate for ${address} expires on ${new Date(cert.expiryDate!).toLocaleDateString('en-GB')}. Arrange renewal to stay legally compliant.`,
              link,
              read: false,
            },
          })
          notificationsSent++
        }
      } catch (err) {
        errors.push(`Notification for ${address} ${cert.type}: ${String(err)}`)
      }
    }

    // Email at key thresholds only
    if (THRESHOLDS.includes(days)) {
      for (const agent of agents) {
        if (!agent.email) continue
        try {
          const urgencyColor = days <= 7 ? '#dc3545' : days <= 14 ? '#e07b3b' : '#e6a817'
          const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
            <h2 style="color:#1A3D2B;margin-bottom:4px;">Compliance Alert</h2>
            <p style="color:#555;margin-top:0;">A certificate is approaching its expiry date and may need immediate renewal.</p>
            <div style="background:#fff8f0;border:2px solid ${urgencyColor};border-radius:8px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0;font-weight:700;color:${urgencyColor};">${certLabel} — expires in ${days} day${days === 1 ? '' : 's'}</p>
              <p style="margin:6px 0 0;color:#555;font-size:13px;">${address}</p>
            </div>
            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:6px 0;color:#888;width:40%;">Certificate type</td><td style="padding:6px 0;font-weight:500;">${certLabel}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Property</td><td style="padding:6px 0;">${address}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Expiry date</td><td style="padding:6px 0;">${new Date(cert.expiryDate!).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            </table>
            <a href="${baseUrl}/dashboard/compliance" style="display:inline-block;background:#1A3D2B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">View Compliance →</a>
          </body></html>`
          await sendEmail({ to: agent.email, subject: `${emoji} ${certLabel} expires in ${days} days — ${address}`, html })
          emailsSent++
        } catch (err) {
          errors.push(`Email to ${agent.email} for ${address}: ${String(err)}`)
        }
      }
    }
  }

  // ── Right to Rent checks ───────────────────────────────────────────────────
  for (const rtr of expiringRTR) {
    const days = daysUntil(rtr.expiryDate!)
    const emoji = urgencyEmoji(days)
    const tenantName = `${rtr.tenant.firstName} ${rtr.tenant.lastName}`
    const title = `${emoji} Right to Rent expiring in ${days} day${days === 1 ? '' : 's'} — ${tenantName}`
    const link = `/dashboard/tenants`

    for (const agent of agents) {
      try {
        const existing = await prisma.notification.findFirst({
          where: { userId: agent.id, type: 'COMPLIANCE_EXPIRY', title, createdAt: { gte: todayStart } },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: agent.id,
              type: 'COMPLIANCE_EXPIRY',
              title,
              message: `Right to Rent document for ${tenantName} (${rtr.documentType}) expires ${new Date(rtr.expiryDate!).toLocaleDateString('en-GB')}. Re-check required.`,
              link,
              read: false,
            },
          })
          notificationsSent++
        }
      } catch (err) {
        errors.push(`RTR notification for ${tenantName}: ${String(err)}`)
      }
    }
  }

  return NextResponse.json({
    certsChecked: expiringCerts.length,
    rtrChecked: expiringRTR.length,
    notificationsSent,
    emailsSent,
    errors: errors.length ? errors : undefined,
  })
}
