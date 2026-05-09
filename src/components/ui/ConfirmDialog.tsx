'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus cancel button when opened (safer default)
  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Icon bar */}
        <div className={`px-6 pt-6 pb-4 flex items-start gap-4`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            destructive ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            {destructive
              ? <Trash2 className="w-5 h-5 text-red-500" />
              : <AlertTriangle className="w-5 h-5 text-amber-500" />
            }
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a] leading-snug">{title}</h3>
            <p className="text-sm text-[#6b6b6b] mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition -mt-0.5 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${
              destructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#1A3D2B] hover:bg-[#122B1E] text-white'
            }`}
          >
            {loading && (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
