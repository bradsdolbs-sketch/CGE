'use client'

import { Download } from 'lucide-react'

interface PaymentRow {
  month: string
  dueDate: string
  amount: number
  amountPaid: number
  paidDate: string
  status: string
  reference: string
}

interface Props {
  data: PaymentRow[]
}

export default function ExportCSVButton({ data }: Props) {
  function handleExport() {
    const headers = ['Month', 'Due Date', 'Amount (£)', 'Amount Paid (£)', 'Paid Date', 'Status', 'Reference']
    const rows = data.map((r) => [
      r.month,
      r.dueDate,
      r.amount,
      r.amountPaid,
      r.paidDate,
      r.status,
      r.reference,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rent-payments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="flex items-center gap-2 border border-[#1a1a1a] text-[#1a1a1a] px-4 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-[#1a1a1a] hover:text-white transition rounded disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ fontFamily: 'Syne, sans-serif' }}
    >
      <Download size={14} />
      Export CSV
    </button>
  )
}
