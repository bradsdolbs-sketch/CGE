import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addMonths, startOfMonth } from 'date-fns'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const propertyId = searchParams.get('propertyId')
  const landlordId = searchParams.get('landlordId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: Prisma.TenancyWhereInput = {}
  if (status) where.status = status as Prisma.EnumTenancyStatusFilter
  if (propertyId) where.propertyId = propertyId
  if (landlordId) where.landlordId = landlordId

  const [tenancies, total] = await Promise.all([
    prisma.tenancy.findMany({
      where,
      include: {
        property: true,
        landlord: { include: { user: true } },
        tenants: { include: { tenant: { include: { user: true } } } },
        rentPayments: { orderBy: { dueDate: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenancy.count({ where }),
  ])

  return NextResponse.json({ tenancies, total, page, pageSize: limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      propertyId, landlordId, startDate, endDate,
      rentAmount, depositAmount, depositScheme, depositRef,
      breakClauseDate, rentFrequency, notes, tenantIds,
    } = body

    if (!propertyId || !landlordId || !startDate || !endDate || !rentAmount || !depositAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Generate monthly rent payment schedule
    const rentPayments: { dueDate: Date; amount: number }[] = []
    let current = startOfMonth(start)
    while (current <= end) {
      rentPayments.push({ dueDate: current, amount: parseInt(rentAmount) })
      current = addMonths(current, 1)
    }

    const tenancy = await prisma.tenancy.create({
      data: {
        propertyId,
        landlordId,
        startDate: start,
        endDate: end,
        rentAmount: parseInt(rentAmount),
        depositAmount: parseInt(depositAmount),
        depositScheme,
        depositRef,
        breakClauseDate: breakClauseDate ? new Date(breakClauseDate) : null,
        rentFrequency: rentFrequency ?? 'monthly',
        notes,
        status: 'PENDING',
        rentPayments: {
          create: rentPayments,
        },
        tenants: tenantIds?.length
          ? {
              create: tenantIds.map((id: string, idx: number) => ({
                tenantId: id,
                isPrimary: idx === 0,
              })),
            }
          : undefined,
      },
      include: {
        property: true,
        tenants: { include: { tenant: { include: { user: true } } } },
        rentPayments: true,
      },
    })

    return NextResponse.json(tenancy, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tenancy' }, { status: 500 })
  }
}
