'use client'

import { useState, useMemo } from 'react'
import Input from '@/components/ui/Input'
import { TrendingUp, PoundSterling } from 'lucide-react'

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths
  const r = annualRate / 100 / 12
  const n = termMonths
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function formatGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatGBPExact(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function MortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState('350000')
  const [depositPct, setDepositPct] = useState('10')
  const [termYears, setTermYears] = useState('25')
  const [interestRate, setInterestRate] = useState('4.5')

  const results = useMemo(() => {
    const price = parseFloat(propertyPrice.replace(/,/g, '')) || 0
    const deposit = (parseFloat(depositPct) / 100) * price
    const principal = price - deposit
    const term = parseInt(termYears) || 25
    const rate = parseFloat(interestRate) || 0

    if (principal <= 0 || term <= 0) return null

    const monthly = calcMonthlyPayment(principal, rate, term * 12)
    const totalRepayment = monthly * term * 12
    const totalInterest = totalRepayment - principal
    const ltv = (principal / price) * 100

    return {
      monthly,
      totalRepayment,
      totalInterest,
      deposit,
      principal,
      ltv,
    }
  }, [propertyPrice, depositPct, termYears, interestRate])

  return (
    <div className="bg-white rounded-2xl border border-charcoal-200 p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-slate" />
        </div>
        <div>
          <h3 className="font-semibold text-charcoal">Mortgage Calculator</h3>
          <p className="text-xs text-charcoal-400">Illustrative only — speak to a mortgage broker for advice</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Input
          label="Property price"
          type="number"
          value={propertyPrice}
          onChange={(e) => setPropertyPrice(e.target.value)}
          min={0}
          step={1000}
          helperText="£"
        />
        <Input
          label="Deposit (%)"
          type="number"
          value={depositPct}
          onChange={(e) => setDepositPct(e.target.value)}
          min={5}
          max={95}
          step={1}
          helperText={results ? `${formatGBP(results.deposit)} deposit` : undefined}
        />
        <Input
          label="Mortgage term (years)"
          type="number"
          value={termYears}
          onChange={(e) => setTermYears(e.target.value)}
          min={5}
          max={35}
          step={1}
        />
        <Input
          label="Interest rate (% p.a.)"
          type="number"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          min={0}
          max={25}
          step={0.1}
        />
      </div>

      {results ? (
        <div className="space-y-3">
          {/* Monthly payment — hero */}
          <div className="bg-terracotta-50 border border-terracotta-100 rounded-xl p-5 text-center">
            <p className="text-sm text-terracotta-600 font-medium mb-1">Estimated monthly payment</p>
            <p className="text-4xl font-bold text-terracotta">{formatGBPExact(results.monthly)}</p>
            <p className="text-xs text-terracotta-500 mt-1">per month</p>
          </div>

          {/* Detail rows */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-charcoal-50 rounded-xl p-4">
              <p className="text-xs text-charcoal-400 mb-1">Loan amount</p>
              <p className="font-semibold text-charcoal">{formatGBP(results.principal)}</p>
            </div>
            <div className="bg-charcoal-50 rounded-xl p-4">
              <p className="text-xs text-charcoal-400 mb-1">LTV ratio</p>
              <p className="font-semibold text-charcoal">{results.ltv.toFixed(1)}%</p>
            </div>
            <div className="bg-charcoal-50 rounded-xl p-4">
              <p className="text-xs text-charcoal-400 mb-1">Total repayment</p>
              <p className="font-semibold text-charcoal">{formatGBP(results.totalRepayment)}</p>
            </div>
            <div className="bg-charcoal-50 rounded-xl p-4">
              <p className="text-xs text-charcoal-400 mb-1">Total interest</p>
              <p className="font-semibold text-charcoal">{formatGBP(results.totalInterest)}</p>
            </div>
          </div>

          {/* LTV bar */}
          <div>
            <div className="flex justify-between text-xs text-charcoal-400 mb-1.5">
              <span>Deposit: {depositPct}%</span>
              <span>Mortgage: {results.ltv.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-charcoal-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(depositPct), 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-charcoal-400 flex items-start gap-1.5 pt-2">
            <PoundSterling className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            This is a repayment mortgage illustration. Figures are approximate and do not constitute financial advice. Always speak to a qualified mortgage adviser.
          </p>
        </div>
      ) : (
        <div className="text-center py-8 text-charcoal-400 text-sm">
          Enter a property price to see your estimate.
        </div>
      )}
    </div>
  )
}
