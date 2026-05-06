'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/dashboard/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { addDays } from 'date-fns'
import type { Property, Listing, Landlord, User, ComplianceItem } from '@prisma/client'

type PropertyRow = Property & {
  listing: Listing | null
  landlord: Landlord & { user: User }
  complianceItems: ComplianceItem[]
  _count: { maintenanceReqs: number }
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  LET_AGREED: 'bg-blue-100 text-blue-700',
  LET: 'bg-teal-100 text-teal-700',
  UNDER_OFFER: 'bg-purple-100 text-purple-700',
  SOLD: 'bg-gray-100 text-gray-600',
  OFF_MARKET: 'bg-amber-100 text-amber-700',
}

function getComplianceStatus(items: ComplianceItem[]) {
  const now = new Date()
  const in30 = addDays(now, 30)
  if (items.some((i) => i.expiryDate && i.expiryDate < now)) return { label: 'Expired', cls: 'bg-red-100 text-red-700' }
  if (items.some((i) => i.expiryDate && i.expiryDate < in30)) return { label: 'Expiring', cls: 'bg-amber-100 text-amber-700' }
  if (items.length > 0) return { label: 'OK', cls: 'bg-green-100 text-green-700' }
  return { label: 'No certs', cls: 'bg-gray-100 text-gray-500' }
}

interface Props { properties: PropertyRow[] }

export default function PropertiesClient({ properties }: Props) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')

  const areas = useMemo(() => [...new Set(properties.map((p) => p.area))].sort(), [properties])

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      if (typeFilter && p.propertyType !== typeFilter) return false
      if (areaFilter && p.area !== areaFilter) return false
      return true
    })
  }, [properties, statusFilter, typeFilter, areaFilter])

  const columns: ColumnDef<PropertyRow, unknown>[] = [
    {
      accessorKey: 'addressLine1',
      header: 'Address',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[#1a1a1a]">{row.original.addressLine1}</p>
          <p className="text-xs text-gray-500">{row.original.area}, {row.original.postcode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'propertyType',
      header: 'Type',
      cell: ({ getValue }) => <span className="text-gray-600">{String(getValue())}</span>,
    },
    {
      accessorKey: 'bedrooms',
      header: 'Beds',
      cell: ({ getValue }) => <span className="text-gray-600">{String(getValue())} bd</span>,
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
      id: 'landlord',
      header: 'Landlord',
      cell: ({ row }) => <span className="text-gray-600">{row.original.landlord.firstName} {row.original.landlord.lastName}</span>,
    },
    {
      id: 'listed',
      header: 'Listed',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.original.listing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.original.listing ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      id: 'compliance',
      header: 'Compliance',
      cell: ({ row }) => {
        const cs = getComplianceStatus(row.original.complianceItems)
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cs.cls}`}>{cs.label}</span>
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="LET">Let</option>
          <option value="LET_AGREED">Let Agreed</option>
          <option value="UNDER_OFFER">Under Offer</option>
          <option value="OFF_MARKET">Off Market</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
        >
          <option value="">All Types</option>
          <option value="FLAT">Flat</option>
          <option value="HOUSE">House</option>
          <option value="STUDIO">Studio</option>
          <option value="MAISONETTE">Maisonette</option>
          <option value="HMO">HMO</option>
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
        >
          <option value="">All Areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => router.push(`/dashboard/properties/${row.id}`)}
      />
    </div>
  )
}
