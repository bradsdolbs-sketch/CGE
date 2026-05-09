import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/offers/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: { enquiry: true, property: true },
  })
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(offer)
}

// PUT /api/offers/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: {
        ...(body.proposedRent !== undefined && { proposedRent: Number(body.proposedRent) }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.tenancyTerm !== undefined && { tenancyTerm: Number(body.tenancyTerm) }),
        ...(body.depositAmount !== undefined && { depositAmount: Number(body.depositAmount) }),
        ...(body.depositScheme !== undefined && { depositScheme: body.depositScheme }),
        ...(body.specialConditions !== undefined && { specialConditions: body.specialConditions }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })
    return NextResponse.json(offer)
  } catch (err) {
    console.error('PUT /api/offers/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
