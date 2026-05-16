'use client'

import { useState } from 'react'
import { MessageSquare, CheckCircle } from 'lucide-react'

export default function LandlordContactPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/landlord/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to send')
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1A3D2B] focus:border-transparent'

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
          Contact Your Agent
        </h1>
        <p className="text-sm text-[#8a7968] mt-0.5">Send a message to the Central Gate Estates team</p>
      </div>

      {sent ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
          <h2 className="font-semibold text-[#1a1a1a] text-lg mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            Message sent
          </h2>
          <p className="text-sm text-[#8a7968]">Your agent will be in touch within 1 business day.</p>
          <button
            onClick={() => { setSent(false); setSubject(''); setMessage('') }}
            className="mt-6 text-sm font-semibold text-[#1A3D2B] hover:text-[#122B1E] underline"
          >
            Send another message
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5 text-[#8a7968]">
            <MessageSquare size={16} />
            <p className="text-sm">Messages are read during office hours, Mon–Fri 9am–6pm.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wider mb-1.5">
                Subject *
              </label>
              <input
                required
                className={inputClass}
                placeholder="e.g. Renewal query, maintenance update request…"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8a7968] uppercase tracking-wider mb-1.5">
                Message *
              </label>
              <textarea
                required
                rows={6}
                className={inputClass}
                placeholder="Write your message here…"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#1A3D2B] hover:bg-[#122B1E] text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-[#8a7968]">
            <span>📧 <a href="mailto:hello@centralgateestates.com" className="underline hover:text-[#1a1a1a]">hello@centralgateestates.com</a></span>
            <span>📍 Central Gate Estates</span>
          </div>
        </div>
      )}
    </div>
  )
}
