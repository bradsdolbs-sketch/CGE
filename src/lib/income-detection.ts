type Transaction = {
  amount: number      // positive = credit
  timestamp: string
  description: string
  currency: string
}

type IncomeResult = {
  detected: boolean
  monthlyAmount: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  months: number
  source: string | null
}

export function detectIncome(transactions: Transaction[]): IncomeResult {
  const credits = transactions.filter((t) => t.amount > 0)
  if (credits.length === 0) return { detected: false, monthlyAmount: 0, confidence: 'NONE', months: 0, source: null }

  // Group credits by month
  const byMonth: Record<string, Transaction[]> = {}
  for (const t of credits) {
    const key = t.timestamp.substring(0, 7) // "YYYY-MM"
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(t)
  }

  const months = Object.keys(byMonth).sort()
  if (months.length < 2) return { detected: false, monthlyAmount: 0, confidence: 'NONE', months: 0, source: null }

  // Find recurring salary-like credits: same approximate amount (±10%), landing days 20–5 of next month
  const candidates: { amount: number; description: string; monthCount: number }[] = []

  for (const t of credits) {
    const day = new Date(t.timestamp).getDate()
    // Payroll window: days 20–31 or days 1–7 (some employers pay early or late)
    const inPayrollWindow = day >= 20 || day <= 7
    if (!inPayrollWindow) continue

    // Check how many months this amount (within ±10%) recurs
    const lower = t.amount * 0.9
    const upper = t.amount * 1.1
    let matchCount = 0
    for (const month of months) {
      const hasMatch = byMonth[month].some((tx) => tx.amount >= lower && tx.amount <= upper)
      if (hasMatch) matchCount++
    }

    if (matchCount >= 2) {
      candidates.push({ amount: t.amount, description: t.description, monthCount: matchCount })
    }
  }

  if (candidates.length === 0) return { detected: false, monthlyAmount: 0, confidence: 'NONE', months: 0, source: null }

  // Pick the candidate that recurs most
  candidates.sort((a, b) => b.monthCount - a.monthCount)
  const best = candidates[0]

  const confidence: IncomeResult['confidence'] =
    best.monthCount >= 3 ? 'HIGH' :
    best.monthCount === 2 ? 'MEDIUM' : 'LOW'

  return {
    detected: true,
    monthlyAmount: Math.round(best.amount),
    confidence,
    months: best.monthCount,
    source: best.description,
  }
}
