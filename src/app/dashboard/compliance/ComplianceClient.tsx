'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ComplianceItem } from '@prisma/client'

interface Property { id: string; addressLine1: string; area: string; postcode: string }

interface Props {
  properties: Property[]
  items: ComplianceItem[]
  certTypes: string[]
}

function getStatus(items: ComplianceItem[], propertyId: string, certType: string) {
  const item = items.find((i) => i.propertyId === propertyId && i.type === certType)
  if (!item) return 'missing'
  if (!item.expiryDate) return 'no-expiry'
  const now = new Date()
  const days = Math.ceil((item.expiryDate.getTime() - now.getTime()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 30) return 'expiring'
  return 'valid'
}

const statusIcons: Record<string, string> = {
  valid: '✓',
  expiring: '⚠',
  expired: '✗',
  missing: '—',
  'no-expiry': '?',
}

const statusColors: Record<string, string> = {
  valid: 'text-green-600 bg-green-50',
  expiring: 'text-amber-600 bg-amber-50',
  expired: 'text-red-600 bg-red-50',
  missing: 'text-gray-400 bg-gray-50',
  'no-expiry': 'text-blue-500 bg-blue-50',
}

export default function ComplianceClient({ properties, items, certTypes }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProp, setModalProp] = useState<Property | null>(null)
  const [modalType, setModalType] = useState('')
  const [form, setForm] = useState({ issueDate: '', expiryDate: '', certificateUrl: '' })
  const [saving, setSaving] = useState(false)

  function openModal(prop: Property, certType: string) {
    setModalProp(prop)
    setModalType(certType)
    const existing = items.find((i) => i.propertyId === prop.id && i.type === certType)
    setForm({
      issueDate: existing?.issueDate ? new Date(existing.issueDate).toISOString().split('T')[0] : '',
      expiryDate: existing?.expiryDate ? new Date(existing.expiryDate).toISOString().split('T')[0] : '',
      certificateUrl: existing?.certificateUrl ?? '',
    })
    setModalOpen(true)
  }

  async function saveItem() {
    if (!modalProp) return
    setSaving(true)
    try {
      const existing = items.find((i) => i.propertyId === modalProp.id && i.type === modalType)
      if (existing) {
        await fetch(`/api/compliance/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: modalProp.id, type: modalType, ...form }),
        })
      }
      setModalOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 min-w-[200px]">Property</th>
              {certTypes.map((ct) => (
                <th key={ct} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 min-w-[90px]">
                  {ct.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties.map((prop) => (
              <tr key={prop.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#1a1a1a]">{prop.addressLine1}</p>
                  <p className="text-xs text-gray-500">{prop.area}</p>
                </td>
                {certTypes.map((ct) => {
                  const status = getStatus(items, prop.id, ct)
                  return (
                    <td key={ct} className="px-3 py-3 text-center">
                      <button
                        onClick={() => openModal(prop, ct)}
                        className={`w-8 h-8 rounded-full text-sm font-bold transition hover:opacity-80 ${statusColors[status]}`}
                        title={`${ct.replace('_', ' ')} — ${status}`}
                      >
                        {statusIcons[status]}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        {Object.entries(statusIcons).map(([k, icon]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${statusColors[k]}`}>{icon}</span>
            {k.replace('-', ' ')}
          </span>
        ))}
      </div>

      {/* Upload Modal */}
      {modalOpen && modalProp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-[#1a1a1a]">{modalType.replace('_', ' ')} — {modalProp.addressLine1}</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Issue Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expiry Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Certificate URL</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]" value={form.certificateUrl} onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveItem} disabled={saving} className="bg-[#1A3D2B] hover:bg-[#122B1E] text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
