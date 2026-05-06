import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { stage, notes } = body

  const enquiry = await prisma.enquiry.update({
    where: { id: params.id },
    data: {
      ...(stage ? { stage } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json(enquiry)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.enquiry.update({
    where: { id: params.id },
    data: { stage: 'REJECTED' },
  })

  return NextResponse.json({ success: true })
}
