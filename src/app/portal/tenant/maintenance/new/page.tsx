'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, X, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react'

const CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'HEATING',
  'STRUCTURAL',
  'APPLIANCES',
  'GENERAL',
  'EMERGENCY',
] as const

const PRIORITIES: { value: string; label: string; description: string; warning?: boolean }[] = [
  {
    value: 'ROUTINE',
    label: 'Routine',
    description: "Non-urgent. We'll respond within 5 working days.",
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    description: 'Significant inconvenience or potential damage. Response within 24 hours.',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency',
    description: 'Immediate risk to safety or serious damage. Expect a call within 2 hours.',
    warning: true,
  },
]

interface PhotoPreview {
  file: File
  preview: string
}

export default function NewMaintenancePage() {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('ROUTINE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [requestRef, setRequestRef] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remaining = 5 - photos.length
    const toAdd = acceptedFiles.slice(0, remaining)
    const newPreviews: PhotoPreview[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...newPreviews])
  }, [photos.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
    disabled: photos.length >= 5,
  })

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!category) errs.category = 'Please select a category.'
    if (!title.trim()) errs.title = 'Please enter a title.'
    if (description.trim().length < 20) errs.description = 'Description must be at least 20 characters.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('priority', priority)
      formData.append('title', title)
      formData.append('description', description)
      photos.forEach((p) => formData.append('photos', p.file))

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to submit request')
      }

      const data = await res.json()
      setRequestRef(data.id ?? 'REF-UNKNOWN')
      setSubmitted(true)
    } catch (err: any) {
      setErrors({ form: err.message ?? 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1
          className="text-2xl font-bold text-[#1a1a1a] mb-3"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Request Submitted
        </h1>
        <p className="text-[#8a7968] mb-2">
          Your maintenance request has been received.
        </p>
        <p className="text-sm text-[#8a7968] mb-8">
          Reference: <span className="font-mono font-semibold text-[#1a1a1a]">{requestRef.slice(0, 8).toUpperCase()}</span>
        </p>
        {priority === 'EMERGENCY' && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-sm text-red-700 text-left">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertTriangle size={16} />
              Emergency — we&apos;ll call you within 2 hours
            </div>
            <p>If you&apos;re in immediate danger, call 999. For gas emergencies call National Gas Emergency: 0800 111 999.</p>
          </div>
        )}
        <Link
          href="/portal/tenant/maintenance"
          className="inline-flex items-center gap-2 bg-[#1A3D2B] text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#122B1E] transition rounded"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          View All Requests
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl pb-20 lg:pb-0">
      {/* Back link */}
      <Link
        href="/portal/tenant/maintenance"
        className="inline-flex items-center gap-2 text-sm text-[#8a7968] hover:text-[#1a1a1a] transition mb-6"
      >
        <ArrowLeft size={14} />
        Back to Maintenance
      </Link>

      <h1
        className="text-3xl font-bold text-[#1a1a1a] mb-8"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        Report an Issue
      </h1>

      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-6 text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Category <span className="text-[#1A3D2B]">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full border rounded px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] ${
              errors.category ? 'border-red-400' : 'border-[#1a1a1a]'
            }`}
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ')}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Priority <span className="text-[#1A3D2B]">*</span>
          </label>
          <div className="space-y-2">
            {PRIORITIES.map((p) => (
              <label
                key={p.value}
                className={`flex items-start gap-3 p-4 rounded border cursor-pointer transition ${
                  priority === p.value
                    ? p.warning
                      ? 'border-red-400 bg-red-50'
                      : 'border-[#1A3D2B] bg-[#f5f2ee]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                  className="mt-0.5 accent-[#1A3D2B]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1a1a1a]">{p.label}</span>
                    {p.warning && <AlertTriangle size={14} className="text-red-500" />}
                  </div>
                  <p className="text-xs text-[#8a7968] mt-0.5">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Title <span className="text-[#1A3D2B]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dripping tap in bathroom"
            className={`w-full border rounded px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] ${
              errors.title ? 'border-red-400' : 'border-[#1a1a1a]'
            }`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Description <span className="text-[#1A3D2B]">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Please describe the issue in detail. Include when it started, how severe it is, and any relevant context. (Minimum 20 characters)"
            className={`w-full border rounded px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] resize-none ${
              errors.description ? 'border-red-400' : 'border-[#1a1a1a]'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.description ? (
              <p className="text-red-500 text-xs">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-[#8a7968]">{description.length} chars</p>
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Photos <span className="text-[#8a7968] font-normal">(up to 5, optional)</span>
          </label>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-[#1A3D2B] bg-[#1A3D2B]/5'
                : photos.length >= 5
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-[#1A3D2B] hover:bg-[#f5f2ee]'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={24} className="mx-auto mb-2 text-[#8a7968]" />
            {photos.length >= 5 ? (
              <p className="text-sm text-[#8a7968]">Maximum 5 photos reached</p>
            ) : isDragActive ? (
              <p className="text-sm text-[#1A3D2B] font-medium">Drop photos here…</p>
            ) : (
              <>
                <p className="text-sm text-[#1a1a1a] font-medium">Drag & drop photos here</p>
                <p className="text-xs text-[#8a7968] mt-1">or click to browse. JPG, PNG, WebP accepted.</p>
              </>
            )}
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded overflow-hidden group">
                  <img
                    src={photo.preview}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1A3D2B] text-white py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#122B1E] transition rounded disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
