import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendViewingConfirmation, sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const propertyId = searchParams.get('propertyId')
  const date = searchParams.get('date')

  const where: Record<string, unknown> = {}
  if (propertyId) where.propertyId = propertyId
  if (date) {
    const d = new Date(date)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    where.scheduledAt = { gte: d, lt: next }
  }

  const viewings = await prisma.viewing.findMany({
    where,
    include: { property: true, enquiry: true },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(viewings)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { propertyId, enquiryId, firstName, lastName, email, phone, scheduledAt, duration } = body

    if (!propertyId || !firstName || !lastName || !email || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const viewing = await prisma.viewing.create({
      data: {
        propertyId, enquiryId,
        firstName, lastName,
        email: email.toLowerCase().trim(),
        phone,
        scheduledAt: new Date(scheduledAt),
        duration: duration ?? 30,
        confirmed: false,
      },
      include: { property: true },
    })

    // Send confirmation to applicant
    try {
      await sendViewingConfirmation(viewing, viewing.property)
    } catch (emailErr) {
      console.error('Failed to send viewing confirmation:', emailErr)
    }

    // Notify agents
    try {
      const agents = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
        select: { email: true },
      })
      for (const agent of agents) {
        await sendEmail({
          to: agent.email,
          subject: `Viewing booked — ${viewing.property.addressLine1}`,
          html: `
            <p>${firstName} ${lastName} has booked a viewing at ${viewing.property.addressLine1} on ${new Date(scheduledAt).toLocaleString('en-GB')}.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/applicants">View in Dashboard →</a>
          `,
        })
      }
    } catch (emailErr) {
      console.error('Failed to send viewing notification:', emailErr)
    }

    return NextResponse.json(viewing, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to book viewing' }, { status: 500 })
  }
}
