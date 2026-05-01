import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  Bed,
  Bath,
  LayoutGrid,
  Ruler,
  Zap,
  Check,
  X,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
} from 'lucide-react'
import { format } from 'date-fns'
import PhotoGallery from '@/components/public/PhotoGallery'
import PropertyCard from '@/components/public/PropertyCard'
import ViewingForm from '@/components/public/ViewingForm'
import PropertyMap from '@/components/public/PropertyMap'
import ShareButton from '@/components/public/ShareButton'
import { getFileUrl } from '@/lib/file-url'
import type { PropertyWithListing } from '@/types'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getProperty(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      listing: true,
      landlord: { include: { user: true } },
    },
  })
  return property as PropertyWithListing | null
}

async function getSimilar(property: PropertyWithListing): Promise<PropertyWithListing[]> {
  const similar = await prisma.property.findMany({
    where: {
      id: { not: property.id },
      publishedOnWeb: true,
      area: property.area,
      listing: { isNot: null },
    },
    include: { listing: true, landlord: { include: { user: true } } },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })
  return similar as PropertyWithListing[]
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getProperty(params.slug)
  if (!property) return { title: 'Property Not Found' }

  const addr = `${property.addressLine1}, ${property.area}, ${property.postcode}`
  const price = property.listing
    ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      }).format(property.listing.price)
    : ''

  return {
    title: `${addr} — ${price}${property.listingType === 'RENT' ? ' pcm' : ''}`,
    description:
      property.listing?.shortDescription ??
      `${property.bedrooms} bed ${property.propertyType.toLowerCase()} in ${property.area}. ${property.listing?.description?.slice(0, 120) ?? ''}`,
    openGraph: {
      images: property.listing?.primaryPhoto
        ? [{ url: getFileUrl(property.listing.primaryPhoto) }]
        : [],
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, listingType: string, frequency?: string | null) {
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(price)
  return listingType === 'RENT' ? `${formatted} ${frequency ?? 'pcm'}` : formatted
}

const featureConfig = [
  { key: 'furnished', label: 'Furnished' },
  { key: 'billsIncluded', label: 'Bills Included' },
  { key: 'parking', label: 'Parking' },
  { key: 'garden', label: 'Garden / Outdoor Space' },
  { key: 'balcony', label: 'Balcony / Terrace' },
  { key: 'petsAllowed', label: 'Pets Allowed' },
  { key: 'dssConsidered', label: 'DSS / Benefits Considered' },
  { key: 'studentFriendly', label: 'Student Friendly' },
] as const

// ─── Agent config ─────────────────────────────────────────────────────────────

const AGENTS = [
  {
    name: 'Bradley Czechowicz-Dolbear',
    role: 'Director & Lettings Negotiator',
    whatsapp: 'gy7gtr',
    email: 'bradley@centralgateestates.com',
    photo: null,
  },
  {
    name: 'Claire Bruce',
    role: 'Director & Property Manager',
    whatsapp: '0nr9sr',
    email: 'claire@centralgateestates.com',
    photo: null,
  },
]

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center gap-1 p-4"
      style={{
        background: '#1a1a1a',
        borderRadius: '2px',
        minWidth: '80px',
      }}
    >
      <div style={{ color: '#1A3D2B' }}>{icon}</div>
      <p
        style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#f5f2ee',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '11px',
          color: '#8a7968',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getProperty(params.slug)
  if (!property) notFound()

  const similar = await getSimilar(property)
  const { listing } = property

  const fullAddress = [
    property.addressLine1,
    property.addressLine2,
    property.area,
    property.postcode,
  ]
    .filter(Boolean)
    .join(', ')

  const agentIndex = parseInt(property.id.charCodeAt(0).toString()) % 2
  const agent = AGENTS[agentIndex]

  const isAvailableNow = listing?.availableFrom
    ? new Date(listing.availableFrom) <= new Date()
    : false

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="border-b border-[#e8e4de] py-4 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav
            className="flex items-center gap-2 text-sm"
            aria-label="Breadcrumb"
            style={{ fontFamily: 'var(--font-dm-sans)', color: '#8a7968' }}
          >
            <Link href="/properties" className="hover:text-terracotta transition-colors">
              Properties
            </Link>
            <span>/</span>
            <Link
              href={`/areas/${property.area.toLowerCase().replace(/\s+/g, '-')}`}
              className="hover:text-terracotta transition-colors"
            >
              {property.area}
            </Link>
            <span>/</span>
            <span style={{ color: '#1a1a1a' }}>{property.addressLine1}</span>
          </nav>
        </div>
      </div>

      {/* Photo gallery — full width */}
      <section className="bg-charcoal">
        <div className="max-w-7xl mx-auto">
          <PhotoGallery
            photos={listing?.photos ?? []}
            primaryPhoto={listing?.primaryPhoto}
            altBase={property.addressLine1}
          />
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ── Left column (65%) ── */}
          <div className="lg:col-span-2 space-y-12">
            {/* Price + address header */}
            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {listing && (
                    <p
                      className="mb-2 leading-none"
                      style={{
                        fontFamily: 'var(--font-syne)',
                        fontWeight: 800,
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        color: '#1a1a1a',
                      }}
                    >
                      {formatPrice(listing.price, property.listingType, listing.priceFrequency)}
                    </p>
                  )}
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      fontWeight: 500,
                      fontSize: '1.125rem',
                      color: '#1a1a1a',
                    }}
                  >
                    {property.addressLine1}
                  </p>
                  {property.addressLine2 && (
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#8a7968' }}>
                      {property.addressLine2}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#1A3D2B' }} />
                    <p
                      style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#8a7968' }}
                    >
                      {property.area}, {property.postcode}
                    </p>
                  </div>
                </div>

                {/* Availability badge */}
                {listing?.availableFrom && (
                  <div
                    className="flex items-center gap-2 px-4 py-2"
                    style={{
                      border: '1px solid #e8e4de',
                      borderRadius: '2px',
                      background: isAvailableNow ? 'rgba(34,197,94,0.08)' : 'transparent',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: isAvailableNow ? '#22c55e' : '#f59e0b' }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontWeight: 500,
                        fontSize: '13px',
                        color: isAvailableNow ? '#15803d' : '#8a7968',
                      }}
                    >
                      {isAvailableNow
                        ? 'Available now'
                        : `Available ${format(new Date(listing.availableFrom), 'd MMMM yyyy')}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Key stats strip */}
              <div className="flex flex-wrap gap-3 mt-8">
                <StatBox icon={<Bed className="w-4 h-4" />} label="Bedrooms" value={String(property.bedrooms)} />
                <StatBox icon={<Bath className="w-4 h-4" />} label="Bathrooms" value={String(property.bathrooms)} />
                <StatBox icon={<LayoutGrid className="w-4 h-4" />} label="Receptions" value={String(property.receptions)} />
                {property.sqFt && (
                  <StatBox icon={<Ruler className="w-4 h-4" />} label="Sq ft" value={property.sqFt.toLocaleString()} />
                )}
                {property.epcRating && (
                  <StatBox icon={<Zap className="w-4 h-4" />} label="EPC" value={property.epcRating} />
                )}
                {property.councilTaxBand && (
                  <StatBox
                    icon={<span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '11px' }}>CT</span>}
                    label="Council Tax"
                    value={`Band ${property.councilTaxBand}`}
                  />
                )}
              </div>
            </section>

            {/* Description */}
            {listing?.description && (
              <section>
                <h2
                  className="mb-6"
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}
                >
                  About this property
                </h2>
                <div className="prose-cge">
                  {listing.description.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Features */}
            {listing && (
              <section>
                <h2
                  className="mb-6"
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}
                >
                  Property features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featureConfig.map((f) => {
                    const val = listing[f.key as keyof typeof listing] as boolean
                    return (
                      <div key={f.key} className="flex items-center gap-3">
                        {val ? (
                          <Check
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: '#1A3D2B' }}
                          />
                        ) : (
                          <X
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: '#e8e4de' }}
                          />
                        )}
                        <span
                          style={{
                            fontFamily: 'var(--font-dm-sans)',
                            fontSize: '14px',
                            color: val ? '#1a1a1a' : '#8a7968',
                            fontWeight: val ? 500 : 400,
                          }}
                        >
                          {f.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {listing.features.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#e8e4de]">
                    <p
                      className="mb-4"
                      style={{
                        fontFamily: 'var(--font-syne)',
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#8a7968',
                      }}
                    >
                      Additional features
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {listing.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-center gap-2"
                          style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#1a1a1a' }}
                        >
                          <span className="w-1 h-1 bg-terracotta flex-shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Floorplan */}
            {listing?.floorplan && (
              <section>
                <h2
                  className="mb-5"
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}
                >
                  Floorplan
                </h2>
                <div
                  className="overflow-hidden border border-[#e8e4de]"
                  style={{ borderRadius: '2px' }}
                >
                  <Image
                    src={getFileUrl(listing.floorplan)}
                    alt="Property floorplan"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
              </section>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <section>
                <h2
                  className="mb-2"
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}
                >
                  Location
                </h2>
                <p
                  className="mb-5"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#8a7968' }}
                >
                  Approximate location shown for privacy.
                </p>
                <PropertyMap
                  lat={property.latitude}
                  lng={property.longitude}
                  address={property.addressLine1}
                  approximate
                />
              </section>
            )}

            {/* Virtual tour */}
            {listing?.virtualTourUrl && (
              <section>
                <a
                  href={listing.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 btn-primary"
                >
                  Take a virtual tour →
                </a>
              </section>
            )}
          </div>

          {/* ── Right sticky sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Viewing form card */}
              <div
                style={{
                  background: '#1a1a1a',
                  borderRadius: '2px',
                }}
              >
                <div className="p-6 border-b border-[#2a2a2a]">
                  <h3
                    style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: '#f5f2ee',
                    }}
                  >
                    Book a Viewing
                  </h3>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '13px',
                      color: '#8a7968',
                    }}
                  >
                    We&apos;ll confirm within 2 hours.
                  </p>
                </div>
                <div className="p-6">
                  <ViewingForm
                    propertyId={property.id}
                    propertyAddress={`${property.addressLine1}, ${property.area}`}
                  />
                </div>
              </div>

              {/* Agent card */}
              <div
                className="border border-[#e8e4de] p-6"
                style={{ background: '#f5f2ee', borderRadius: '2px' }}
              >
                <p
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#8a7968',
                  }}
                >
                  Your agent
                </p>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="relative w-12 h-12 flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ borderRadius: '2px', background: '#1A3D2B' }}
                  >
                    {agent.photo ? (
                      <Image
                        src={agent.photo}
                        alt={agent.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '16px', color: '#fff' }}>
                        {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-syne)',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: '#1a1a1a',
                      }}
                    >
                      {agent.name}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '12px',
                        color: '#8a7968',
                      }}
                    >
                      {agent.role}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={`https://wa.link/${agent.whatsapp}`}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-[#e8e4de] transition-colors hover:border-charcoal"
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '13px',
                      color: '#1a1a1a',
                      borderRadius: '2px',
                      textDecoration: 'none',
                    }}
                  >
                    <Phone className="w-4 h-4" style={{ color: '#8a7968' }} />
                    WhatsApp {agent.name.split(' ')[0]}
                  </a>

                  <a
                    href={`https://wa.link/${agent.whatsapp}?text=${encodeURIComponent(
                      `Hi ${agent.name}, I'm interested in ${property.addressLine1}, ${property.postcode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 transition-colors"
                    style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 600,
                      fontSize: '12px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#f5f2ee',
                      background: '#16a34a',
                      borderRadius: '2px',
                      textDecoration: 'none',
                      border: 'none',
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp {agent.name}
                  </a>

                  <a
                    href={`mailto:${agent.email}?subject=${encodeURIComponent(
                      `Enquiry: ${property.addressLine1}`
                    )}`}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-[#e8e4de] transition-colors hover:border-charcoal"
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '13px',
                      color: '#1a1a1a',
                      borderRadius: '2px',
                      textDecoration: 'none',
                    }}
                  >
                    <Mail className="w-4 h-4" style={{ color: '#8a7968' }} />
                    Email {agent.name}
                  </a>
                </div>
              </div>

              {/* Share */}
              <ShareButton title={`${property.addressLine1} — Central Gate Estates`} />
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#e8e4de]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="eyebrow mb-3">More in {property.area}</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    color: '#1a1a1a',
                  }}
                >
                  Similar properties
                </h2>
              </div>
              <Link
                href={`/properties?area=${encodeURIComponent(property.area)}`}
                className="text-sm font-medium text-terracotta hover:underline"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                See all in {property.area} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
