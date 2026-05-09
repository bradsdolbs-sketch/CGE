import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/offers — create or update an offer for an enquiry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { enquiryId, propertyId, proposedRent, startDate, tenancyTerm, depositAmount, depositScheme, specialConditions } = await req.json()

    if (!enquiryId || !propertyId || !proposedRent || !startDate || !tenancyTerm || !depositAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert — one offer per enquiry
    const offer = await prisma.offer.upsert({
      where: { enquiryId },
      update: {
        propertyId,
        proposedRent: Number(proposedRent),
        startDate: new Date(startDate),
        tenancyTerm: Number(tenancyTerm),
        depositAmount: Number(depositAmount),
        depositScheme: depositScheme ?? 'TDS',
        specialConditions: specialConditions ?? null,
        status: 'PENDING',
      },
      create: {
        enquiryId,
        propertyId,
        proposedRent: Number(proposedRent),
        startDate: new Date(startDate),
        tenancyTerm: Number(tenancyTerm),
        depositAmount: Number(depositAmount),
        depositScheme: depositScheme ?? 'TDS',
        specialConditions: specialConditions ?? null,
      },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (err) {
    console.error('POST /api/offers error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/offers?enquiryId=xxx — fetch offer by enquiry
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const enquiryId = searchParams.get('enquiryId')
  if (!enquiryId) return NextResponse.json({ error: 'enquiryId required' }, { status: 400 })

  const offer = await prisma.offer.findUnique({ where: { enquiryId } })
  if (!offer) return NextResponse.json(null)
  return NextResponse.json(offer)
}
