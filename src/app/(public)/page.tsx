'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import MarqueeTicker from '@/components/ui/MarqueeTicker'
import PropertyCard from '@/components/public/PropertyCard'
import { getFileUrl } from '@/lib/file-url'
import type { PropertyWithListing } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const AREAS = [
  { name: 'Shoreditch',    slug: 'shoreditch',    avg: '£2,100 pcm' },
  { name: 'Bethnal Green', slug: 'bethnal-green', avg: '£1,750 pcm' },
  { name: 'Hackney',       slug: 'hackney',       avg: '£1,850 pcm' },
  { name: 'Hoxton',        slug: 'hoxton',        avg: '£2,000 pcm' },
  { name: 'Whitechapel',   slug: 'whitechapel',   avg: '£1,500 pcm' },
  { name: 'Bow',           slug: 'bow',           avg: '£1,400 pcm' },
  { name: 'Stepney Green',      slug: 'stepney-green',      avg: '£1,600 pcm' },
  { name: 'Stoke Newington',   slug: 'stoke-newington',    avg: '£1,750 pcm' },
]

const STATS = [
  { value: '22+', label: 'Landlords trust us' },
  { value: '100%', label: 'Transparent pricing' },
  { value: 'E1–N16', label: 'East London coverage' },
]

const STEPS = [
  {
    num: '01',
    title: 'Tell us what you need',
    body: "Area, budget, move-in date. A quick conversation is all it takes — we'll do the rest.",
  },
  {
    num: '02',
    title: 'We send you the best options',
    body: 'We match you from our live portfolio and off-market contacts. No scrolling, no dead ends.',
  },
  {
    num: '03',
    title: 'View, decide, move in',
    body: 'We arrange viewings, handle negotiations, and manage the whole process end-to-end.',
  },
]

const TEAM = [
  {
    name: 'Bradley Czechowicz-Dolbear',
    title: 'Director & Lettings Negotiator',
    bio: 'Handles viewings, tenant matching, and making sure every move-in goes without a hitch. Knows East London better than most cab drivers.',
    whatsapp: 'gy7gtr',
    whatsappLink: 'https://wa.link/gy7gtr',
  },
  {
    name: 'Claire Bruce',
    title: 'Director & Property Manager',
    bio: 'Manages landlord relationships, compliance, and day-to-day operations. The person who actually answers her phone on a Saturday.',
    whatsapp: '0nr9sr',
    whatsappLink: 'https://wa.link/0nr9sr',
  },
]

const TESTIMONIALS: { text: string; name: string; detail: string }[] = []

// ─── Reusable reveal primitives ───────────────────────────────────────────────

function RevealSection({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return <div className={className}>{children}</div>
}

function CurtainReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return <div className={className}>{children}</div>
}

// ─── Hero card stack (desktop) ────────────────────────────────────────────────

const HERO_ROTATIONS = [-2, 1, -1]

