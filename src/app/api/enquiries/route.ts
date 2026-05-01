import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const stage = searchParams.get('stage')
  const propertyId = searchParams.get('propertyId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: Record<string, unknown> = {}
  if (stage) where.stage = stage
  if (propertyId) where.propertyId = propertyId

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: { property: true, viewings: { take: 1, orderBy: { scheduledAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.enquiry.count({ where }),
  ])

  return NextResponse.json({ enquiries, total, page, pageSize: limit })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, message, propertyId, source, minBeds, maxBudget, moveDate } = body

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        firstName, lastName,
        email: email.toLowerCase().trim(),
        phone, message,
        propertyId: propertyId ?? null,
        source: source ?? 'WEBSITE',
        minBeds: minBeds ? parseInt(minBeds) : null,
        maxBudget: maxBudget ? parseInt(maxBudget) : null,
        moveDate: moveDate ? new Date(moveDate) : null,
      },
      include: { property: true },
    })

    // Notify agents
    try {
      const agents = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
        select: { email: true },
      })

      for (const agent of agents) {
        await sendEmail({
          to: agent.email,
          subject: `New enquiry from ${firstName} ${lastName}${enquiry.property ? ` — ${enquiry.property.addressLine1}` : ''}`,
          html: `
            <h2>New Enquiry</h2>
            <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${enquiry.property ? `<p><strong>Property:</strong> ${enquiry.property.addressLine1}, ${enquiry.property.area}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/applicants">View in Dashboard →</a>
          `,
        })
      }
    } catch (emailErr) {
      console.error('Failed to send enquiry notification:', emailErr)
    }

    return NextResponse.json(enquiry, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create enquiry' }, { status: 500 })
  }
}
