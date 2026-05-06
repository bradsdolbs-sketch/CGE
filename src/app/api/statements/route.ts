import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const landlordId = searchParams.get('landlordId')

  // Landlords can only see their own statements
  let resolvedLandlordId = landlordId
  if (session.user.role === 'LANDLORD') {
    const landlord = await prisma.landlord.findFirst({ where: { userId: session.user.id } })
    if (!landlord) return NextResponse.json({ error: 'Landlord not found' }, { status: 404 })
    resolvedLandlordId = landlord.id
  } else if (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const where = resolvedLandlordId ? { landlordId: resolvedLandlordId } : {}

  const statements = await prisma.landlordStatement.findMany({
    where,
    include: { landlord: { include: { user: true } }, lineItems: true },
    orderBy: { periodStart: 'desc' },
  })

  return NextResponse.json(statements)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { landlordId, periodStart, periodEnd } = body

    if (!landlordId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(periodStart)
    const end = new Date(periodEnd)

    // Get rent payments in period for this landlord's properties
    const landlordProperties = await prisma.property.findMany({
      where: { landlordId },
      select: { id: true },
    })
    const propertyIds = landlordProperties.map((p) => p.id)

    const rentPayments = await prisma.rentPayment.findMany({
      where: {
        tenancy: { propertyId: { in: propertyIds } },
        dueDate: { gte: start, lte: end },
        status: { in: ['PAID', 'PARTIAL'] },
      },
      include: { tenancy: { include: { property: true } } },
    })

    const fees = await prisma.fee.findMany({
      where: { landlordId, createdAt: { gte: start, lte: end } },
    })

    const rentReceived = rentPayments.reduce((sum, p) => sum + p.amountPaid, 0)
    const feesDeducted = fees.reduce((sum, f) => sum + f.amount, 0)
    const closingBalance = rentReceived - feesDeducted

    // Build line items
    const lineItems = [
      ...rentPayments.map((p) => ({
        date: p.paidDate ?? p.dueDate,
        description: `Rent — ${p.tenancy.property.addressLine1}`,
        debit: 0,
        credit: p.amountPaid,
        balance: 0,
      })),
      ...fees.map((f) => ({
        date: f.createdAt,
        description: f.description ?? f.type.replace('_', ' '),
        debit: f.amount,
        credit: 0,
        balance: 0,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate running balance
    let running = 0
    for (const line of lineItems) {
      running += line.credit - line.debit
      line.balance = running
    }

    const statement = await prisma.landlordStatement.create({
      data: {
        landlordId,
        periodStart: start,
        periodEnd: end,
        rentReceived,
        feesDeducted,
        closingBalance,
        lineItems: {
          create: lineItems,
        },
      },
      include: { lineItems: true },
    })

    return NextResponse.json(statement, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 })
  }
}
