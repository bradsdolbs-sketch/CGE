import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  const status = searchParams.get('status')

  const inspections = await prisma.inspection.findMany({
    where: { ...(propertyId ? { propertyId } : {}), ...(status ? { status: status as any } : {}) },
    include: { property: { select: { addressLine1: true, area: true, postcode: true } } },
    orderBy: { scheduledAt: 'asc' },
  })
  return NextResponse.json({ inspections })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { propertyId, type, scheduledAt, conductedBy, notes } = body

  if (!propertyId || !type || !scheduledAt) {
    return NextResponse.json({ error: 'propertyId, type and scheduledAt are required' }, { status: 400 })
  }

  const inspection = await prisma.inspection.create({
    data: {
      propertyId,
      type: type as any,
      status: 'SCHEDULED',
      scheduledAt: new Date(scheduledAt),
      conductedBy: conductedBy || null,
      notes: notes || null,
    },
  })
  return NextResponse.json({ inspection }, { status: 201 })
}
