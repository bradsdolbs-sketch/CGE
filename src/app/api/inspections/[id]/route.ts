import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inspection = await prisma.inspection.findUnique({
    where: { id: params.id },
    include: { property: true },
  })
  if (!inspection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ inspection })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, completedAt, conductedBy, notes, pdfUrl, sentToLandlord } = body

    const inspection = await prisma.inspection.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
        ...(conductedBy !== undefined && { conductedBy }),
        ...(notes !== undefined && { notes }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(sentToLandlord !== undefined && { sentToLandlord }),
      },
    })
    return NextResponse.json({ inspection })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}
