'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, CheckCircle, Bell, Loader2, Zap } from 'lucide-react'
import type { RentPayment, Tenancy, Property, TenancyTenant, Tenant, User } from '@prisma/client'
import { GC_ACTIVE_MANDATE_STATUSES, paymentStatusLabel } from '@/lib/gocardless'

type PaymentRow = RentPayment & {
  tenancy: Tenancy & {
    property: Property
    tenants: (TenancyTenant & { tenant: Tenant & { user: User } })[]
  }
}

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-gray-100 text-gray-600',
  LATE: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  VOID: 'bg-gray-100 text-gray-400',
}

function fmt(pence: number) { return `£${pence.toLocaleString()}` }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface Props {
  payments: PaymentRow[]
  initialMonth: number
  initialYear: number
}

export default function RentManagementClient({ payments, initialMonth, initialYear }: Props) {
  const router = useRouter()
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [markingAllPaid, setMarkingAllPaid] = useState(false)
  const [collectingGC, setCollectingGC] = useState<string | null>(null)
  const [gcErrors, setGcErrors] = useState<Record<string, string>>({})
  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState<string | null>(null)

  async function sendRentReminders() {
    setSendingReminders(true)
    setReminderResult(null)
    try {
      const res = await fetch('/api/cron/rent-reminders', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setReminderResult(`Done — ${data.processed} overdue payment${data.processed !== 1 ? 's' : ''} processed, ${data.emailsSent} emails sent`)
      router.refresh()
    } catch (e) {
      setReminderResult(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSendingReminders(false)
    }
  }

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.dueDate)
      return d.getMonth() + 1 === month && d.getFullYear() === year
    })
  }, [payments, month, year])

  const totalDue = filtered.reduce((s, p) => s + p.amount, 0)
  const totalReceived = filtered.reduce((s, p) => s + p.amountPaid, 0)
  const totalOutstanding = totalDue - totalReceived

  async function markPaid(paymentId: string, amount: number) {
    setMarkingPaid(paymentId)
    try {
      await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amountPaid: amount, paidDate: new Date().toISOString() }),
      })
      router.refresh()
    } finally {
      setMarkingPaid(null)
    }
  }

  async function markAllPaid() {
    const unpaid = filtered.filter((p) => p.status !== 'PAID' && p.status !== 'VOID')
    if (!unpaid.length) return
    if (!confirm(`Mark all ${unpaid.length} unpaid payment${unpaid.length !== 1 ? 's' : ''} as paid in full?`)) return
    setMarkingAllPaid(true)
    try {
      const today = new Date().toISOString()
      await Promise.all(
        unpaid.map((p) =>
          fetch('/api/rent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: p.id, amountPaid: p.amount, paidDate: today }),
          })
        )
      )
      router.refresh()
    } finally {
      setMarkingAllPaid(false)
    }
  }

  async function collectViaGC(rentPaymentId: string) {
    setCollectingGC(rentPaymentId)
    setGcErrors((prev) => { const n = { ...prev }; delete n[rentPaymentId]; return n })
    try {
      const res = await fetch('/api/gocardless/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentPaymentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGcErrors((prev) => ({ ...prev, [rentPaymentId]: data.error ?? 'Failed' }))
        return
      }
      router.refresh()
    } finally {
      setCollectingGC(null)
    }
  }

  function exportCsv() {
    const rows = [
      ['Property', 'Tenant', 'Due Date', 'Amount', 'Paid', 'Status'],
      ...filtered.map((p) => [
        p.tenancy.property.addressLine1,
        p.tenancy.tenants[0]?.tenant.firstName + ' ' + (p.tenancy.tenants[0]?.tenant.lastName ?? ''),
        new Date(p.dueDate).toLocaleDateString('en-GB'),
        p.amount,
        p.amountPaid,
        p.status,
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rent-${year}-${String(month).padStart(2, '0')}.csv`
    a.click()
  }

  const years = Array.from({ length: 5 }, (_, i) => initialYear - 2 + i)

  return (
    <div className="space-y-5">
      {/* Month/Year selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {filtered.some((p) => p.status !== 'PAID' && p.status !== 'VOID') && (
            <button
              onClick={markAllPaid}
              disabled={markingAllPaid}
              className="flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {markingAllPaid ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {markingAllPaid ? 'Marking…' : 'Mark all paid'}
            </button>
          )}
          <button
            onClick={sendRentReminders}
            disabled={sendingReminders}
            title="Email landlords + tenants for all overdue payments"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {sendingReminders ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
            {sendingReminders ? 'Sending…' : 'Send arrears reminders'}
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg transition">
            <Download size={14} />Export CSV
          </button>
        </div>
      </div>

      {reminderResult && (
        <p className="text-sm text-center py-2 px-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">{reminderResult}</p>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-[#1a1a1a]">{fmt(totalDue)}</p>
          <p className="text-sm text-gray-500">Total Due</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-green-600">{fmt(totalReceived)}</p>
          <p className="text-sm text-gray-500">Received</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className={`text-xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(totalOutstanding)}</p>
          <p className="text-sm text-gray-500">Outstanding</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Property</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Tenant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Due</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Paid</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No payments for this period</td></tr>
            ) : (
              filtered.map((p) => {
                const tenant = p.tenancy.tenants[0]?.tenant
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1a1a1a]">{p.tenancy.property.addressLine1}</p>
                      <p className="text-xs text-gray-500">{p.tenancy.property.area}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{tenant ? `${tenant.firstName} ${tenant.lastName}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.dueDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-medium">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] ?? ''}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {p.status !== 'PAID' && p.status !== 'VOID' && (
                          <button
                            onClick={() => markPaid(p.id, p.amount)}
                            disabled={markingPaid === p.id}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-60"
                          >
                            <CheckCircle size={13} />
                            {markingPaid === p.id ? '…' : 'Mark Paid'}
                          </button>
                        )}
                        {/* GoCardless collection — show when mandate active + no existing GC payment */}
                        {p.status !== 'PAID' && p.status !== 'VOID' && !p.gcPaymentId && tenant &&
                          GC_ACTIVE_MANDATE_STATUSES.includes(tenant.gcMandateStatus ?? '') && (
                          <button
                            onClick={() => collectViaGC(p.id)}
                            disabled={collectingGC === p.id}
                            className="flex items-center gap-1 text-xs text-[#4a6fa5] hover:text-[#1A3D2B] font-medium disabled:opacity-60"
                            title="Create a GoCardless direct debit payment"
                          >
                            {collectingGC === p.id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                            {collectingGC === p.id ? '…' : 'Collect via DD'}
                          </button>
                        )}
                        {/* GC payment status */}
                        {p.gcPaymentId && p.gcStatus && p.status !== 'PAID' && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Zap size={11} className="text-[#4a6fa5]" />
                            DD: {paymentStatusLabel(p.gcStatus)}
                          </span>
                        )}
                        {gcErrors[p.id] && (
                          <span className="text-xs text-red-500">{gcErrors[p.id]}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">Total</td>
                <td className="px-4 py-3">{fmt(totalDue)}</td>
                <td className="px-4 py-3 text-green-600">{fmt(totalReceived)}</td>
                <td colSpan={2} className={`px-4 py-3 ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(totalOutstanding)} outstanding</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
