import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Calculates and saves the affordability score
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    include: { documents: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const breakdown: Record<string, { score: number; max: number; notes: string }> = {}
  let totalScore = 0
  let totalMax = 0

  // ── 1. Affordability (40 pts) ─────────────────────────────────────────────
  const salaryToUse = app.employerConfirmedSalary ?? app.annualSalary ?? 0
  const annualRent = (app.monthlyRentTarget ?? 0) * 12
  const affordMax = 40

  if (salaryToUse > 0 && annualRent > 0) {
    const ratio = salaryToUse / annualRent
    let affordScore: number
    let affordNotes: string

    if (ratio >= 3.0) {
      affordScore = 40
      affordNotes = `Excellent — salary (£${salaryToUse.toLocaleString()}) is ${ratio.toFixed(1)}× annual rent. Comfortably exceeds 3× threshold.`
    } else if (ratio >= 2.5) {
      affordScore = 32
      affordNotes = `Good — salary is ${ratio.toFixed(1)}× annual rent. Meets standard 2.5× threshold.`
    } else if (ratio >= 2.0) {
      affordScore = 20
      affordNotes = `Marginal — salary is ${ratio.toFixed(1)}× annual rent. Below 2.5× threshold. Consider guarantor.`
    } else {
      affordScore = 8
      affordNotes = `Fail — salary is only ${ratio.toFixed(1)}× annual rent. Significantly below threshold. Guarantor required.`
    }

    breakdown['Affordability'] = { score: affordScore, max: affordMax, notes: affordNotes }
    totalScore += affordScore
  } else {
    breakdown['Affordability'] = { score: 0, max: affordMax, notes: 'No salary or rent target provided' }
  }
  totalMax += affordMax

  // ── 2. Employment verification (20 pts) ──────────────────────────────────
  const empMax = 20
  let empScore = 0
  let empNotes = ''

  if (app.employerConfirmed) {
    if (app.employerConfirmedSalary && app.annualSalary) {
      const diff = Math.abs(app.employerConfirmedSalary - app.annualSalary) / app.annualSalary
      if (diff <= 0.05) {
        empScore = 20
        empNotes = 'Employment confirmed. Salary matches declared amount.'
      } else if (diff <= 0.15) {
        empScore = 14
        empNotes = `Employment confirmed but salary differs slightly (declared £${app.annualSalary?.toLocaleString()}, confirmed £${app.employerConfirmedSalary.toLocaleString()}).`
      } else {
        empScore = 6
        empNotes = `Employment confirmed but significant salary discrepancy (declared £${app.annualSalary?.toLocaleString()}, confirmed £${app.employerConfirmedSalary.toLocaleString()}).`
      }
    } else {
      empScore = 15
      empNotes = 'Employment confirmed by employer.'
    }
  } else if (app.employerName && app.jobTitle) {
    empScore = 8
    empNotes = 'Employment details provided but not yet confirmed by employer.'
  } else {
    empScore = 0
    empNotes = 'No employment details provided.'
  }

  if (app.contractType === 'PERMANENT') {
    empScore = Math.min(empScore + 2, empMax)
    empNotes += ' Permanent contract (+2).'
  } else if (app.contractType === 'ZERO_HOURS') {
    empScore = Math.max(empScore - 4, 0)
    empNotes += ' Zero-hours contract (-4).'
  }

  breakdown['Employment'] = { score: empScore, max: empMax, notes: empNotes }
  totalScore += empScore
  totalMax += empMax

  // ── 3. Previous landlord reference (25 pts) ───────────────────────────────
  const llMax = 25
  let llScore = 0
  let llNotes = ''

  if (app.prevLandlordConfirmed) {
    if (app.prevLandlordRating === 'EXCELLENT') {
      llScore = 25
      llNotes = 'Excellent reference from previous landlord. No issues.'
    } else if (app.prevLandlordRating === 'GOOD') {
      llScore = 20
      llNotes = 'Good reference from previous landlord.'
    } else if (app.prevLandlordRating === 'CONCERNS') {
      llScore = 10
      llNotes = 'Previous landlord raised some concerns. Review notes carefully.'
    } else if (app.prevLandlordRating === 'POOR') {
      llScore = 2
      llNotes = 'Poor reference from previous landlord. Not recommended without further investigation.'
    }
    if (app.prevLandlordArrears === true) {
      llScore = Math.max(llScore - 10, 0)
      llNotes += ' RENT ARREARS reported by previous landlord.'
    }
  } else if (app.prevLandlordName) {
    llScore = 8
    llNotes = 'Previous landlord details provided but reference not yet received.'
  } else {
    llScore = 0
    llNotes = 'No previous landlord details provided (first-time renter or not applicable).'
  }

  breakdown['Previous Landlord'] = { score: llScore, max: llMax, notes: llNotes }
  totalScore += llScore
  totalMax += llMax

  // ── 4. Documents (15 pts) ─────────────────────────────────────────────────
  const docMax = 15
  const docTypes = app.documents.map((d) => d.docType)
  let docScore = 0
  const docNotes: string[] = []

  const hasId = docTypes.some((t) => t.startsWith('ID'))
  const hasPayslip = docTypes.some((t) => t.startsWith('PAYSLIP'))
  const hasBank = docTypes.some((t) => t.includes('BANK'))
  const payslipCount = docTypes.filter((t) => t.startsWith('PAYSLIP')).length

  if (hasId) { docScore += 5; docNotes.push('ID ✓') }
  if (hasPayslip) {
    docScore += Math.min(payslipCount * 2, 6)
    docNotes.push(`${payslipCount} payslip(s) ✓`)
  }
  if (hasBank) { docScore += 4; docNotes.push('Bank statement ✓') }

  breakdown['Documents'] = { score: docScore, max: docMax, notes: docNotes.join(' · ') || 'No documents uploaded' }
  totalScore += docScore
  totalMax += docMax

  // ── Final score ───────────────────────────────────────────────────────────
  const finalScore = Math.round((totalScore / totalMax) * 100)
  const affordabilityPass = finalScore >= 60 && (breakdown['Affordability']?.score ?? 0) >= 20

  const updated = await prisma.tenantReferenceApplication.update({
    where: { id: params.id },
    data: {
      affordabilityScore: finalScore,
      affordabilityPass,
      scoreBreakdown: JSON.stringify(breakdown),
      status: 'UNDER_REVIEW',
    },
  })

  return NextResponse.json({ score: finalScore, pass: affordabilityPass, breakdown, application: updated })
}
