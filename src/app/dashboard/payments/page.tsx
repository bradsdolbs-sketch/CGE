import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import CreatePaymentRequestModal from './CreatePaymentRequestModal'

export const dynamic = 'force-dynamic'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(pence / 100)
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy HH:mm')
}

const TYPE_LABELS: Record<string, string> = {
  HOLDING_DEPOSIT: 'Holding Deposit',
  SECURITY_DEPOSIT: 'Security Deposit',
  ADMIN_FEE: 'Admin Fee',
  REFERENCE_FEE: 'Reference Fee',
  FIRST_MONTHS_RENT: 'First Month\'s Rent',
  ONE_OFF: 'One-Off',
}

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
  AUTHORISED: { cls: 'bg-blue-100 text-blue-700', label: 'Authorised' },
  PAID: { cls: 'bg-green-100 text-green-700', label: 'Paid' },
  FAILED: { cls: 'bg-red-100 text-red-700', label: 'Failed' },
  CANCELLED: { cls: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
  EXPIRED: { cls: 'bg-gray-100 text-gray-400', label: 'Expired' },
}

export default async function PaymentRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    redirect('/login')
  }

  const [requests, tenants] = await Promise.all([
    prisma.paymentRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    prisma.tenant.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    }),
  ])

  const pendingCount = requests.filter((r) => r.status === 'PENDING' || r.status === 'AUTHORISED').length
  const paidTotal = requests.filter((r) => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0)
  const outstandingTotal = requests
    .filter((r) => r.status === 'PENDING' || r.status === 'AUTHORISED')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Payment Requests
          </h1>
          <p className="text-[#8a7968] text-sm mt-0.5">
            GoCardless Instant Bank Pay — one-off payment links
          </p>
        </div>
        <CreatePaymentRequestModal tenants={tenants} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Pending / Authorised
          </p>
          <p className="text-3xl font-bold text-[#1a1a1a] mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {pendingCount}
          </p>
          <p className="text-xs text-[#8a7968] mt-0.5">awaiting payment</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Total Paid
          </p>
          <p className="text-3xl font-bold text-[#1a1a1a] mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {fmt(paidTotal)}
          </p>
          <p className="text-xs text-[#8a7968] mt-0.5">confirmed received</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wider text-[#8a7968] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Outstanding
          </p>
          <p className={`text-3xl font-bold mt-1 ${outstandingTotal > 0 ? 'text-amber-600' : 'text-[#1a1a1a]'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
            {fmt(outstandingTotal)}
          </p>
          <p className="text-xs text-[#8a7968] mt-0.5">pending clearance</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            All Requests
          </h2>
          <span className="text-xs text-[#8a7968]">{requests.length} total</span>
        </div>

        {requests.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f5f2ee] flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">💳</span>
            </div>
            <p className="text-[#8a7968] text-sm font-medium">No payment requests yet</p>
            <p className="text-[#8a7968] text-xs mt-1">Create your first one using the button above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider hidden lg:table-cell">
                    Created
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#8a7968] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r) => {
                  const badge = STATUS_STYLES[r.status] ?? { cls: 'bg-gray-100 text-gray-500', label: r.status }
                  const tenantName = r.tenant
                    ? `${r.tenant.firstName} ${r.tenant.lastName}`
                    : '—'

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-[#1A3D2B]">{r.reference}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-[#1a1a1a]">{tenantName}</p>
                          {r.tenant?.user?.email && (
                            <p className="text-xs text-[#8a7968]">{r.tenant.user.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-[#8a7968]">
                        {TYPE_LABELS[r.type] ?? r.type}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#1a1a1a]">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#8a7968] hidden lg:table-cell text-xs">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentRowActions
                          id={r.id}
                          status={r.status}
                          paymentUrl={r.paymentUrl}
                          reference={r.reference}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inline client actions component ──────────────────────────────────────────
// This is rendered server-side as a serialisable island via a client import

function PaymentRowActions({
  id,
  status,
  paymentUrl,
  reference,
}: {
  id: string
  status: string
  paymentUrl: string | null
  reference: string
}) {
  // We can't use hooks in a server component, so we render a client boundary inline.
  // The actual interaction is handled by the sibling client component.
  return (
    <div className="flex items-center gap-2">
      {paymentUrl && status === 'PENDING' && (
        <CopyLinkButton url={paymentUrl} reference={reference} />
      )}
      {(status === 'PENDING' || status === 'AUTHORISED') && (
        <CancelButton id={id} />
      )}
    </div>
  )
}

// Inline server-renderable wrappers that delegate interactivity to CreatePaymentRequestModal
// (which is already 'use client'). For copy/cancel we inline them as data-attributes
// and handle via the modal's client component — or we create tiny self-contained ones below.

function CopyLinkButton({ url, reference }: { url: string; reference: string }) {
  // Rendered as a static anchor; the JS copy behaviour is handled client-side
  // via the data attributes picked up by a tiny script in CreatePaymentRequestModal
  return (
    <span
      data-copy-url={url}
      data-copy-ref={reference}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#1A3D2B] hover:text-white transition cursor-pointer select-none copy-link-btn"
    >
      Copy link
    </span>
  )
}

function CancelButton({ id }: { id: string }) {
  return (
    <span
      data-cancel-id={id}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer select-none cancel-pr-btn"
    >
      Cancel
    </span>
  )
}
