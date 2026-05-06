import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const fee = await prisma.fee.update({
      where: { id: params.id },
      data: { paidAt: new Date() },
    })
    return NextResponse.json(fee)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
