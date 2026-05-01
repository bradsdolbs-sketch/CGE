import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contractors = await prisma.contractor.findMany({
    include: { _count: { select: { jobs: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ contractors })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, companyName, trade, phone, email, address, insuranceExpiry, gasSafeNumber, niceicNumber } = body

  if (!name || !trade || !phone) {
    return NextResponse.json({ error: 'name, trade and phone are required' }, { status: 400 })
  }

  const contractor = await prisma.contractor.create({
    data: {
      name, companyName: companyName || null, trade, phone,
      email: email || null, address: address || null,
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
      gasSafeNumber: gasSafeNumber || null, niceicNumber: niceicNumber || null,
    },
  })
  return NextResponse.json({ contractor }, { status: 201 })
}
