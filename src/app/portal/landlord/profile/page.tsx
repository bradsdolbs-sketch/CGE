'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Phone, Mail, MessageCircle, Building2, Lock } from 'lucide-react'

export default function LandlordProfilePage() {
  const { data: session } = useSession()
  const [landlord, setLandlord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', companyName: '', phone: '', whatsapp: '', preferredContact: 'email', statementEmail: true, statementFrequency: 'monthly' })

  useEffect(() => {
    fetch('/api/landlords?me=true')
      .then(r => r.json())
      .then(data => {
        if (data.landlord) {
          setLandlord(data.landlord)
          setForm({ firstName: data.landlord.firstName, lastName: data.landlord.lastName, companyName: data.landlord.companyName || '', phone: data.landlord.phone || '', whatsapp: data.landlord.whatsapp || '', preferredContact: data.landlord.preferredContact, statementEmail: data.landlord.statementEmail, statementFrequency: data.landlord.statementFrequency })
        }
        setLoading(false)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!landlord) return
    setSaving(true)
    await fetch(`/api/landlords/${landlord.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-cream-200 rounded w-48" /><div className="h-48 bg-cream-200 rounded" /></div>

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-display font-600 uppercase tracking-editorial text-terracotta mb-1">Account</p>
        <h1 className="font-display font-800 text-3xl text-charcoal">Your Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal details */}
        <div className="border border-cream-200 bg-white p-6 space-y-4">
          <h2 className="font-display font-700 text-base text-charcoal flex items-center gap-2">
            <User className="w-4 h-4 text-terracotta" /> Personal Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">First Name</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta" required />
            </div>
            <div>
              <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Last Name</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Company Name (optional)</label>
            <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta" placeholder="Leave blank if personal landlord" />
          </div>
        </div>

        {/* Contact */}
        <div className="border border-cream-200 bg-white p-6 space-y-4">
          <h2 className="font-display font-700 text-base text-charcoal flex items-center gap-2">
            <Phone className="w-4 h-4 text-terracotta" /> Contact Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta" />
            </div>
            <div>
              <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">WhatsApp</label>
              <input type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+44..." className="w-full border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-2">Preferred Contact Method</label>
            <div className="flex gap-4">
              {['email', 'phone', 'whatsapp'].map(method => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="preferredContact" value={method} checked={form.preferredContact === method} onChange={e => setForm(f => ({ ...f, preferredContact: e.target.value }))} className="accent-terracotta" />
                  <span className="text-sm font-sans text-charcoal capitalize">{method}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Statement preferences */}
        <div className="border border-cream-200 bg-white p-6 space-y-4">
          <h2 className="font-display font-700 text-base text-charcoal flex items-center gap-2">
            <Mail className="w-4 h-4 text-terracotta" /> Statement Preferences
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.statementEmail} onChange={e => setForm(f => ({ ...f, statementEmail: e.target.checked }))} className="accent-terracotta w-4 h-4" />
            <span className="text-sm font-sans text-charcoal">Email me monthly statements</span>
          </label>
          <div>
            <label className="block text-xs font-display font-600 uppercase tracking-wide text-taupe mb-1">Statement Frequency</label>
            <select value={form.statementFrequency} onChange={e => setForm(f => ({ ...f, statementFrequency: e.target.value }))} className="border border-charcoal-200 bg-cream px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-terracotta">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        {/* Bank details — read only */}
        <div className="border border-cream-200 bg-cream-50 p-6">
          <h2 className="font-display font-700 text-base text-charcoal flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-taupe" /> Bank Details
          </h2>
          <p className="text-sm text-taupe">Bank details are managed securely by your agent and cannot be updated here. To change your payment details, contact us directly.</p>
          {landlord?.bankAccountName && (
            <p className="text-sm text-charcoal mt-2">Account name: <span className="font-500">{landlord.bankAccountName}</span> · Sort code: <span className="font-500">**-**-{landlord.bankSortCode?.slice(-2) || '**'}</span> · Account: <span className="font-500">****{landlord.bankAccountNumber?.slice(-4) || '****'}</span></p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="bg-terracotta text-cream font-display font-600 text-sm uppercase tracking-wide px-6 py-3 hover:bg-terracotta-600 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-green-600 font-sans">Changes saved.</span>}
        </div>
      </form>
    </div>
  )
}
