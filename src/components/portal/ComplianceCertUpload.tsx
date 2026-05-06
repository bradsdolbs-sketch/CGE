'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle } from 'lucide-react'

export default function ComplianceCertUpload({
  itemId,
  onUploaded,
}: {
  itemId: string
  onUploaded?: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      // 1. Upload file
      const fd = new FormData()
      fd.append('file', file)
      fd.append('subdir', 'compliance')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error ?? 'Upload failed')
      const { url } = await uploadRes.json()

      // 2. Attach to compliance item
      const linkRes = await fetch(`/api/portal/compliance/${itemId}/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateUrl: url }),
      })
      if (!linkRes.ok) throw new Error((await linkRes.json()).error ?? 'Failed to save')

      setDone(true)
      onUploaded?.(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle size={13} /> Uploaded
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 text-xs font-medium text-[#1A3D2B] hover:text-[#122B1E] transition disabled:opacity-50"
      >
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
