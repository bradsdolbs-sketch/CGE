import Link from 'next/link'
import { CheckCircle, FileText, Search, Calendar, PenLine, Key, CreditCard, Wrench, FolderOpen, Bell, ClipboardList, LayoutDashboard } from 'lucide-react'
import FaqAccordion from '@/components/public/FaqAccordion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tenants',
  description: 'Everything you need to know about renting with Central Gate Estates in East London. How to apply, referencing, and your tenant portal.',
}

const STEPS = [
  {
    number: '01',
    title: 'Search',
    description: 'Browse our available properties online or call us to discuss what you need. We can match you before a property even hits the market.',
  },
  {
    number: '02',
    title: 'Book a Viewing',
    description: 'Book online or call us. We offer viewings Monday–Saturday including evenings. Same-day viewings are often possible.',
  },
  {
    number: '03',
    title: 'Apply',
    description: "Liked what you saw? Submit your application with ID and proof of income. We'll let you know within 24 hours if you're provisionally approved.",
  },
  {
    number: '04',
    title: 'Referencing',
    description: "We use a professional referencing agency. They'll verify your employment, income, previous landlord reference and credit history.",
  },
  {
    number: '05',
    title: 'Sign Your AST',
    description: 'Once referencing passes, your Assured Shorthold Tenancy is prepared. We sign digitally — no need to come in.',
  },
  {
    number: '06',
    title: 'Move In',
    description: 'Pay your first month and deposit. We conduct a thorough check-in inventory with photos. Keys are yours.',
  },
]

const REFERENCING_DOCS = [
  { category: 'Identity', items: ['Passport or driving licence (photo ID)', 'Proof of current address (utility bill, bank statement)'] },
  { category: 'Employment & Income', items: ['3 months\' payslips', 'Latest P60 or tax return (self-employed)', 'Employer reference letter or contact'] },
  { category: 'Tenancy History', items: ['Previous landlord contact details', 'Rental payment history (if applicable)'] },
  { category: 'Right to Rent', items: ['Original documents proving right to reside in the UK', 'This is a legal requirement — not optional'] },
]

const FAQS = [
  {
    question: 'How much deposit will I need to pay?',
    answer: "Standard deposits are capped at 5 weeks' rent (for annual rents under £50,000) under the Tenant Fees Act 2019. We register all deposits with the Tenancy Deposit Scheme (TDS) within 30 days of receipt and provide you with the prescribed information.",
  },
  {
    question: 'What does the referencing process involve?',
    answer: "Our referencing agency verifies your identity, checks your credit history, confirms your income (usually requiring income of 2.5x–3x the monthly rent), and contacts your previous landlord or employer. The process typically takes 2–5 working days. If you're a student or self-employed, we can usually work around this — just let us know.",
  },
  {
    question: 'Can I keep pets in the property?',
    answer: "This depends on the individual property and landlord. Some of our properties explicitly allow pets — look for the 'Pets Allowed' flag on listings. If a property isn't listed as pet-friendly, it's worth asking us — many landlords will consider a well-behaved, single pet with a slightly higher deposit.",
  },
  {
    question: 'How do I report a maintenance issue?',
    answer: "Log into your tenant portal and raise a maintenance request with photos and a description. For routine issues, we aim to assign a contractor within 3 working days. For emergencies (no heating in winter, water leak, broken lock), call us directly on WhatsApp any time.",
  },
  {
    question: 'What happens when my tenancy is due for renewal?',
    answer: "We'll contact you and your landlord at least 2 months before your tenancy end date to discuss renewal. We'll negotiate any rent increase on your behalf and issue a renewal agreement. If you choose not to renew, we require one month's written notice.",
  },
  {
    question: 'How much notice do I need to give to end my tenancy?',
    answer: "During a fixed term, you can only end the tenancy early if there is a break clause, or by mutual agreement with your landlord. After the fixed term, a rolling monthly tenancy requires one full calendar month's written notice. Check your AST for the specific terms of your tenancy.",
  },
  {
    question: 'Who is responsible for utility bills?',
    answer: "Unless your tenancy is bills-inclusive (clearly stated on the listing and in your AST), you are responsible for setting up and paying gas, electricity, water, and council tax from your move-in date. We recommend reading the meters on move-in day.",
  },
  {
    question: 'Am I responsible for paying council tax?',
    answer: "Yes, in the vast majority of cases. Council tax is the tenant's responsibility. There are exemptions for full-time students — you'll need a council tax exemption certificate from your university. Some HMO properties have council tax included in the rent; this will be clearly stated in your tenancy agreement.",
  },
]

