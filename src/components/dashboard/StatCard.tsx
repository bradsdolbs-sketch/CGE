import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number // percentage change, positive = up, negative = down
  icon: React.ReactNode
  color?: 'terracotta' | 'slate' | 'green' | 'amber' | 'red'
  href?: string
}

const colorMap = {
  terracotta: { bg: 'bg-[#F0EBE0]', icon: 'text-[#1A3D2B]', trend: 'text-[#1A3D2B]' },
  slate: { bg: 'bg-[#eef2f8]', icon: 'text-[#4a6fa5]', trend: 'text-[#4a6fa5]' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', trend: 'text-green-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', trend: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', trend: 'text-red-600' },
}

export default function StatCard({ title, value, change, icon, color = 'terracotta', href }: StatCardProps) {
  const colors = colorMap[color]

  const content = (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {change > 0 ? (
              <TrendingUp size={13} />
            ) : change < 0 ? (
              <TrendingDown size={13} />
            ) : (
              <Minus size={13} />
            )}
            {change !== 0 ? `${Math.abs(change)}%` : 'No change'}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[#1a1a1a] leading-tight">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return content
}
