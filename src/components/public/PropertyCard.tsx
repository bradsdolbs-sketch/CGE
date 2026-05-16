'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bed, Bath, Square } from 'lucide-react'
import { getFileUrl } from '@/lib/file-url'
import type { PropertyWithListing } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyCardProps {
  property: PropertyWithListing
  /** Wide card — spans 2 grid columns, taller photo */
  wide?: boolean
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(price)
}

function statusLabel(status: string): string | null {
  if (status === 'LET' || status === 'LET_AGREED') return 'Let agreed'
  if (status === 'UNDER_OFFER') return 'Under offer'
  return null
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function PropertyCard({ property, wide = false, className = '' }: PropertyCardProps) {
  const { listing } = property
  const photo    = listing?.primaryPhoto ? getFileUrl(listing.primaryPhoto) : null
  const address  = [property.addressLine1, property.addressLine2].filter(Boolean).join(', ')
  const overline = statusLabel(property.status)

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={`group block bg-white border border-[#e8e4de] overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(26,26,26,0.10)] ${wide ? 'sm:col-span-2' : ''} ${className}`}
      style={{ borderRadius: '4px' }}
    >
      {/* Photo block */}
      <div
        className="relative overflow-hidden bg-[#e8e4de]"
        style={{ aspectRatio: wide ? '16/9' : '4/3' }}
      >
        {photo ? (
          <Image
            src={photo}
            alt={`${address} — property photo`}
            fill
            sizes={wide
              ? '(max-width: 640px) 100vw, (max-width: 1280px) 66vw, 800px'
              : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
            }
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority={wide}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ color: '#bbb', fontSize: '13px', fontFamily: 'var(--font-dm-sans)' }}>
              No photo
            </span>
          </div>
        )}

        {/* Gradient overlay — price lives here */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            background: 'linear-gradient(to top, rgba(26,26,26,0.72) 0%, transparent 100%)',
            paddingTop: '48px',
          }}
        >
          <div className="px-4 pb-3 flex items-end justify-between gap-2">
            {/* Price */}
            {listing && (
              <div className="flex items-baseline gap-1 leading-none">
                <span
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    fontSize: wide ? '1.6rem' : '1.35rem',
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {formatPrice(listing.price)}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  /{listing.priceFrequency ?? 'pcm'}
                </span>
              </div>
            )}

            {/* Status badge — only for non-available */}
            {overline && (
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#fff',
                  background: 'rgba(26,26,26,0.65)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
              >
                {overline}
              </span>
            )}
          </div>
        </div>

        {/* Neighbourhood pill — top left */}
        {property.area && (
          <div className="absolute top-3 left-3">
            <span
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#fff',
                background: '#1A3D2B',
                padding: '3px 9px',
                borderRadius: '2px',
              }}
            >
              {property.area}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 py-3.5">
        <p
          className="truncate"
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '6px',
          }}
        >
          {property.addressLine1}
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-4">
          <Spec icon={<Bed size={13} />} label={`${property.bedrooms} bed`} />
          <Spec icon={<Bath size={13} />} label={`${property.bathrooms} bath`} />
          <Spec icon={<Square size={13} />} label={property.propertyType.replace(/_/g, ' ')} />
        </div>
      </div>
    </Link>
  )
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="flex items-center gap-1"
      style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#8a7968' }}
    >
      {icon}
      {label}
    </span>
  )
}
