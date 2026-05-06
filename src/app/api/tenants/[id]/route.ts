import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      tenancies: {
        include: { tenancy: { include: { property: true, rentPayments: { orderBy: { dueDate: 'desc' }, take: 6 } } } },
      },
      documents: true,
      rightToRentChecks: { orderBy: { checkDate: 'desc' } },
      notesList: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tenant)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { dob, annualSalary, ...rest } = body

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
        ...(annualSalary !== undefined && { annualSalary: annualSalary ? parseInt(annualSalary) : null }),
        ...rest,
      },
      include: { user: true },
    })

    return NextResponse.json(tenant)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
    if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.user.update({ where: { id: tenant.userId }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}
