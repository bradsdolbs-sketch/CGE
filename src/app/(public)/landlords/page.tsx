'use client'

import { useState } from 'react'
import { CheckCircle, PoundSterling, Wrench, FileText, ShieldCheck, Bell, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import Input, { Textarea } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const SERVICES = [
  {
    num: '01',
    name: 'Tenant Find Only',
    price: '8% + VAT',
    description: 'We find you the right tenant. You take it from there.',
    features: [
      'Professional photography',
      'OpenRent listing & portal distribution',
      'Applicant vetting & viewings',
      'Comprehensive referencing',
      'AST preparation',
      'Deposit registration',
      'Move-in day support',
    ],
    notIncluded: ['Rent collection', 'Maintenance management', 'Annual inspections'],
  },
  {
    num: '02',
    name: 'Rent Collection',
    price: '10% + VAT',
    description: "Everything in Tenant Find, plus we handle the rent so you don't have to chase.",
    features: [
      'Everything in Tenant Find',
      'Monthly rent collection',
      'Arrears management',
      'Monthly landlord statements',
      'Renewal negotiation',
      'Compliance cert reminders',
    ],
    notIncluded: ['Maintenance management', 'Annual inspections'],
  },
  {
    num: '03',
    name: 'Full Management',
    price: '12% + VAT',
    description: 'Completely hands-off. We handle everything, start to finish.',
    features: [
      'Everything in Rent Collection',
      'Full maintenance management',
      'Contractor network',
      'Annual mid-term inspections',
      'Check-in & check-out reports',
      'Compliance management (gas, EICR, EPC)',
      'Legal notices if required',
      'Deposit dispute handling',
      '24/7 emergency line',
    ],
    notIncluded: [],
    highlight: true,
  },
]

const COMPARISON_ROWS = [
  { feature: 'Photography & listings', tf: true, rc: true, fm: true },
  { feature: 'Referencing & vetting', tf: true, rc: true, fm: true },
  { feature: 'AST preparation', tf: true, rc: true, fm: true },
  { feature: 'Deposit registration', tf: true, rc: true, fm: true },
  { feature: 'Rent collection', tf: false, rc: true, fm: true },
  { feature: 'Monthly statements', tf: false, rc: true, fm: true },
  { feature: 'Arrears management', tf: false, rc: true, fm: true },
  { feature: 'Renewal negotiation', tf: false, rc: true, fm: true },
  { feature: 'Maintenance management', tf: false, rc: false, fm: true },
  { feature: 'Annual inspections', tf: false, rc: false, fm: true },
  { feature: 'Compliance certificates', tf: false, rc: false, fm: true },
  { feature: 'Legal notices', tf: false, rc: false, fm: true },
  { feature: '24/7 emergency line', tf: false, rc: false, fm: true },
]

const WHAT_WE_HANDLE = [
  'Gas Safety Certificate (annual)',
  'EICR (every 5 years)',
  'EPC assessment & rating',
  'Legionella risk assessment',
  'Maintenance coordination',
  'Contractor sourcing & management',
  'Rent collection & arrears',
  'Tenancy renewals',
  'Legal notices (S21, S8)',
  'Mid-term inspections',
  'Check-in & check-out inventories',
  'Deposit scheme management',
  'Right to Rent compliance',
  'HMO licensing (where applicable)',
]

const TESTIMONIALS = [
  {
    name: 'David H.',
    role: 'Landlord, 4 properties',
    text: "I was sceptical about switching agents. Two years on, full occupancy, zero void periods, and I only hear from them when there&apos;s something I actually need to know about. That&apos;s the deal.",
  },
  {
    name: 'Aisha K.',
    role: 'Landlord, Hackney',
    text: "Claire found tenants in 8 days. The referencing was thorough, the AST was solid, and the whole thing cost less than I expected. Will be using them for my second flat too.",
  },
  {
    name: 'Michael B.',
    role: 'Portfolio landlord, 7 units',
    text: "Bradley manages the maintenance side and I&apos;ve never had a tenant complain twice about the same thing. Fast, reliable, and the invoices are always transparent.",
  },
]

function LandlordEnquiryForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    serviceLevel: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'LANDLORD_ENQUIRY' }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please WhatsApp us.')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: 'rgba(93,176,122,0.08)', border: '1px solid rgba(93,176,122,0.2)', borderRadius: '6px', padding: '48px 32px', textAlign: 'center' }}>
        <CheckCircle style={{ color: '#5db07a', width: 40, height: 40, margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>Thanks, we&apos;ll be in touch</h3>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.7 }}>
          Expect a call from Claire or Bradley within one business day. In a hurry?{' '}
          <a href="https://wa.link/gy7gtr" style={{ color: '#1A3D2B', fontWeight: 600 }}>WhatsApp us</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} id="valuation" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" required value={form.firstName} onChange={set('firstName')} />
        <Input label="Last name" required value={form.lastName} onChange={set('lastName')} />
      </div>
      <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
      <Input label="Phone" type="tel" required value={form.phone} onChange={set('phone')} />
      <Input label="Property address" required value={form.propertyAddress} onChange={set('propertyAddress')} placeholder="e.g. 14 Columbia Road, E2" />
      <Select
        label="Service level"
        value={form.serviceLevel}
        onChange={set('serviceLevel')}
        placeholder="Choose service level…"
        options={[
          { value: 'tenant_find', label: 'Tenant Find Only (8% + VAT)' },
          { value: 'rent_collection', label: 'Rent Collection (10% + VAT)' },
          { value: 'full_management', label: 'Full Management (12% + VAT)' },
          { value: 'unsure', label: "Not sure yet — let's talk" },
        ]}
      />
      <Textarea label="Anything else?" value={form.message} onChange={set('message')} placeholder="Tell us about your property…" rows={3} />
      {status === 'error' && <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#dc2626' }}>{errorMsg}</p>}
      <Button type="submit" loading={status === 'loading'} size="lg" className="w-full">
        Get a free valuation
      </Button>
    </form>
  )
}

