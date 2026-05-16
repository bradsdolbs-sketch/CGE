import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { addDays, startOfDay, endOfDay, differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/cron/compliance-alerts
// Runs daily at 08:00 UTC via Vercel Cron
// Emails landlords when certificates expire in 7, 30, or 60 days
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const THRESHOLDS = [7, 30, 60]

  // Fetch all items expiring within 60 days
  const items = await prisma.complianceItem.findMany({
    where: {
      expiryDate: {
        gte: startOfDay(now),
        lte: endOfDay(addDays(now, 60)),
      },
    },
    include: {
      property: {
        include: {
          landlord: { include: { user: true } },
        },
      },
    },
  })

  // Filter to items at exactly 7, 30, or 60 days
  const alertItems = items.filter(item => {
    const days = differenceInDays(new Date(item.expiryDate!), startOfDay(now))
    return THRESHOLDS.includes(days)
  })

  // Group by landlord
  const byLandlord = new Map<string, { landlord: typeof items[0]['property']['landlord']; items: typeof items }>()
  for (const item of alertItems) {
    const ll = item.property.landlord
    if (!byLandlord.has(ll.id)) {
      byLandlord.set(ll.id, { landlord: ll, items: [] })
    }
    byLandlord.get(ll.id)!.items.push(item)
  }

  const certLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  let sent = 0
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'

  for (const { landlord, items: llItems } of byLandlord.values()) {
    const rows = llItems.map(item => {
      const days = differenceInDays(new Date(item.expiryDate!), startOfDay(now))
      const urgency = days <= 7 ? '#dc2626' : days <= 30 ? '#d97706' : '#1A3D2B'
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;">${item.property.addressLine1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;">${certLabel(item.type)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f2ee;color:${urgency};font-weight:600;">${days} day${days === 1 ? '' : 's'}</td>
        </tr>
      `
    }).join('')

    await sendEmail({
      to: landlord.user.email,
      subject: `Action required: ${llItems.length} compliance certificate${llItems.length > 1 ? 's' : ''} expiring soon`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1A3D2B;">Compliance Certificates Expiring Soon</h2>
          <p>Dear ${landlord.firstName},</p>
          <p>The following compliance certificates for your properties require renewal:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <thead>
              <tr style="background:#f5f2ee;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">Property</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">Certificate</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8a7968;">Days Left</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p>Your agent will arrange renewals on your behalf if you are on full management. Please contact us if you have any questions.</p>
          <p style="margin:24px 0;">
            <a href="${baseUrl}/portal/landlord/compliance" style="background:#1A3D2B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Compliance →</a>
          </p>
          <p style="font-size:12px;color:#737373;">Central Gate Estates · <a href="mailto:hello@centralgateestates.com" style="color:#1A3D2B;">hello@centralgateestates.com</a></p>
        </div>
      `,
    }).catch(console.error)
    sent++
  }

  console.log(`[cron/compliance-alerts] Sent ${sent} emails for ${alertItems.length} items`)
  return NextResponse.json({ ok: true, sent, items: alertItems.length })
}