function HeroCardStack({ properties }: { properties: PropertyWithListing[] }) {
  const cards = properties.slice(0, 3)
  if (cards.length === 0) {
    // Placeholder shimmer cards when loading
    return (
      <div className="relative" style={{ height: '420px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 skeleton"
            style={{
              top: `${i * 30}px`,
              height: '200px',
              borderRadius: '4px',
              transform: `rotate(${HERO_ROTATIONS[i]}deg)`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative" style={{ height: '420px' }}>
      {cards.map((p, i) => {
        const photo = p.listing?.primaryPhoto ? getFileUrl(p.listing.primaryPhoto) : null
        const address = [p.addressLine1, p.addressLine2].filter(Boolean).join(', ')
        const price = p.listing
          ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(
              p.listing.price
            )
          : null

        return (
          <motion.div
            key={p.id}
            className="absolute left-0 right-0"
            style={{ top: `${i * 30}px`, zIndex: 3 - i }}
            initial={{ opacity: 0, y: 60, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: HERO_ROTATIONS[i] }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 + i * 0.15 }}
            whileHover={{ rotate: 0, zIndex: 10, scale: 1.02 }}
          >
            <Link href={`/properties/${p.slug}`} data-cursor="image">
              <div
                style={{
                  background: '#fff',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}
              >
                <div className="relative" style={{ aspectRatio: '16/9' }}>
                  {photo ? (
                    <Image src={photo} alt={address} fill className="object-cover" sizes="400px" />
                  ) : (
                    <div className="w-full h-full" style={{ background: '#2a2a2a' }} />
                  )}
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: '#111', lineHeight: 1.1 }}>
                    {address}
                  </p>
                  {price && (
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#1A3D2B', fontWeight: 600, marginTop: '2px' }}>
                      {price} pcm
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────

function HeroSection({ properties }: { properties: PropertyWithListing[] }) {
  const headlineLines = ['We find your', 'next', 'address.']

  return (
    <section
      style={{
        background: '#1e2420',
        marginTop: '-72px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100svh',
      }}
    >
      {/* Split layout */}
      <div
        className="flex-1 max-w-[1200px] mx-auto px-6 w-full grid md:grid-cols-[60fr_40fr] gap-12 items-center"
        style={{ paddingTop: '140px', paddingBottom: '80px' }}
      >
        {/* LEFT — type-first */}
        <div>
          <h1 className="leading-none" style={{ marginBottom: '32px' }}>
            {headlineLines.map((line, i) => (
              <span
                key={line}
                className="animate-fade-up"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 800,
                  fontSize:
                    i === 0
                      ? 'clamp(2rem, 4vw, 3.5rem)'
                      : i === 1
                      ? 'clamp(4rem, 10vw, 8rem)'
                      : 'clamp(2.5rem, 5vw, 4.5rem)',
                  color: i === 1 ? '#5db07a' : '#f5f2ee',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  animationDelay: `${0.1 + i * 0.12}s`,
                  animationFillMode: 'both',
                }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="animate-fade-up"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '17px',
              color: 'rgba(245,242,238,0.55)',
              maxWidth: '380px',
              lineHeight: 1.7,
              marginBottom: '36px',
              animationDelay: '0.45s',
              animationFillMode: 'both',
            }}
          >
            East London specialists. We match you to the right property — often before it hits the market.
          </p>

          <div
            className="flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
          >
            <Link href="/contact?enquiry=1" className="btn-primary" data-cursor="hover-cta">
              Tell us what you need
            </Link>
            <Link
              href="/properties"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                color: 'rgba(245,242,238,0.6)',
                border: '1px solid rgba(245,242,238,0.15)',
                borderRadius: '3px',
                padding: '11px 22px',
                display: 'inline-block',
              }}
            >
              Browse properties →
            </Link>
          </div>
        </div>

        {/* RIGHT — property stack, desktop only */}
        <div className="hidden md:block">
          <HeroCardStack properties={properties} />
        </div>
      </div>

      {/* Mobile horizontal card scroll */}
      {properties.length > 0 && (
        <div className="md:hidden px-6 pb-8">
          <div
            className="flex gap-4 overflow-x-auto"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}
          >
            {properties.slice(0, 3).map((p) => {
              const photo = p.listing?.primaryPhoto ? getFileUrl(p.listing.primaryPhoto) : null
              const address = [p.addressLine1, p.addressLine2].filter(Boolean).join(', ')
              return (
                <Link
                  key={p.id}
                  href={`/properties/${p.slug}`}
                  style={{ flex: '0 0 76vw', scrollSnapAlign: 'start' }}
                  data-cursor="image"
                >
                  <div style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="relative" style={{ aspectRatio: '16/9' }}>
                      {photo ? (
                        <Image src={photo} alt={address} fill className="object-cover" sizes="76vw" />
                      ) : (
                        <div className="w-full h-full" style={{ background: '#2a2a2a' }} />
                      )}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#111' }}>
                        {address}
                      </p>
                      {p.listing && (
                        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#1A3D2B', fontWeight: 600 }}>
                          {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(
                            p.listing.price
                          )}{' '}
                          pcm
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Marquee at the base of the hero */}
      <MarqueeTicker dark />
    </section>
  )
}

// ─── 2. Area Discovery ────────────────────────────────────────────────────────

function AreaDiscoverySection() {
  return (
    <section style={{ background: '#fff', padding: '100px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-16 items-start">

          {/* Editorial left */}
          <RevealSection>
            <p className="eyebrow" style={{ marginBottom: '20px' }}>Where We Work</p>
            <h2
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 800,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: '#1a1a1a',
                marginBottom: '20px',
              }}
            >
              We know these streets intimately.
            </h2>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '16px', color: '#555', lineHeight: 1.75, maxWidth: '38ch' }}>
              We&apos;ve been active in East London since 2012. We know which buildings have good management, which streets are
              quiet, and which landlords are worth your time.
            </p>
            <Link
              href="/contact?enquiry=1"
              className="inline-flex items-center gap-2 mt-8 transition-colors hover:text-[#a84e22]"
              style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#1A3D2B', fontWeight: 600 }}
              data-cursor="hover-cta"
            >
              Tell us your area <ArrowRight className="w-4 h-4" />
            </Link>
          </RevealSection>

          {/* Area list — right */}
          <RevealSection delay={0.15}>
            {AREAS.map((area, i) => (
              <Link
                key={area.slug}
                href={`/properties?area=${area.slug}`}
                className="flex items-center justify-between group"
                style={{
                  padding: '20px 0',
                  borderBottom: '1px solid #e8e4de',
                  borderTop: i === 0 ? '1px solid #e8e4de' : 'none',
                }}
              >
                <span
                  className="area-link-underline group-hover:text-[#1A3D2B] transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 700,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    color: '#1a1a1a',
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  {area.name}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#aaa', flexShrink: 0, marginLeft: '16px' }}>
                  avg {area.avg}
                </span>
              </Link>
            ))}
          </RevealSection>
        </div>
      </div>
    </section>
  )
}

// ─── 3. Listings ──────────────────────────────────────────────────────────────


function ListingsSection({ properties, loading }: { properties: PropertyWithListing[]; loading: boolean }) {

  const featured = properties[0]
  const standards = properties.slice(1, 4)

  return (
    <section style={{ background: '#f5f2ee', padding: '100px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <RevealSection>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="eyebrow" style={{ marginBottom: '12px' }}>Available Now</p>
              <h2 className="section-heading">Current lettings.</h2>
            </div>
            <Link
              href="/properties"
              className="hidden sm:flex items-center gap-1.5 transition-colors hover:text-[#a84e22] flex-shrink-0"
              style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#1A3D2B', fontWeight: 600 }}
            >
              All properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </RevealSection>

        {loading ? (
          <div className="space-y-6">
            <div className="skeleton" style={{ height: '320px', borderRadius: '4px' }} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '4px' }} />
              ))}
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>
              New properties coming soon
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: '#666', marginBottom: '28px' }}>
              We have off-market options not listed here.
            </p>
            <Link href="/contact?enquiry=1" className="btn-primary" data-cursor="hover-cta">
              Make an enquiry
            </Link>
          </div>
        ) : (
          <>
            {featured && (
              <CurtainReveal className="mb-6">
                <PropertyCard property={featured} variant="featured" />
              </CurtainReveal>
            )}

            {standards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {standards.map((p) => (
                  <PropertyCard key={p.id} property={p} variant="standard" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ─── 4. Numbers ───────────────────────────────────────────────────────────────

function NumbersSection() {
  return (
    <section style={{ background: '#F0EBE0', padding: '80px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <RevealSection>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ borderTop: '1px solid rgba(26,61,43,0.15)', paddingTop: '48px' }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  paddingRight: i < 2 ? '48px' : 0,
                  paddingLeft: i > 0 ? '48px' : 0,
                  borderRight: i < 2 ? '1px solid rgba(26,61,43,0.12)' : 'none',
                  paddingBottom: '32px',
                }}
                className={i > 0 ? 'mt-8 md:mt-0 border-t md:border-t-0 border-[rgba(26,61,43,0.12)] pt-8 md:pt-0' : ''}
              >
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    fontSize: 'clamp(3rem, 7vw, 5rem)',
                    color: '#1A3D2B',
                    lineHeight: 0.9,
                    letterSpacing: '-0.03em',
                    marginBottom: '14px',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '15px',
                    color: 'rgba(26,26,26,0.55)',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
              fontStyle: 'italic',
              color: 'rgba(26,26,26,0.45)',
              marginTop: '56px',
              maxWidth: '52ch',
              lineHeight: 1.7,
              borderTop: '1px solid rgba(26,61,43,0.12)',
              paddingTop: '36px',
            }}
          >
            &ldquo;We manage properties like they&apos;re our own — because this is our neighbourhood too.&rdquo;
          </p>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── 5. How We Work ───────────────────────────────────────────────────────────

function HowWeWorkSection() {
  return (
    <section style={{ background: '#f5f2ee', padding: '100px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <RevealSection>
          <p className="eyebrow" style={{ marginBottom: '16px' }}>The Process</p>
          <h2 className="section-heading" style={{ marginBottom: '64px' }}>
            No portals. No scrolling.
            <br />
            We do the work.
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <RevealSection key={step.num} delay={i * 0.12}>
              <div
                style={{
                  paddingRight: i < 2 ? '48px' : 0,
                  paddingLeft: i > 0 ? '48px' : 0,
                  borderRight: i < 2 ? '1px solid #e0dbd4' : 'none',
                }}
                className={i > 0 ? 'pt-12 md:pt-0 border-t md:border-t-0 border-[#e0dbd4] md:border-l md:border-r-0' : ''}
              >
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    fontSize: '4rem',
                    color: '#ddd8d0',
                    lineHeight: 1,
                    marginBottom: '20px',
                  }}
                >
                  {step.num}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    color: '#1a1a1a',
                    marginBottom: '12px',
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: '#666', lineHeight: 1.75 }}>
                  {step.body}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 6. Team ──────────────────────────────────────────────────────────────────

function TeamSection() {
  return (
    <section style={{ background: '#1e2420', padding: '100px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <RevealSection>
          <p className="eyebrow" style={{ marginBottom: '48px' }}>The Team</p>
        </RevealSection>

        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {TEAM.map((member, i) => (
            <CurtainReveal key={member.name} delay={i * 0.15}>
              <div
                style={{
                  padding: '56px 0',
                  paddingRight: i === 0 ? '56px' : 0,
                  paddingLeft: i === 1 ? '56px' : 0,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
                className={i === 1 ? 'md:border-l md:border-[rgba(255,255,255,0.08)] border-t md:border-t-0' : ''}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                    color: '#f5f2ee',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: '8px',
                  }}
                >
                  {member.name}
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(240,235,224,0.45)',
                    marginBottom: '24px',
                  }}
                >
                  {member.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '15px',
                    color: 'rgba(245,242,238,0.5)',
                    lineHeight: 1.75,
                    maxWidth: '38ch',
                    marginBottom: '32px',
                  }}
                >
                  {member.bio}
                </p>
                <a
                  href={member.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 transition-all hover:opacity-70"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '3px',
                    padding: '10px 18px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    color: 'rgba(245,242,238,0.75)',
                  }}
                  data-cursor="hover-cta"
                >
                  {/* WhatsApp icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.523 5.847L0 24l6.335-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.214-3.733.879.936-3.619-.235-.372A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  Message {member.name.split(' ')[0]}
                </a>
              </div>
            </CurtainReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 7. Testimonials ──────────────────────────────────────────────────────────

function TestimonialsSection() {
  if (TESTIMONIALS.length === 0) return null
  return (
    <section style={{ background: '#f5f2ee', padding: '100px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <RevealSection>
          <p className="eyebrow" style={{ marginBottom: '60px' }}>What Clients Say</p>
        </RevealSection>

        {TESTIMONIALS.map((t, i) => (
          <RevealSection key={t.name} delay={i * 0.1}>
            <div
              style={{
                padding: '40px 0',
                borderBottom: '1px solid #e0dbd4',
                borderTop: i === 0 ? '1px solid #e0dbd4' : 'none',
              }}
            >
              <blockquote
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                  fontStyle: 'italic',
                  color: '#1a1a1a',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  maxWidth: '70ch',
                }}
              >
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div style={{ width: '32px', height: '1px', background: '#1A3D2B', flexShrink: 0 }} />
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#888' }}>
                  <span style={{ fontWeight: 600, color: '#333' }}>{t.name}</span>
                  {' '}· {t.detail}
                </p>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  )
}

// ─── 8. Final CTA ─────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section style={{ background: '#1e2420', minHeight: '100svh', display: 'flex', alignItems: 'center', padding: '80px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6 w-full">
        <RevealSection>
          <p className="eyebrow" style={{ marginBottom: '24px' }}>Ready?</p>
          <h2
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: 'clamp(3rem, 9vw, 7rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.03em',
              color: '#f5f2ee',
              marginBottom: '56px',
            }}
          >
            Let&apos;s find your
            <br />
            <span style={{ color: '#1A3D2B' }}>next place.</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
            <a
              href="https://wa.link/gy7gtr"
              className="hover:text-[#1A3D2B] transition-colors"
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 700,
                fontSize: 'clamp(1.25rem, 3vw, 2rem)',
                color: '#f5f2ee',
                letterSpacing: '-0.01em',
              }}
            >
              WhatsApp us
            </a>
            <span
              style={{ color: 'rgba(245,242,238,0.2)', fontSize: '1.5rem' }}
              className="hidden sm:block"
            >
              ·
            </span>
            <a
              href="mailto:hello@centralgateestates.com"
              className="hover:text-[#f5f2ee] transition-colors"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: 'rgba(245,242,238,0.5)',
              }}
            >
              hello@centralgateestates.com
            </a>
          </div>

          <Link href="/contact?enquiry=1" className="btn-primary" data-cursor="hover-cta">
            Start an enquiry →
          </Link>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [properties, setProperties] = useState<PropertyWithListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/properties?limit=4&status=AVAILABLE')
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <HeroSection properties={properties} />
      <AreaDiscoverySection />
      <ListingsSection properties={properties} loading={loading} />
      <NumbersSection />
      <HowWeWorkSection />
      <TeamSection />
      <TestimonialsSection />
      <FinalCTASection />
    </>
  )
}
