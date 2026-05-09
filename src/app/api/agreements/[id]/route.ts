import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agreements/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const agreement = await prisma.agreement.findUnique({
    where: { id: params.id },
    include: {
      enquiry: {
        include: {
          property: true,
          offer: true,
        },
      },
      tenancy: {
        include: {
          property: true,
          landlord: { include: { user: true } },
          tenants: { include: { tenant: { include: { user: true } } }, where: { isPrimary: true } },
        },
      },
    },
  })

  if (!agreement) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agreement)
}

// PUT /api/agreements/[id] — update status, agentApprovedAt
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const agreement = await prisma.agreement.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.agentApproved && { agentApprovedAt: new Date() }),
      },
    })
    return NextResponse.json(agreement)
  } catch (err) {
    console.error('PUT /api/agreements/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
