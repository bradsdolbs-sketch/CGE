'use client'

import { useRouter } from 'next/navigation'
import DataTable from '@/components/dashboard/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { Landlord, User } from '@prisma/client'

type LandlordRow = Landlord & { user: User; _count: { properties: number } }

export default function LandlordsClient({ landlords }: { landlords: LandlordRow[] }) {
  const router = useRouter()

  const columns: ColumnDef<LandlordRow, unknown>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[#1a1a1a]">{row.original.firstName} {row.original.lastName}</p>
          {row.original.companyName && <p className="text-xs text-gray-500">{row.original.companyName}</p>}
        </div>
      ),
    },
    { id: 'phone', header: 'Phone', cell: ({ row }) => <span className="text-gray-600">{row.original.phone ?? '—'}</span> },
    { id: 'properties', header: 'Properties', cell: ({ row }) => <span className="font-medium">{row.original._count.properties}</span> },
    {
      accessorKey: 'serviceLevel',
      header: 'Service Level',
      cell: ({ getValue }) => {
        const v = String(getValue()).replace('_', ' ')
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#eef2f8] text-[#4a6fa5]">{v}</span>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-GB'),
    },
  ]

  return (
    <DataTable columns={columns} data={landlords} onRowClick={(row) => router.push(`/dashboard/landlords/${row.id}`)} />
  )
}
