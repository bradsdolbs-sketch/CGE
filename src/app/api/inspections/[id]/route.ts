import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inspection = await prisma.inspection.findUnique({
    where: { id: params.id },
    include: { property: true },
  })
  if (!inspection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ inspection })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, completedAt, conductedBy, notes, pdfUrl, sentToLandlord } = body

    // Fetch current state before update to detect transitions
    const existing = await prisma.inspection.findUnique({
      where: { id: params.id },
      select: { status: true, sentToLandlord: true },
    })

    const inspection = await prisma.inspection.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
        ...(conductedBy !== undefined && { conductedBy }),
        ...(notes !== undefined && { notes }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(sentToLandlord !== undefined && { sentToLandlord }),
      },
      include: {
        property: {
          include: { landlord: { include: { user: true } } },
        },
      },
    })

    // Email landlord when inspection is completed and not yet notified
    const justCompleted = status === 'COMPLETED' && existing?.status !== 'COMPLETED'
    const justSentToLandlord = sentToLandlord === true && !existing?.sentToLandlord
    if (justCompleted || justSentToLandlord) {
      const landlordEmail = inspection.property.landlord.user.email
      const landlordName = inspection.property.landlord.firstName
      const address = inspection.property.addressLine1
      const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'
      await sendEmail({
        to: landlordEmail,
        subject: `Inspection report ready: ${address}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1A3D2B;">Inspection Report Ready</h2>
            <p>Dear ${landlordName},</p>
            <p>The inspection for <strong>${address}</strong> has been completed${inspection.conductedBy ? ` by ${inspection.conductedBy}` : ''}.</p>
            ${inspection.notes ? `<div style="background:#f5f2ee;border-radius:6px;padding:16px;margin:16px 0;font-size:14px;color:#1a1a1a;">${inspection.notes}</div>` : ''}
            <p style="margin:24px 0;">
              <a href="${baseUrl}/portal/landlord/inspections" style="background:#1A3D2B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Inspection Report →</a>
            </p>
            <p style="font-size:12px;color:#737373;">Central Gate Estates · <a href="mailto:hello@centralgateestates.com" style="color:#1A3D2B;">hello@centralgateestates.com</a></p>
          </div>
        `,
      }).catch(console.error)
    }

    return NextResponse.json({ inspection })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}