export default function LandlordsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0EBE0' }}>

      {/* Hero */}
      <section style={{ background: '#1e2420', padding: '100px 0 80px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '20px' }}>
            For Landlords
          </p>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#f5f2ee', letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '24px', maxWidth: '20ch' }}>
            We manage your property<br />so you don&apos;t have to.
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '17px', color: 'rgba(245,242,238,0.55)', lineHeight: 1.75, maxWidth: '50ch', marginBottom: '36px' }}>
            East London letting, done properly. Clear fees, honest advice, and a team that actually knows E1, E2 and EC1 inside out.
          </p>
          <a
            href="/landlords/valuation"
            className="btn-primary"
          >
            Get a free valuation
          </a>
        </div>
      </section>

      {/* Service tiers */}
      <section style={{ background: '#1e2420', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '48px' }}>
            Service Levels
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SERVICES.map((service) => (
              <div
                key={service.num}
                style={{
                  background: service.highlight ? '#F0EBE0' : 'rgba(255,255,255,0.04)',
                  border: service.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '36px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.15em', color: service.highlight ? 'rgba(26,61,43,0.4)' : 'rgba(245,242,238,0.3)' }}>
                      {service.num}
                    </span>
                    {service.highlight && (
                      <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1A3D2B', background: 'rgba(26,61,43,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                        Most popular
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: service.highlight ? '#1a1a1a' : 'rgba(245,242,238,0.6)', letterSpacing: '0.01em', marginBottom: '8px' }}>
                    {service.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', color: service.highlight ? '#1A3D2B' : '#f5f2ee', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '4px' }}>
                    {service.price.split(' ')[0]}
                  </p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: service.highlight ? 'rgba(26,26,26,0.5)' : 'rgba(245,242,238,0.35)', marginBottom: '16px' }}>
                    {service.price.split(' ').slice(1).join(' ')}
                  </p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: service.highlight ? 'rgba(26,26,26,0.6)' : 'rgba(245,242,238,0.45)', lineHeight: 1.7 }}>
                    {service.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5" style={{ flex: 1, marginBottom: '32px' }}>
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle size={13} style={{ color: service.highlight ? '#1A3D2B' : '#5db07a', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: service.highlight ? 'rgba(26,26,26,0.75)' : 'rgba(245,242,238,0.6)', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="/landlords/valuation"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '13px 0',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontWeight: 700,
                    fontSize: '13px',
                    letterSpacing: '0.02em',
                    textDecoration: 'none',
                    background: service.highlight ? '#1A3D2B' : 'rgba(255,255,255,0.08)',
                    color: service.highlight ? '#f5f2ee' : 'rgba(245,242,238,0.7)',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Get started →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ background: '#F0EBE0', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '32px' }}>
            What&apos;s included
          </p>
          <div className="overflow-x-auto" style={{ borderTop: '2px solid #1A3D2B' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(26,61,43,0.15)' }}>
                  <th style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 500, fontSize: '13px', color: 'rgba(26,26,26,0.5)', textAlign: 'left', padding: '16px 0', paddingRight: '24px' }}>Feature</th>
                  <th style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#1a1a1a', textAlign: 'center', padding: '16px 20px', width: '120px' }}>Tenant Find</th>
                  <th style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#1a1a1a', textAlign: 'center', padding: '16px 20px', width: '140px' }}>Rent Collection</th>
                  <th style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#1A3D2B', textAlign: 'center', padding: '16px 20px', width: '140px' }}>Full Management</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} style={{ borderBottom: '1px solid rgba(26,26,26,0.06)' }}>
                    <td style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.7)', padding: '12px 0', paddingRight: '24px' }}>{row.feature}</td>
                    <td style={{ textAlign: 'center', padding: '12px 20px' }}>
                      {row.tf ? <CheckCircle size={15} style={{ color: '#1A3D2B', margin: '0 auto' }} /> : <span style={{ color: 'rgba(26,26,26,0.2)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 20px' }}>
                      {row.rc ? <CheckCircle size={15} style={{ color: '#1A3D2B', margin: '0 auto' }} /> : <span style={{ color: 'rgba(26,26,26,0.2)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(26,61,43,0.04)' }}>
                      {row.fm ? <CheckCircle size={15} style={{ color: '#1A3D2B', margin: '0 auto' }} /> : <span style={{ color: 'rgba(26,26,26,0.2)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What we handle */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '16px' }}>
                Full Management
              </p>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '20px' }}>
                What we handle for you
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.85 }}>
                On Full Management, we take care of every legal, operational and practical aspect of your tenancy. You hear from us when there&apos;s something you need to decide — not when there&apos;s admin we can handle ourselves.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHAT_WE_HANDLE.map((item) => (
                <div key={item} className="flex items-center gap-2.5" style={{ borderTop: '1px solid rgba(26,61,43,0.12)', paddingTop: '12px' }}>
                  <CheckCircle size={13} style={{ color: '#1A3D2B', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(26,26,26,0.7)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Landlord Portal */}
      <section style={{ background: '#1e2420', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '16px' }}>
                Your Landlord Portal
              </p>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: '#f5f2ee', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
                Your portfolio, always in view
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '16px', color: 'rgba(245,242,238,0.55)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '42ch' }}>
                Every landlord we manage gets a dedicated online portal. Check your statements, approve maintenance quotes, and track compliance — without calling us.
              </p>
              <Link
                href="/demo/landlord"
                className="inline-flex items-center gap-2 transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '3px', padding: '12px 22px', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, fontSize: '13px', color: 'rgba(245,242,238,0.8)', textDecoration: 'none' }}
              >
                <LayoutDashboard size={14} />
                See the landlord portal
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: <PoundSterling size={18} />, title: 'Monthly statements', desc: 'Rent received, fees deducted, net payout — all downloadable as PDF.' },
                { icon: <Wrench size={18} />, title: 'Maintenance approval', desc: 'Review contractor quotes and approve or decline jobs directly in the portal.' },
                { icon: <FileText size={18} />, title: 'Documents', desc: 'Tenancy agreements, inspection reports, compliance certificates — all in one place.' },
                { icon: <ShieldCheck size={18} />, title: 'Compliance tracking', desc: 'See which certificates are valid, expiring, or need renewing across your portfolio.' },
                { icon: <Bell size={18} />, title: 'Notifications', desc: 'Tenancy renewals, rent arrears, inspection results — you hear first.' },
                { icon: <LayoutDashboard size={18} />, title: 'Portfolio overview', desc: 'All your properties, occupancy status, and open maintenance jobs at a glance.' },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px' }}
                >
                  <div style={{ color: '#5db07a', marginBottom: '8px' }}>{f.icon}</div>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#f5f2ee', marginBottom: '4px' }}>{f.title}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(245,242,238,0.45)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#F0EBE0', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '64px' }}>
            What Our Landlords Say
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderTop: '1px solid rgba(26,61,43,0.15)' }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                style={{
                  paddingTop: '32px',
                  paddingRight: i < 2 ? '48px' : 0,
                  paddingLeft: i > 0 ? '48px' : 0,
                  borderRight: i < 2 ? '1px solid rgba(26,61,43,0.12)' : 'none',
                }}
                className={i > 0 ? 'border-t md:border-t-0 border-[rgba(26,61,43,0.12)] mt-6 md:mt-0 pt-6 md:pt-8' : ''}
              >
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: 'rgba(26,26,26,0.7)', lineHeight: 1.85, fontStyle: 'italic', marginBottom: '24px' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>{t.name}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(26,26,26,0.45)' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valuation form */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '16px' }}>
                Free Valuation
              </p>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '20px' }}>
                Get a free rental valuation
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.85, marginBottom: '28px' }}>
                Tell us about your property and we&apos;ll come back to you within one working day with a rental valuation, a recommended service level, and a straight answer on fees.
              </p>
              <div className="space-y-3">
                {['No obligation', 'Response within 24 hours', 'No hard sell'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle size={14} style={{ color: '#1A3D2B', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.7)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#F0EBE0', borderRadius: '6px', padding: '32px', border: '1px solid rgba(26,61,43,0.1)' }}>
              <LandlordEnquiryForm />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
