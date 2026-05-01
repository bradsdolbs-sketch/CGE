import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const contractor = await prisma.contractor.update({
    where: { id: params.id },
    data: { ...body, insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : undefined },
  })
  return NextResponse.json({ contractor })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.contractor.update({ where: { id: params.id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
