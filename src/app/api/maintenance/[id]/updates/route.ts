import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMaintenanceUpdate } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, note, photos } = body

    if (!status || !note) {
      return NextResponse.json({ error: 'Status and note are required' }, { status: 400 })
    }

    const [update, request] = await prisma.$transaction(async (tx) => {
      const u = await tx.maintenanceUpdate.create({
        data: {
          requestId: params.id,
          status,
          note,
          photos: photos ?? [],
        },
      })
      const r = await tx.maintenanceRequest.update({
        where: { id: params.id },
        data: {
          status,
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
        include: {
          property: {
            include: {
              tenancies: {
                where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
                include: { tenants: { include: { tenant: { include: { user: true } } } } },
                take: 1,
              },
            },
          },
        },
      })
      return [u, r]
    })

    // Send email notifications to tenants
    try {
      const activeTenancy = request.property.tenancies[0]
      if (activeTenancy) {
        for (const tt of activeTenancy.tenants) {
          await sendMaintenanceUpdate(request, update, tt.tenant.user.email)
        }
      }
    } catch (emailErr) {
      console.error('Failed to send maintenance update email:', emailErr)
    }

    return NextResponse.json(update, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to add update' }, { status: 500 })
  }
}
