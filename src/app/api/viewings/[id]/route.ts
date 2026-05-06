import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { confirmed, completed, feedback, notes, scheduledAt } = body

    const viewing = await prisma.viewing.update({
      where: { id: params.id },
      data: {
        ...(confirmed !== undefined && { confirmed: !!confirmed }),
        ...(completed !== undefined && { completed: !!completed }),
        ...(feedback !== undefined && { feedback }),
        ...(notes !== undefined && { notes }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      },
    })

    // If completed, update the linked enquiry stage
    if (completed && viewing.enquiryId) {
      await prisma.enquiry.update({
        where: { id: viewing.enquiryId },
        data: { stage: 'VIEWING_DONE' },
      })
    }

    return NextResponse.json(viewing)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update viewing' }, { status: 500 })
  }
}
