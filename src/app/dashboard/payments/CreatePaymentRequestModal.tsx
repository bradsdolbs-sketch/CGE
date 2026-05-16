'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Copy, Check, CreditCard } from 'lucide-react'

interface TenantOption {
  id: string
  firstName: string
  lastName: string
  user: { email: string }
}

interface PaymentRequest {
  id: string
  reference: string
  paymentUrl: string | null
  amount: number
  description: string
}

const TYPE_OPTIONS = [
  { value: 'HOLDING_DEPOSIT', label: 'Holding Deposit' },
  { value: 'SECURITY_DEPOSIT', label: 'Security Deposit' },
  { value: 'ADMIN_FEE', label: 'Admin Fee' },
  { value: 'REFERENCE_FEE', label: 'Reference Fee' },
  { value: 'FIRST_MONTHS_RENT', label: "First Month's Rent" },
  { value: 'ONE_OFF', label: 'One-Off' },
]

export default function CreatePaymentRequestModal({ tenants }: { tenants: TenantOption[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<PaymentRequest | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    tenantId: '',
    amount: '',
    description: '',
    type: 'ONE_OFF',
  })

  const router = useRouter()

  // Handle copy/cancel buttons rendered in the server component table rows
  const handleTableActions = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement

    // Copy link
    const copyBtn = target.closest('[data-copy-url]') as HTMLElement | null
    if (copyBtn) {
      const url = copyBtn.getAttribute('data-copy-url') ?? ''
      navigator.clipboard.writeText(url).then(() => {
        const original = copyBtn.textContent
        copyBtn.textContent = 'Copied!'
        setTimeout(() => { copyBtn.textContent = original }, 1500)
      })
      return
    }

    // Cancel
    const cancelBtn = target.closest('[data-cancel-id]') as HTMLElement | null
    if (cancelBtn) {
      const id = cancelBtn.getAttribute('data-cancel-id') ?? ''
      if (!confirm('Cancel this payment request? This cannot be undone.')) return
      fetch(`/api/payment-requests/${id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) router.refresh()
          else alert('Failed to cancel. Please try again.')
        })
    }
  }, [router])

  useEffect(() => {
    document.addEventListener('click', handleTableActions)
    return () => document.removeEventListener('click', handleTableActions)
  }, [handleTableActions])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const amountNum = parseFloat(form.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount in pounds')
      return
    }
    if (!form.description.trim()) {
      setError('Please enter a description')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: form.tenantId || undefined,
          amount: amountNum,
          description: form.description.trim(),
          type: form.type,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create payment request')
      }

      const pr = await res.json()
      setCreated(pr)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setCreated(null)
    setError(null)
    setCopied(false)
    setForm({ tenantId: '', amount: '', description: '', type: 'ONE_OFF' })
  }

  async function copyPaymentUrl() {
    if (!created?.paymentUrl) return
    await navigator.clipboard.writeText(created.paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold rounded-lg transition"
      >
        <CreditCard size={15} />
        New Request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-[#1a1a1a] text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  New Payment Request
                </h2>
                <p className="text-xs text-[#8a7968] mt-0.5">
                  GoCardless Instant Bank Pay
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>

            {created ? (
              /* Success state */
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Payment request created</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {created.reference} &bull; £{(created.amount / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {created.paymentUrl && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wide">
                      Payment link (send to tenant)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={created.paymentUrl}
                        className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-[#1a1a1a] font-mono truncate"
                      />
                      <button
                        onClick={copyPaymentUrl}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                          copied
                            ? 'bg-green-100 text-green-700'
                            : 'bg-[#1A3D2B] text-white hover:bg-[#122B1E]'
                        }`}
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-[#8a7968]">
                      A notification and email have been sent to the tenant. The link expires in 24 hours.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setCreated(null)
                      setForm({ tenantId: '', amount: '', description: '', type: 'ONE_OFF' })
                    }}
                    className="flex-1 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white rounded-lg text-sm font-semibold transition"
                  >
                    New request
                  </button>
                </div>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Tenant */}
                <div>
                  <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wide mb-1.5">
                    Tenant (optional)
                  </label>
                  <select
                    value={form.tenantId}
                    onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent bg-white"
                  >
                    <option value="">— No specific tenant —</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wide mb-1.5">
                    Payment Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent bg-white"
                    required
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wide mb-1.5">
                    Amount (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7968] text-sm font-medium">
                      £
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.50"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                      className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Holding deposit for Flat 3, Bow Road"
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#1A3D2B] hover:bg-[#122B1E] disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create & send'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
