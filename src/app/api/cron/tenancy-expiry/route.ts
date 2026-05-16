import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { addDays, startOfDay, endOfDay, differenceInDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/cron/tenancy-expiry
// Runs daily at 08:00 UTC via Vercel Cron
// Emails landlords when tenancies are expiring in 30, 60, or 90 days
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const THRESHOLDS = [30, 60, 90]

  const tenancies = await prisma.tenancy.findMany({
    where: {
      status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
      endDate: {
        gte: startOfDay(addDays(now, 29)),
        lte: endOfDay(addDays(now, 90)),
      },
    },
    include: {
      property: true,
      landlord: { include: { user: true } },
      tenants: {
        where: { isPrimary: true },
        include: { tenant: true },
        take: 1,
      },
    },
  })

  // Filter to exactly 30, 60, 90 days
  const alertTenancies = tenancies.filter(t => {
    const days = differenceInDays(new Date(t.endDate), startOfDay(now))
    return THRESHOLDS.includes(days)
  })

  // Group by landlord
  const byLandlord = new Map<string, { landlord: typeof tenancies[0]['landlord']; tenancies: typeof tenancies }>()
  for (const t of alertTenancies) {
    const ll = t.landlord
    if (!byLandlord.has(ll.id)) {
      byLandlord.set(ll.id, { landlord: ll, tenancies: [] })
    }
    byLandlord.get(ll.id)!.tenancies.push(t)
  }

  let sent = 0
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'

  for (const { landlord, tenancies: llTenancies } of byLandlord.values()) {
    const rows = llTenancies.map(t => {
      const days = differenceInDays(new Date(t.endDate), startOfDay(now))
      const tenant = t.tenants[0]?.tenant
      const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Tenant'
      const urgency = days <= 30 ? '#dc2626' : days <= 60 ? '#d97706' : '#1A3D2B'
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;">${t.property.addressLine1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;">${tenantName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;">${format(new Date(t.endDate), 'd MMM yyyy')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;color:${urgency};font-weight:600;">${days} days</td>
        </tr>
      `
    }).join('')

    await sendEmail({
      to: landlord.user.email,
      subject: `Tenancy notice: ${llTenancies.length} tenanc${llTenancies.length > 1 ? 'ies' : 'y'} expiring soon`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1A3D2B;">Tenancy Expiry Notice</h2>
          <p>Dear ${landlord.firstName},</p>
          <p>The following tenancies are approaching their end date. Please contact your agent to discuss renewal or re-letting options.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <thead>
              <tr style="background:#f5f2ee;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">Property</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">Tenant</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">End Date</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">Days Left</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p>Log in to your portal to view more details or send us a message.</p>
          <p style="margin:24px 0;">
            <a href="${baseUrl}/portal/landlord" style="background:#1A3D2B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Go to Your Portal →</a>
          </p>
          <p style="font-size:12px;color:#737373;">Central Gate Estates · <a href="mailto:hello@centralgateestates.com" style="color:#1A3D2B;">hello@centralgateestates.com</a></p>
        </div>
      `,
    }).catch(console.error)
    sent++
  }

  console.log(`[cron/tenancy-expiry] Sent ${sent} emails for ${alertTenancies.length} tenancies`)
  return NextResponse.json({ ok: true, sent, tenancies: alertTenancies.length })
}
