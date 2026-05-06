import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const propertyId = searchParams.get('propertyId')
  const contractorId = searchParams.get('contractorId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: Prisma.MaintenanceRequestWhereInput = {}
  if (status) where.status = status as Prisma.EnumMaintenanceStatusFilter
  if (priority) where.priority = priority as Prisma.EnumMaintenancePriorityFilter
  if (propertyId) where.propertyId = propertyId
  if (contractorId) where.contractorId = contractorId

  // Tenants can only see their own property's requests
  if (session.user.role === 'TENANT') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: session.user.id } })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    const activeTenancy = await prisma.tenancyTenant.findFirst({
      where: { tenantId: tenant.id },
      include: { tenancy: true },
    })
    if (!activeTenancy) return NextResponse.json({ requests: [], total: 0 })
    where.propertyId = activeTenancy.tenancy.propertyId
  }

  const [requests, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: true,
        contractor: true,
        updates: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.maintenanceRequest.count({ where }),
  ])

  return NextResponse.json({ requests, total, page, pageSize: limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { propertyId, category, priority, title, description, photos } = body

    if (!propertyId || !category || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        propertyId, category, priority: priority ?? 'ROUTINE',
        title, description,
        reportedByTenant: session.user.role === 'TENANT',
        photos: photos ?? [],
      },
      include: { property: true },
    })

    // Send emergency alert email
    if (request.priority === 'EMERGENCY') {
      try {
        const agents = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
          select: { email: true, name: true },
        })

        for (const agent of agents) {
          await sendEmail({
            to: agent.email,
            subject: `EMERGENCY MAINTENANCE: ${title} — ${request.property.addressLine1}`,
            html: `
              <h2>Emergency Maintenance Alert</h2>
              <p><strong>Property:</strong> ${request.property.addressLine1}, ${request.property.area}, ${request.property.postcode}</p>
              <p><strong>Issue:</strong> ${title}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p>Please respond immediately. <a href="${process.env.NEXTAUTH_URL}/dashboard/maintenance/${request.id}">View job →</a></p>
            `,
          })
        }
      } catch (emailErr) {
        console.error('Failed to send emergency email:', emailErr)
      }
    }

    return NextResponse.json(request, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 })
  }
}
