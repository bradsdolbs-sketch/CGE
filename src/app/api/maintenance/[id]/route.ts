import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMaintenanceUpdate } from '@/lib/email'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      contractor: true,
      updates: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(request)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Landlords can only approve/reject quotes
  if (session.user.role === 'LANDLORD') {
    const body = await req.json()
    if (body.quoteApproved === undefined) {
      return NextResponse.json({ error: 'Landlords can only approve/reject quotes' }, { status: 403 })
    }
    const updated = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: {
        quoteApproved: body.quoteApproved,
        quoteApprovedAt: new Date(),
        status: body.quoteApproved ? 'IN_PROGRESS' : 'AWAITING_APPROVAL',
      },
    })
    return NextResponse.json(updated)
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, contractorId, quoteAmount, invoiceAmount, invoiceUrl, notes, quoteApproved } = body

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (contractorId !== undefined) {
      updateData.contractorId = contractorId
      updateData.assignedAt = new Date()
    }
    if (quoteAmount !== undefined) updateData.quoteAmount = quoteAmount ? parseInt(quoteAmount) : null
    if (invoiceAmount !== undefined) updateData.invoiceAmount = invoiceAmount ? parseInt(invoiceAmount) : null
    if (invoiceUrl !== undefined) updateData.invoiceUrl = invoiceUrl
    if (notes !== undefined) updateData.notes = notes
    if (quoteApproved !== undefined) {
      updateData.quoteApproved = quoteApproved
      updateData.quoteApprovedAt = new Date()
    }
    if (status === 'COMPLETED') updateData.completedAt = new Date()

    const request = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: updateData,
      include: { property: true, contractor: true },
    })

    return NextResponse.json(request)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
