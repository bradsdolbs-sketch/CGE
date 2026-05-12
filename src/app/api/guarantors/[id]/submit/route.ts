import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const guarantor = await prisma.guarantor.findUnique({ where: { id: params.id } })
  if (!guarantor || guarantor.portalToken !== token) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 })
  }
  if (guarantor.portalTokenExpiry && guarantor.portalTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 403 })
  }
  if (!guarantor.guarantorEmployerName || !guarantor.annualSalary) {
    return NextResponse.json({ error: 'Please complete your employment details before submitting' }, { status: 400 })
  }

  const updated = await prisma.guarantor.update({
    where: { id: params.id },
    data: {
      guarantorRefStatus: 'UNDER_REVIEW',
      guarantorSubmittedAt: new Date(),
    },
  })

  // Notify agents
  const agents = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
    select: { id: true },
  })
  await Promise.all(agents.map((agent) =>
    prisma.notification.create({
      data: {
        userId: agent.id,
        type: 'GENERAL',
        title: `Guarantor submitted — ${guarantor.firstName} ${guarantor.lastName}`,
        message: `${guarantor.firstName} ${guarantor.lastName} has submitted their guarantor application.`,
        link: `/dashboard/tenancies`,
      },
    })
  ))

  return NextResponse.json(updated)
}
