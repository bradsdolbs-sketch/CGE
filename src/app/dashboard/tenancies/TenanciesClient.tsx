'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/dashboard/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { Tenancy, TenancyTenant, Tenant, User, Property, RentPayment } from '@prisma/client'

type TenancyRow = Tenancy & {
  property: Property
  tenants: (TenancyTenant & { tenant: Tenant & { user: User } })[]
  rentPayments: RentPayment[]
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-blue-100 text-blue-700',
  TERMINATED: 'bg-red-100 text-red-700',
  HOLDING_OVER: 'bg-purple-100 text-purple-700',
}

function daysTo(d: Date) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) }

export default function TenanciesClient({ tenancies }: { tenancies: TenancyRow[] }) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [renewalOnly, setRenewalOnly] = useState(false)

  const filtered = useMemo(() => {
    return tenancies.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (renewalOnly && daysTo(t.endDate) > 60) return false
      return true
    })
  }, [tenancies, statusFilter, renewalOnly])

  const columns: ColumnDef<TenancyRow, unknown>[] = [
    {
      id: 'property',
      header: 'Property',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[#1a1a1a]">{row.original.property.addressLine1}</p>
          <p className="text-xs text-gray-500">{row.original.property.area}</p>
        </div>
      ),
    },
    {
      id: 'tenants',
      header: 'Tenant(s)',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {row.original.tenants.map((tt) => `${tt.tenant.firstName} ${tt.tenant.lastName}`).join(', ')}
        </span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-GB'),
    },
    {
      accessorKey: 'endDate',
      header: 'End',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-GB'),
    },
    {
      accessorKey: 'rentAmount',
      header: 'Rent',
      cell: ({ getValue }) => `£${(getValue() as number).toLocaleString()}/mo`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = String(getValue())
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s] ?? 'bg-gray-100 text-gray-600'}`}>{s.replace('_', ' ')}</span>
      },
    },
    {
      accessorKey: 'depositScheme',
      header: 'Deposit Scheme',
      cell: ({ getValue }) => <span className="text-gray-500 text-xs">{String(getValue() ?? '—')}</span>,
    },
    {
      id: 'daysToExpiry',
      header: 'Days to Expiry',
      cell: ({ row }) => {
        const days = daysTo(row.original.endDate)
        const cls = days < 0 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : days <= 60 ? 'text-yellow-600' : 'text-gray-500'
        return <span className={`font-medium ${cls}`}>{days < 0 ? 'Expired' : `${days}d`}</span>
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
        >
          <option value="">All Statuses</option>
          {['ACTIVE','EXPIRING_SOON','EXPIRED','PENDING','TERMINATED','HOLDING_OVER'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={renewalOnly} onChange={(e) => setRenewalOnly(e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
          Upcoming renewals only
        </label>
      </div>
      <DataTable columns={columns} data={filtered} onRowClick={(row) => router.push(`/dashboard/tenancies/${row.id}`)} />
    </div>
  )
}
