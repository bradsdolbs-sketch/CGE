import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: {
      tenant: { include: { user: true } },
      documents: true,
    },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Tenants can only see their own
  if (session.user.role === 'TENANT') {
    const tenant = await prisma.tenant.findUnique({ where: { userId: session.user.id } })
    if (!tenant || tenant.id !== app.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json(app)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Tenants can only update their own application and only when PENDING_SUBMISSION
    if (session.user.role === 'TENANT') {
      const tenant = await prisma.tenant.findUnique({ where: { userId: session.user.id } })
      const app = await prisma.tenantReferenceApplication.findUnique({ where: { id: params.id } })
      if (!tenant || !app || tenant.id !== app.tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (app.status !== 'PENDING_SUBMISSION') {
        return NextResponse.json({ error: 'Application already submitted' }, { status: 400 })
      }
    } else if (!['ADMIN', 'AGENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { employmentStartDate, prevTenancyStart, prevTenancyEnd, ...rest } = body

    const updated = await prisma.tenantReferenceApplication.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(employmentStartDate !== undefined && {
          employmentStartDate: employmentStartDate ? new Date(employmentStartDate) : null,
        }),
        ...(prevTenancyStart !== undefined && {
          prevTenancyStart: prevTenancyStart ? new Date(prevTenancyStart) : null,
        }),
        ...(prevTenancyEnd !== undefined && {
          prevTenancyEnd: prevTenancyEnd ? new Date(prevTenancyEnd) : null,
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
