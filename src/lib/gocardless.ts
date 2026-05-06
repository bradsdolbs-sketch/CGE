import GoCardless from 'gocardless-nodejs'
import { Environments } from 'gocardless-nodejs/constants'

// ─── Singleton client ──────────────────────────────────────────────────────────

const env = process.env.GC_ENVIRONMENT === 'live' ? Environments.Live : Environments.Sandbox
const token = process.env.GC_ACCESS_TOKEN ?? ''

// Lazily initialised so missing credentials don't crash the server at boot
let _client: ReturnType<typeof GoCardless> | null = null

export function getGoCardlessClient() {
  if (!token) throw new Error('GC_ACCESS_TOKEN is not set')
  if (!_client) _client = GoCardless(token, env)
  return _client
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert pounds (whole number) to pence for GoCardless */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100)
}

/** Human-readable mandate status label */
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

/** Human-readable payment status label */
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
