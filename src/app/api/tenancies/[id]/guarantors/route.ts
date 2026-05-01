import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { firstName, lastName, email, phone, relationship, employer, annualSalary } = await req.json()
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
    }

    const tenancy = await prisma.tenancy.findUnique({ where: { id: params.id } })
    if (!tenancy) return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 })

    const guarantor = await prisma.guarantor.create({
      data: {
        tenancyId: params.id,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        relationship: relationship || null,
        employer: employer || null,
        annualSalary: annualSalary ? parseInt(annualSalary) : null,
      },
    })

    return NextResponse.json(guarantor, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create guarantor' }, { status: 500 })
  }
}
