import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const propertyId = searchParams.get('propertyId')

  if (propertyId) {
    const items = await prisma.complianceItem.findMany({
      where: { propertyId },
      orderBy: { expiryDate: 'asc' },
    })
    return NextResponse.json(items)
  }

  // Dashboard view: all properties with all cert types
  const now = new Date()
  const in30Days = addDays(now, 30)

  const [properties, allItems] = await Promise.all([
    prisma.property.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: { id: true, addressLine1: true, area: true, postcode: true },
      orderBy: { addressLine1: 'asc' },
    }),
    prisma.complianceItem.findMany({
      include: { property: true },
      orderBy: { expiryDate: 'asc' },
    }),
  ])

  const expiredCount = allItems.filter(
    (i) => i.expiryDate && i.expiryDate < now
  ).length
  const expiringThisMonth = allItems.filter(
    (i) => i.expiryDate && i.expiryDate >= now && i.expiryDate <= in30Days
  ).length

  return NextResponse.json({ properties, items: allItems, expiredCount, expiringThisMonth })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { propertyId, type, issueDate, expiryDate, certificateUrl, notes } = body

    if (!propertyId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const item = await prisma.complianceItem.create({
      data: {
        propertyId, type,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateUrl, notes,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create compliance item' }, { status: 500 })
  }
}
