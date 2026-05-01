'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

const MY_DOC_TYPES = [
  { value: 'ID_DOCUMENT', label: 'ID Document (passport / driving licence)' },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address' },
  { value: 'PAYSLIP', label: 'Payslip' },
  { value: 'REFERENCE', label: 'Reference' },
  { value: 'OTHER', label: 'Other' },
]

export default function TenantDocumentUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('ID_DOCUMENT')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFile(null)
    setDocType('ID_DOCUMENT')
    setError(null)
    setDone(false)
    setOpen(false)
  }

  async function handleUpload() {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      // 1. Upload file
      const fd = new FormData()
      fd.append('file', file)
      fd.append('subdir', 'tenant-docs')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error ?? 'Upload failed')
      const { url } = await uploadRes.json()

      // 2. Save document record
      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: file.name, type: docType, size: file.size, mimeType: file.type }),
      })
      if (!docRes.ok) throw new Error((await docRes.json()).error ?? 'Failed to save')

      setDone(true)
      onUploaded?.()
      setTimeout(reset, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold text-[#1A3D2B] hover:text-[#122B1E] transition"
      >
        <Upload size={15} />
        Upload document
      </button>
    )
  }

  return (
    <div className="border border-[#1A3D2B]/20 bg-[#fdf7f4] rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1a1a1a]">Upload a document</p>
        <button onClick={reset} className="text-gray-400 hover:text-gray-600 transition"><X size={16} /></button>
      </div>

      {done ? (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <FileText size={16} className="text-green-600" />
          Uploaded successfully!
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">Document type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] bg-white"
            >
              {MY_DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">File</label>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-[#1A3D2B]/50 transition"
            >
              {file ? (
                <p className="text-sm text-[#1a1a1a] font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Click to select a PDF, Word doc, or image (max 10MB)</p>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A3D2B] text-white text-sm font-semibold rounded-lg hover:bg-[#122B1E] transition disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button onClick={reset} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
