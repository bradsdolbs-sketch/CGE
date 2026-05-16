import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { subject, message } = await req.json()
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const landlord = await prisma.landlord.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    })
    if (!landlord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const landlordName = `${landlord.firstName} ${landlord.lastName}`

    // Notify all agents via in-app notification
    const agents = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
      select: { id: true },
    })

    if (agents.length > 0) {
      await prisma.notification.createMany({
        data: agents.map(a => ({
          userId: a.id,
          type: 'GENERAL' as const,
          title: `Landlord message: ${subject}`,
          message: `${landlordName}: ${message.slice(0, 200)}${message.length > 200 ? '…' : ''}`,
          link: '/dashboard/landlords',
        })),
      })
    }

    // Email the agency
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'
    await sendEmail({
      to: 'hello@centralgateestates.com',
      subject: `Landlord portal message: ${subject} — ${landlordName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1A3D2B;margin-bottom:4px;">Message from Landlord Portal</h2>
          <p style="color:#737373;font-size:13px;margin-top:0;">Sent via the CGE Landlord Portal</p>
          <hr style="border:none;border-top:1px solid #e8e4de;margin:16px 0;" />
          <p><strong>From:</strong> ${landlordName} (${landlord.user.email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border:none;border-top:1px solid #e8e4de;margin:16px 0;" />
          <div style="background:#f5f2ee;border-radius:6px;padding:16px;white-space:pre-wrap;font-size:14px;color:#1a1a1a;">${message}</div>
          <hr style="border:none;border-top:1px solid #e8e4de;margin:16px 0;" />
          <p style="font-size:12px;color:#737373;">
            <a href="${baseUrl}/dashboard/landlords" style="color:#1A3D2B;">View landlord in dashboard →</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/portal/landlord/contact error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
