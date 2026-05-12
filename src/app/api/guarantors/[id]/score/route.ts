import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { monthlyRent } = await req.json() as { monthlyRent?: number }

  const guarantor = await prisma.guarantor.findUnique({
    where: { id: params.id },
    include: { tenancy: true },
  })
  if (!guarantor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get tenant's declared salary from their most recent reference application
  const tenantRef = await prisma.tenantReferenceApplication.findFirst({
    where: { tenant: { tenancies: { some: { tenancyId: guarantor.tenancyId } } } },
    orderBy: { createdAt: 'desc' },
    select: { annualSalary: true },
  })

  const salary = guarantor.annualSalary ?? 0
  const rent = monthlyRent ?? guarantor.tenancy.rentAmount ?? 0
  const annualRent = rent * 12

  // Guarantor must earn ≥ 36× monthly rent (stricter 3× annual rule)
  const ratio = annualRent > 0 ? salary / annualRent : 0
  const affordabilityPass = ratio >= 3

  // Simple score: 100 if ≥ 3×, scaled down proportionally (floor 0)
  const affordabilityScore = Math.max(0, Math.min(100, Math.round(ratio * 100 / 3)))

  const breakdown = {
    salary,
    annualRent,
    ratio: Math.round(ratio * 100) / 100,
    required: 3,
    pass: affordabilityPass,
  }

  // Combined affordability (tenant + guarantor)
  const tenantSalary = tenantRef?.annualSalary ?? 0
  const combined = tenantSalary + salary
  const combinedRatio = annualRent > 0 ? combined / annualRent : 0
  const combinedPass = combinedRatio >= 2.5 // Combined is a softer 2.5× threshold

  const updated = await prisma.guarantor.update({
    where: { id: params.id },
    data: {
      guarantorAffordabilityScore: affordabilityScore,
      guarantorAffordabilityPass: affordabilityPass,
      guarantorScoreBreakdown: JSON.stringify({ ...breakdown, combined, combinedRatio: Math.round(combinedRatio * 100) / 100, combinedPass }),
    },
  })

  return NextResponse.json({ guarantor: updated, breakdown, combinedPass })
}
