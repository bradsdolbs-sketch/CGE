'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import Input, { Textarea } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const ENQUIRY_TYPES = [
  { value: 'GENERAL', label: 'General enquiry' },
  { value: 'PROPERTY', label: 'Property / viewing' },
  { value: 'LANDLORD', label: 'Landlord services' },
  { value: 'TENANT', label: 'Tenant / maintenance' },
  { value: 'VALUATION', label: 'Rental valuation' },
  { value: 'OTHER', label: 'Something else' },
]

const TEAM = [
  {
    name: 'Claire Bruce',
    role: 'Director & Property Manager',
    expertise: 'Landlord services, valuations, operations',
    whatsapp: '0nr9sr',
    initials: 'CB',
  },
  {
    name: 'Bradley Czechowicz-Dolbear',
    role: 'Director & Lettings Negotiator',
    expertise: 'Viewings, maintenance, tenant enquiries',
    whatsapp: 'gy7gtr',
    initials: 'BD',
  },
]

function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    enquiryType: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.message.trim()) e.message = 'Please write a message'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'CONTACT' }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Failed to send. Please email us directly at hello@centralgateestates.com')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: 'rgba(93,176,122,0.08)', border: '1px solid rgba(93,176,122,0.2)', borderRadius: '6px', padding: '48px 32px', textAlign: 'center' }}>
        <CheckCircle style={{ color: '#5db07a', width: 40, height: 40, margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>Message received</h3>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.7 }}>
          We&apos;ll get back to you within one working day. For urgent matters,{' '}
          <a href="https://wa.link/gy7gtr" style={{ color: '#1A3D2B', fontWeight: 600 }}>WhatsApp us</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '4px', padding: '12px 16px', color: '#dc2626' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}
      <Input label="Your name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
      <Input label="Email address" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
      <Input label="Phone number" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" helperText="Optional — helpful for quick callbacks" />
      <Select
        label="Enquiry type"
        value={form.enquiryType}
        onChange={set('enquiryType')}
        options={ENQUIRY_TYPES}
        placeholder="What's it about?"
      />
      <Textarea
        label="Your message"
        required
        value={form.message}
        onChange={set('message')}
        error={errors.message}
        rows={5}
        placeholder="Tell us what you need…"
      />
      <Button type="submit" loading={status === 'loading'} size="lg" className="w-full">
        Send message
      </Button>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(26,26,26,0.4)', textAlign: 'center' }}>
        We typically respond within one working day.
      </p>
    </form>
  )
}

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0EBE0' }}>

      {/* Hero */}
      <section style={{ background: '#1e2420', padding: '100px 0 80px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '20px' }}>
            Contact
          </p>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#f5f2ee', letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '24px', maxWidth: '18ch' }}>
            Get in touch.<br />We actually answer.
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '17px', color: 'rgba(245,242,238,0.55)', lineHeight: 1.75, maxWidth: '46ch' }}>
            Questions, valuations, maintenance — we&apos;re here. Monday–Saturday, 9am–6pm. WhatsApp any time.
          </p>
        </div>
      </section>

      {/* Main grid */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left: form */}
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '24px' }}>
                Send a message
              </p>
              <ContactForm />
            </div>

            {/* Right: info */}
            <div style={{ paddingTop: '36px' }}>
              {/* Office */}
              <div style={{ borderTop: '2px solid #1A3D2B', paddingTop: '24px', marginBottom: '40px' }}>
                <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '18px', color: '#1a1a1a', marginBottom: '16px' }}>
                  Central Gate Estates
                </p>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', lineHeight: 2, color: 'rgba(26,26,26,0.6)' }} className="space-y-1">
                  <div className="flex items-start gap-3">
                    <MapPin size={15} style={{ color: '#1A3D2B', marginTop: '4px', flexShrink: 0 }} />
                    <span>4th Floor, Silverstream House, 45 Fitzroy Street, Fitzrovia, London, W1T 6EB</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={15} style={{ color: '#1A3D2B', flexShrink: 0 }} />
                    <a href="mailto:hello@centralgateestates.com" style={{ color: 'rgba(26,26,26,0.6)', textDecoration: 'none' }}>
                      hello@centralgateestates.com
                    </a>
                  </div>
                </div>
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(26,26,26,0.08)' }}>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '12px', color: '#1a1a1a', marginBottom: '8px' }}>Office hours</p>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(26,26,26,0.55)', lineHeight: 1.9 }}>
                    <p>Monday – Friday: 9:00 – 18:00</p>
                    <p>Saturday: 10:00 – 15:00</p>
                    <p>Sunday: Closed (emergency line available)</p>
                  </div>
                </div>
              </div>

              {/* Team WhatsApp */}
              <div>
                <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '20px' }}>
                  Message the team directly
                </p>
                <div style={{ borderTop: '1px solid rgba(26,26,26,0.1)' }}>
                  {TEAM.map((member, i) => (
                    <div
                      key={member.name}
                      style={{
                        padding: '20px 0',
                        borderBottom: i < TEAM.length - 1 ? '1px solid rgba(26,26,26,0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ width: '40px', height: '40px', background: 'rgba(26,61,43,0.08)', border: '1px solid rgba(26,61,43,0.15)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '13px', color: '#1A3D2B' }}>{member.initials}</span>
                        </div>
                        <div>
                          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '2px' }}>{member.name}</p>
                          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(26,26,26,0.45)' }}>{member.expertise}</p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.link/${member.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 transition-all hover:opacity-70 flex-shrink-0"
                        style={{ border: '1px solid rgba(26,26,26,0.2)', borderRadius: '3px', padding: '8px 14px', fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500, color: '#1a1a1a', textDecoration: 'none' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.523 5.847L0 24l6.335-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.214-3.733.879.936-3.619-.235-.372A9.818 9.818 0 1112 21.818z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
