import { clsx } from 'clsx'
import type { PropertyStatus } from '@prisma/client'

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  PropertyStatus,
  { label: string; className: string }
> = {
  AVAILABLE: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
  LET_AGREED: { label: 'Let Agreed', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  LET: { label: 'Let', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  UNDER_OFFER: { label: 'Under Offer', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  SOLD: { label: 'Sold', className: 'bg-slate-100 text-slate-800 border-slate-200' },
  OFF_MARKET: { label: 'Off Market', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

interface StatusBadgeProps {
  status: PropertyStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

// ─── Generic Badge ────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'terracotta' | 'slate'

const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  terracotta: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
}

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  className?: string
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
