// Pure helpers — no Node.js imports, safe to use in client components

export function mandateStatusLabel(status: string | null | undefined): string {
  const map: Record<string, string> = {
    pending_customer_approval: 'Awaiting customer',
    pending_submission:        'Pending submission',
    submitted:                 'Submitted to bank',
    active:                    'Active',
    failed:                    'Failed',
    cancelled:                 'Cancelled',
    expired:                   'Expired',
    consumed:                  'Consumed',
  }
  return map[status ?? ''] ?? status ?? 'Unknown'
}

export function paymentStatusLabel(status: string | null | undefined): string {
  const map: Record<string, string> = {
    pending_customer_approval: 'Awaiting approval',
    pending_submission:        'Pending',
    submitted:                 'Submitted',
    confirmed:                 'Confirmed',
    paid_out:                  'Paid out',
    cancelled:                 'Cancelled',
    customer_approval_denied:  'Approval denied',
    failed:                    'Failed',
    charged_back:              'Charged back',
  }
  return map[status ?? ''] ?? status ?? 'Unknown'
}

export const GC_ACTIVE_MANDATE_STATUSES = ['pending_submission', 'submitted', 'active']
