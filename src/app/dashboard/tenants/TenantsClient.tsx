'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/dashboard/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { Tenant, User, TenancyTenant, Tenancy, Property } from '@prisma/client'

type TenantRow = Tenant & {
  user: User
  tenancies: (TenancyTenant & { tenancy: Tenancy & { property: Property } })[]
}

const refColors: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
  NOT_STARTED: 'bg-gray-100 text-gray-500',
  CONDITIONAL: 'bg-amber-100 text-amber-700',
}

export default function TenantsClient({ tenants }: { tenants: TenantRow[] }) {
  const router = useRouter()
  const [refFilter, setRefFilter] = useState('')

  const filtered = useMemo(() => {
    return tenants.filter((t) => !refFilter || t.referencingStatus === refFilter)
  }, [tenants, refFilter])

  const columns: ColumnDef<TenantRow, unknown>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <p className="font-medium text-[#1a1a1a]">{row.original.firstName} {row.original.lastName}</p>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-gray-600 text-xs">{row.original.user.email}</span>,
    },
    {
      id: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-gray-500">{row.original.phone ?? '—'}</span>,
    },
    {
      accessorKey: 'referencingStatus',
      header: 'Referencing',
      cell: ({ getValue }) => {
        const s = String(getValue())
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${refColors[s] ?? 'bg-gray-100 text-gray-600'}`}>{s.replace('_', ' ')}</span>
      },
    },
    {
      id: 'currentTenancy',
      header: 'Current Tenancy',
      cell: ({ row }) => {
        const t = row.original.tenancies[0]?.tenancy
        return <span className="text-gray-600 text-xs">{t ? t.property.addressLine1 : '—'}</span>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-GB'),
    },
  ]

  return (
    <div className="space-y-4">
      <select
        value={refFilter}
        onChange={(e) => setRefFilter(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
      >
        <option value="">All Referencing Status</option>
        {['NOT_STARTED','IN_PROGRESS','PASSED','FAILED','CONDITIONAL'].map((s) => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>
      <DataTable columns={columns} data={filtered} onRowClick={(row) => router.push(`/dashboard/tenants/${row.id}`)} />
    </div>
  )
}
