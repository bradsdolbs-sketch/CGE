import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us — Central Gate Estates',
  description: "We're from East London. We know East London. Meet the Central Gate Estates team — Claire and Bradley.",
}

const TEAM = [
  {
    name: 'Claire Bruce',
    role: 'Director & Property Manager',
    bio: "Claire has been letting and managing properties in East London for nearly two decades. She knows which buildings have lift problems, which landlords are reliable, and which postcodes are about to change. She handles client relationships, compliance and operations — and she answers her phone.",
    whatsapp: '0nr9sr',
    initials: 'CB',
  },
  {
    name: 'Bradley Czechowicz-Dolbear',
    role: 'Director & Lettings Negotiator',
    bio: "Bradley runs viewings, tenant matching and contractor management. He knows East London intimately and brings that on-the-ground perspective to every application and every maintenance job.",
    whatsapp: 'gy7gtr',
    initials: 'BD',
  },
]

const VALUES = [
  {
    num: '01',
    title: 'Honest Fees',
    body: "We publish our fees. No admin fees, no check-in fees, no renewal fees disguised as 'marketing contributions'. Tenant Find: 8% + VAT. Full Management: 12% + VAT. Full stop.",
  },
  {
    num: '02',
    title: 'Local Knowledge',
    body: "We don't run nationwide. We run East London. That means we know the market, the micro-markets within it, and the quirks of individual streets and blocks that a national agent will never know.",
  },
  {
    num: '03',
    title: 'No Shortcuts',
    body: "Compliance isn't optional. We chase certificates, run proper referencing, and register deposits on time — every time. We've never been hauled before a tribunal and intend to keep it that way.",
  },
]

const COMPLIANCE = [
  { name: 'ARLA Propertymark', desc: "Members of the UK's leading letting agent professional body" },
  { name: 'PRS', desc: 'Private Rented Sector code member' },
  { name: 'ICO', desc: 'Registered with the Information Commissioner\'s Office' },
  { name: 'TDS', desc: 'Tenancy Deposit Scheme — custodial & insured' },
  { name: 'CMP', desc: 'Client Money Protection insurance in place' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0EBE0' }}>

      {/* Hero */}
      <section style={{ background: '#1e2420', padding: '100px 0 80px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '20px' }}>
            About Us
          </p>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#f5f2ee', letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '24px', maxWidth: '16ch' }}>
            We&apos;re from East London.<br />We know it.
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '17px', color: 'rgba(245,242,238,0.55)', lineHeight: 1.75, maxWidth: '50ch' }}>
            Central Gate Estates isn&apos;t a national franchise with a local office. It&apos;s a small, specialist team who know E1, E2 and EC1 the way you know your own street.
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '16px' }}>
                How we started
              </p>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '24px' }}>
                Built out of frustration with how it was done
              </h2>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: 'rgba(26,26,26,0.65)', lineHeight: 1.85 }} className="space-y-4">
                <p>
                  Central Gate Estates was founded by Claire and Bradley, after both spent years navigating East London&apos;s rental market as tenants — and getting frustrated by agents who didn&apos;t know the area, charged hidden fees, and disappeared the moment the keys were handed over.
                </p>
                <p>
                  We set out to do it differently. Every property we manage is east of the City. That&apos;s a deliberate choice — it means we stay focused, stay local, and stay accountable.
                </p>
                <p>
                  We&apos;re not trying to be the biggest agent in London. We&apos;re trying to be the best one east of Aldgate.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { value: '12+', label: 'Years in East London' },
                { value: '22+', label: 'Landlords trust us' },
                { value: '100%', label: 'Transparent pricing' },
                { value: 'E1–N16', label: 'Our patch' },
              ].map(s => (
                <div key={s.label} style={{ borderTop: '2px solid #1A3D2B', paddingTop: '16px' }}>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '2.5rem', color: '#1A3D2B', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '8px' }}>{s.value}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(26,26,26,0.5)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ background: '#1e2420', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5db07a', marginBottom: '48px' }}>
            The Team
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                style={{
                  padding: '48px 0',
                  paddingRight: i === 0 ? '56px' : 0,
                  paddingLeft: i === 1 ? '56px' : 0,
                }}
                className={i === 1 ? 'md:border-l md:border-[rgba(255,255,255,0.08)] border-t md:border-t-0 border-[rgba(255,255,255,0.08)]' : ''}
              >
                {/* Initials block */}
                <div style={{ width: '64px', height: '64px', background: 'rgba(93,176,122,0.12)', border: '1px solid rgba(93,176,122,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '20px', color: '#5db07a' }}>{member.initials}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: '#f5f2ee', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '6px' }}>
                  {member.name}
                </h2>
                <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,235,224,0.4)', marginBottom: '20px' }}>
                  {member.role}
                </p>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: 'rgba(245,242,238,0.5)', lineHeight: 1.8, maxWidth: '38ch', marginBottom: '28px' }}>
                  {member.bio}
                </p>
                <a
                  href={`https://wa.link/${member.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 transition-all hover:opacity-70"
                  style={{ border: '1px solid rgba(255,255,255,0.18)', borderRadius: '3px', padding: '10px 18px', fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500, color: 'rgba(245,242,238,0.7)', textDecoration: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.523 5.847L0 24l6.335-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.214-3.733.879.936-3.619-.235-.372A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  Message {member.name.split(' ')[0]}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: '#F0EBE0', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A3D2B', marginBottom: '48px' }}>
            How We Work
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderTop: '1px solid rgba(26,61,43,0.15)' }}>
            {VALUES.map((v, i) => (
              <div
                key={v.num}
                style={{ paddingTop: '32px', paddingRight: i < 2 ? '40px' : 0, paddingLeft: i > 0 ? '40px' : 0, borderRight: i < 2 ? '1px solid rgba(26,61,43,0.12)' : 'none' }}
                className={i > 0 ? 'border-t md:border-t-0 border-[rgba(26,61,43,0.12)] mt-6 md:mt-0 pt-6 md:pt-8' : ''}
              >
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.15em', color: '#1A3D2B', opacity: 0.5, display: 'block', marginBottom: '12px' }}>{v.num}</span>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '18px', color: '#1a1a1a', marginBottom: '12px' }}>{v.title}</h3>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: 1.8 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section style={{ background: '#fff', padding: '64px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(26,26,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '32px' }}>
            Regulated, protected and compliant
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {COMPLIANCE.map(b => (
              <div key={b.name} style={{ borderTop: '2px solid rgba(26,61,43,0.15)', paddingTop: '16px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} style={{ color: '#1A3D2B', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>{b.name}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(26,26,26,0.5)', lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1e2420', padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: '#f5f2ee', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Ready to work with us?
          </h2>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '16px', color: 'rgba(245,242,238,0.5)', marginBottom: '36px' }}>
            Whether you&apos;re a landlord looking for management or a tenant searching for your next place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/landlords" className="btn-primary">I have a property to let</Link>
            <Link href="/properties" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 500, color: 'rgba(245,242,238,0.6)', textDecoration: 'none', borderBottom: '1px solid rgba(245,242,238,0.25)', paddingBottom: '1px' }}>
              Browse properties
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
