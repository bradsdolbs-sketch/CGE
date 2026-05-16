import React from 'react'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  compact?: boolean
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-6' : 'py-20 px-8'}`}>
      {/* Icon ring */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f2ee] border border-[#e8e4de] flex items-center justify-center">
          <Icon size={26} className="text-[#8a7968]" strokeWidth={1.5} />
        </div>
        {/* Subtle accent dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#1A3D2B] rounded-full border-2 border-white" />
      </div>

      <h3 className="font-semibold text-[#1a1a1a] text-base mb-1.5" style={{ fontFamily: 'Syne, sans-serif' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#8a7968] max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  )
}
