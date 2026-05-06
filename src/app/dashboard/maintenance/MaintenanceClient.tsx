'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/dashboard/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { MaintenanceRequest, Property, Contractor, MaintenanceUpdate } from '@prisma/client'

type RequestRow = MaintenanceRequest & {
  property: Property
  contractor: Contractor | null
  updates: MaintenanceUpdate[]
}

const priorityColors = {
  EMERGENCY: 'bg-red-100 text-red-700',
  URGENT: 'bg-amber-100 text-amber-700',
  ROUTINE: 'bg-blue-100 text-blue-700',
}

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  AWAITING_PARTS: 'bg-orange-100 text-orange-700',
  AWAITING_APPROVAL: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-teal-100 text-teal-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export default function MaintenanceClient({ requests }: { requests: RequestRow[] }) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (priorityFilter && r.priority !== priorityFilter) return false
      if (categoryFilter && r.category !== categoryFilter) return false
      return true
    })
  }, [requests, statusFilter, priorityFilter, categoryFilter])

  const columns: ColumnDef<RequestRow, unknown>[] = [
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
    { accessorKey: 'title', header: 'Title', cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => <span className="text-gray-600 text-xs">{String(getValue()).replace('_', ' ')}</span>,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => {
        const p = String(getValue()) as keyof typeof priorityColors
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[p]}`}>{p}</span>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = String(getValue())
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s] ?? 'bg-gray-100 text-gray-600'}`}>{s.replace('_', ' ')}</span>
      },
    },
    { id: 'contractor', header: 'Contractor', cell: ({ row }) => <span className="text-gray-500 text-xs">{row.original.contractor?.name ?? '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-GB') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          <option value="">All Statuses</option>
          {['NEW','ASSIGNED','IN_PROGRESS','AWAITING_PARTS','AWAITING_APPROVAL','COMPLETED','INVOICED','CANCELLED'].map((s) => (
            <option key={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          <option value="">All Priorities</option>
          <option>EMERGENCY</option>
          <option>URGENT</option>
          <option>ROUTINE</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white">
          <option value="">All Categories</option>
          {['PLUMBING','ELECTRICAL','HEATING','STRUCTURAL','APPLIANCES','GENERAL','EMERGENCY','PEST_CONTROL','LOCKSMITH','CLEANING'].map((c) => (
            <option key={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={filtered} onRowClick={(row) => router.push(`/dashboard/maintenance/${row.id}`)} />
    </div>
  )
}
