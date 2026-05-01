'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, BellOff, CheckCheck, AlertTriangle, Banknote, Wrench, Calendar, UserCheck, Eye, Info } from 'lucide-react'
import { format } from 'date-fns'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: Date
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  COMPLIANCE_EXPIRY: <AlertTriangle size={16} className="text-amber-500" />,
  RENT_ARREARS:      <Banknote size={16} className="text-red-500" />,
  MAINTENANCE_UPDATE:<Wrench size={16} className="text-blue-500" />,
  LEASE_EXPIRY:      <Calendar size={16} className="text-amber-500" />,
  INSPECTION_DUE:    <Eye size={16} className="text-purple-500" />,
  NEW_ENQUIRY:       <UserCheck size={16} className="text-green-500" />,
  VIEWING_BOOKED:    <Calendar size={16} className="text-blue-500" />,
  GENERAL:           <Info size={16} className="text-gray-400" />,
}

export default function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const router = useRouter()
  const [marking, setMarking] = useState(false)
  const [localRead, setLocalRead] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.read).map((n) => n.id))
  )

  async function markAllRead() {
    setMarking(true)
    try {
      await fetch('/api/notifications', { method: 'PUT' })
      setLocalRead(new Set(notifications.map((n) => n.id)))
      router.refresh()
    } finally {
      setMarking(false)
    }
  }

  async function markOneRead(id: string) {
    if (localRead.has(id)) return
    setLocalRead((prev) => new Set([...prev, id]))
    await fetch(`/api/notifications/${id}`, { method: 'PUT' })
    router.refresh()
  }

  const unread = notifications.filter((n) => !localRead.has(n.id))

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            disabled={marking}
            className="flex items-center gap-1.5 text-sm text-[#1A3D2B] hover:text-[#122B1E] font-medium transition disabled:opacity-50"
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-16 text-center">
          <BellOff size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">System alerts will appear here</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
        {notifications.map((n) => {
          const isRead = localRead.has(n.id)
          const icon = TYPE_ICON[n.type] ?? TYPE_ICON.GENERAL
          const inner = (
            <div
              className={`flex gap-4 px-5 py-4 transition cursor-pointer ${isRead ? 'hover:bg-gray-50' : 'bg-[#fdf7f4] hover:bg-[#fceee6]'}`}
              onClick={() => markOneRead(n.id)}
            >
              <div className="mt-0.5 flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${isRead ? 'text-gray-700' : 'font-semibold text-[#1a1a1a]'}`}>{n.title}</p>
                  {!isRead && <span className="w-2 h-2 rounded-full bg-[#1A3D2B] flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(n.createdAt), 'd MMM yyyy, HH:mm')}</p>
              </div>
            </div>
          )

          return n.link ? (
            <Link key={n.id} href={n.link}>{inner}</Link>
          ) : (
            <div key={n.id}>{inner}</div>
          )
        })}
      </div>

      {notifications.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing last {notifications.length} notifications
        </p>
      )}
    </div>
  )
}
