import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fees = await prisma.fee.findMany({
    include: { landlord: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(fees)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { landlordId, type, amount, description, rentPaymentId } = await req.json()
    if (!landlordId || !type || amount === undefined) {
      return NextResponse.json({ error: 'landlordId, type, and amount are required' }, { status: 400 })
    }

    const fee = await prisma.fee.create({
      data: {
        landlordId,
        type,
        amount: parseInt(amount),
        description: description || null,
        rentPaymentId: rentPaymentId || null,
      },
      include: { landlord: { include: { user: true } } },
    })

    return NextResponse.json(fee, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create fee' }, { status: 500 })
  }
}