export default function TenantsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0EBE0' }}>

      {/* Hero */}
      <section style={{ background: '#1e2420', padding: '100px 0 80px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '20px' }}>
            For Tenants
          </p>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#f5f2ee', letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '24px', maxWidth: '20ch' }}>
            Finding your next place<br />in East London.
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '17px', color: 'rgba(245,242,238,0.55)', lineHeight: 1.75, maxWidth: '50ch', marginBottom: '36px' }}>
            From first viewing to getting your keys — here&apos;s how it works with Central Gate Estates. No surprises, no admin fees.
          </p>
          <Link href="/properties" className="btn-primary">
            Browse properties
          </Link>
        </div>
      </section>

      {/* How to Apply */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '48px' }}>
            How to Apply
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ borderTop: '1px solid rgba(26,61,43,0.15)' }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                style={{
                  paddingTop: '28px',
                  paddingBottom: '28px',
                  paddingRight: (i % 3 < 2) ? '32px' : 0,
                  paddingLeft: (i % 3 > 0) ? '32px' : 0,
                }}
                className={[
                  i % 3 < 2 ? 'lg:border-r lg:border-[rgba(26,61,43,0.1)]' : '',
                  i >= 3 ? 'border-t border-[rgba(26,61,43,0.1)]' : '',
                  i % 2 === 1 ? 'md:border-l md:border-[rgba(26,61,43,0.1)] border-t border-[rgba(26,61,43,0.1)] lg:border-t-0' : '',
                ].filter(Boolean).join(' ')}
              >
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.15em', color: '#1A3D2B', opacity: 0.5, display: 'block', marginBottom: '12px' }}>
                  {step.number}
                </span>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '17px', color: '#1a1a1a', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.8 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referencing */}
      <section style={{ background: '#F0EBE0', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '16px' }}>
                Referencing
              </p>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '20px' }}>
                What you&apos;ll need
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.85, marginBottom: '16px' }}>
                UK law requires us to carry out referencing and Right to Rent checks on all adult tenants. This is standard practice — and it protects you too. Here&apos;s what you&apos;ll need to have ready.
              </p>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.5)', lineHeight: 1.8 }}>
                Self-employed? Student? Non-UK national? Don&apos;t worry — we deal with varied circumstances every day. Give us a call and we&apos;ll talk through your situation before you apply.
              </p>
            </div>
            <div className="space-y-3">
              {REFERENCING_DOCS.map((section) => (
                <div key={section.category} style={{ background: '#fff', borderRadius: '4px', border: '1px solid rgba(26,61,43,0.1)', padding: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#1a1a1a', marginBottom: '12px' }}>{section.category}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle size={13} style={{ color: '#1A3D2B', flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(26,26,26,0.65)', lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Portal */}
      <section style={{ background: '#1e2420', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '16px' }}>
                Your Tenant Portal
              </p>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: '#f5f2ee', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
                Everything you need, in one place
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '16px', color: 'rgba(245,242,238,0.55)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '42ch' }}>
                Once you move in, you get access to a dedicated online portal. No phone calls for routine things — just log in and it&apos;s handled.
              </p>
              <Link
                href="/demo/tenant"
                className="inline-flex items-center gap-2 transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '3px', padding: '12px 22px', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, fontSize: '13px', color: 'rgba(245,242,238,0.8)', textDecoration: 'none' }}
              >
                <LayoutDashboard size={14} />
                See the tenant portal
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: <CreditCard size={18} />, title: 'Rent payments', desc: 'View payment history and upcoming amounts at a glance.' },
                { icon: <Wrench size={18} />, title: 'Maintenance requests', desc: 'Log issues with photos. Track progress in real time.' },
                { icon: <FolderOpen size={18} />, title: 'Documents', desc: 'Download your AST, deposit certificate, check-in report and more.' },
                { icon: <ClipboardList size={18} />, title: 'Tenancy details', desc: 'Start date, end date, renewal info — always up to date.' },
                { icon: <Bell size={18} />, title: 'Notifications', desc: 'Important reminders and updates from your agent.' },
                { icon: <FileText size={18} />, title: 'Property info', desc: 'Emergency contacts, utility info, and property-specific guidance.' },
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

      {/* FAQ */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-[800px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '48px' }}>
            Frequently Asked Questions
          </p>
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1e2420', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: '#f5f2ee', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Ready to find your next place?
          </h2>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '16px', color: 'rgba(245,242,238,0.5)', marginBottom: '36px' }}>
            Browse what we have available, or get in touch and tell us what you&apos;re looking for.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/properties" className="btn-primary">Browse available properties</Link>
            <Link href="/contact" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 500, color: 'rgba(245,242,238,0.6)', textDecoration: 'none', borderBottom: '1px solid rgba(245,242,238,0.25)', paddingBottom: '1px' }}>
              Get in touch
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
