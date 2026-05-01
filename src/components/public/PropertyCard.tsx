'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bed, Bath, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import { getFileUrl } from '@/lib/file-url'
import type { PropertyWithListing } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyCardProps {
  property: PropertyWithListing
  variant?: 'featured' | 'standard'
  className?: string
  badge?: string       // overrides the default "TO RENT" badge text
  badgeDark?: boolean  // use dark badge instead of terracotta
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(price)
}

// ─── Standard card — polaroid lift ────────────────────────────────────────────

function StandardCard({ property, className, badge, badgeDark }: { property: PropertyWithListing; className?: string; badge?: string; badgeDark?: boolean }) {
  const { listing } = property
  const photo = listing?.primaryPhoto ? getFileUrl(listing.primaryPhoto) : null
  const address = [property.addressLine1, property.addressLine2].filter(Boolean).join(', ')

  return (
    <motion.div
      className={`polaroid-card ${className ?? ''}`}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <Link href={`/properties/${property.slug}`} className="block">
        <article
          style={{
            background: '#fff',
            boxShadow: '0 2px 8px rgba(26,26,26,0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
            transition: 'box-shadow 0.25s ease',
          }}
        >
          {/* Image 4:3 */}
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: '4/3' }}
            data-cursor="image"
          >
            {photo ? (
              <Image
                src={photo}
                alt={`${address} — property photo`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#f0ede9' }}>
                <span style={{ color: '#bbb', fontSize: '13px', fontFamily: 'var(--font-dm-sans)' }}>
                  No photo available
                </span>
              </div>
            )}

            {/* Status badge — rotated sticker feel */}
            <div className="absolute top-3 left-3" style={{ transform: 'rotate(-1.5deg)' }}>
              <span
                className="text-white text-xs font-semibold px-2.5 py-1"
                style={{
                  background: badgeDark ? '#1a1a1a' : '#1A3D2B',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-syne)',
                  letterSpacing: '0.06em',
                }}
              >
                {badge ?? 'TO RENT'}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px 16px' }}>
            {/* Price — Syne 800, dominant element */}
            {listing && (
              <div className="flex items-baseline gap-1.5" style={{ marginBottom: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#111',
                    lineHeight: 1,
                  }}
                >
                  {formatPrice(listing.price)}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#999' }}>
                  /{listing.priceFrequency ?? 'pcm'}
                </span>
              </div>
            )}

            <p className="truncate" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#444', fontWeight: 500 }}>
              {address}
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#999', marginTop: '2px' }}>
              {property.area} · {property.postcode}
            </p>

            <div className="flex items-center flex-wrap" style={{ gap: '10px', marginTop: '10px' }}>
              {[
                { icon: <Bed className="w-3.5 h-3.5" />, label: `${property.bedrooms} bed` },
                { icon: <Bath className="w-3.5 h-3.5" />, label: `${property.bathrooms} bath` },
                { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: property.propertyType },
              ].map((f) => (
                <span
                  key={f.label}
                  className="flex items-center gap-1"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#777' }}
                >
                  {f.icon}
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

// ─── Featured card — dark editorial split ─────────────────────────────────────

function FeaturedCard({ property, className }: { property: PropertyWithListing; className?: string }) {
  const { listing } = property
  const photo = listing?.primaryPhoto ? getFileUrl(listing.primaryPhoto) : null
  const address = [property.addressLine1, property.addressLine2].filter(Boolean).join(', ')

  return (
    <Link href={`/properties/${property.slug}`} className={`block group ${className ?? ''}`}>
      <div
        className="grid md:grid-cols-2 overflow-hidden"
        style={{ background: '#1a1a1a', borderRadius: '4px', minHeight: '320px' }}
      >
        {/* Image — left */}
        <motion.div
          className="relative overflow-hidden"
          style={{ minHeight: '280px' }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          data-cursor="image"
        >
          {photo ? (
            <Image
              src={photo}
              alt={`${address} — property photo`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#2a2a2a' }}>
              <span style={{ color: '#555', fontSize: '13px', fontFamily: 'var(--font-dm-sans)' }}>
                No photo available
              </span>
            </div>
          )}
          <div className="absolute top-4 left-4" style={{ transform: 'rotate(-1.5deg)' }}>
            <span
              className="text-white text-xs font-semibold px-2.5 py-1"
              style={{
                background: '#1A3D2B',
                borderRadius: '3px',
                fontFamily: 'var(--font-syne)',
                letterSpacing: '0.06em',
              }}
            >
              TO RENT
            </span>
          </div>
        </motion.div>

        {/* Dark right panel */}
        <div
          style={{
            padding: '32px 28px',
            background: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {listing && (
            <div className="flex items-baseline gap-1.5" style={{ marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#1A3D2B',
                  lineHeight: 1,
                }}
              >
                {formatPrice(listing.price)}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(245,242,238,0.4)' }}>
                /{listing.priceFrequency ?? 'pcm'}
              </span>
            </div>
          )}

          <h3
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#f5f2ee',
              lineHeight: 1.1,
              marginBottom: '8px',
            }}
          >
            {address}
          </h3>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(245,242,238,0.4)', marginBottom: '20px' }}>
            {property.area} · {property.postcode}
          </p>

          <div className="flex items-center flex-wrap" style={{ gap: '16px', marginBottom: '28px' }}>
            {[
              { icon: <Bed className="w-3.5 h-3.5" />, label: `${property.bedrooms} bed` },
              { icon: <Bath className="w-3.5 h-3.5" />, label: `${property.bathrooms} bath` },
              { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: property.propertyType },
            ].map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(245,242,238,0.5)' }}
              >
                {f.icon}
                {f.label}
              </span>
            ))}
          </div>

          <span className="btn-primary self-start" data-cursor="hover-cta">
            View Property →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PropertyCard({ property, variant = 'standard', className, badge, badgeDark }: PropertyCardProps) {
  if (variant === 'featured') {
    return <FeaturedCard property={property} className={className} />
  }
  return <StandardCard property={property} className={className} badge={badge} badgeDark={badgeDark} />
}
