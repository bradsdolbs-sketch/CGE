import { prisma } from '@/lib/prisma'
import PropertyCard from '@/components/public/PropertyCard'
import type { PropertyWithListing } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Portfolio — Central Gate Estates',
  description:
    'A showcase of properties let by Central Gate Estates across East London — Shoreditch, Hackney, Bethnal Green, Hoxton and beyond.',
}

const STATUS_LABEL: Record<string, string> = {
  LET:         'LET',
  LET_AGREED:  'LET AGREED',
  OFF_MARKET:  'OFF MARKET',
  UNDER_OFFER: 'UNDER OFFER',
}

async function getPortfolioProperties(): Promise<PropertyWithListing[]> {
  const properties = await prisma.property.findMany({
    where: {
      publishedOnWeb: true,
      status: { in: ['LET', 'LET_AGREED', 'OFF_MARKET', 'UNDER_OFFER'] },
    },
    include: {
      listing: true,
      landlord: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return properties as PropertyWithListing[]
}

const AREA_STATS = [
  { area: 'Shoreditch', count: null },
  { area: 'Hackney', count: null },
  { area: 'Bethnal Green', count: null },
  { area: 'Hoxton', count: null },
]

export default async function PortfolioPage() {
  const properties = await getPortfolioProperties()

  // Group by area for the eyebrow stat
  const areas = [...new Set(properties.map((p) => p.area))].filter(Boolean)

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="border-b border-[#e8e4de] py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow mb-3">
            {properties.length} properties let · East London
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              color: '#1a1a1a',
              lineHeight: 1,
              marginBottom: '1rem',
            }}
          >
            Our{' '}
            <span style={{ color: '#1A3D2B', fontWeight: 700 }}>Portfolio</span>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '16px',
              color: '#8a7968',
              maxWidth: '560px',
              lineHeight: 1.6,
            }}
          >
            Every property we&apos;ve successfully let — a track record built street by street
            across East London.
          </p>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {properties.length === 0 ? (
          <div className="py-28 text-center">
            <p
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#1a1a1a',
                marginBottom: '0.75rem',
              }}
            >
              Portfolio coming soon
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: '#8a7968' }}>
              Check back once properties have been let.
            </p>
          </div>
        ) : (
          <>
            {/* Area pills — quick context */}
            {areas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10">
                {areas.map((area) => {
                  const count = properties.filter((p) => p.area === area).length
                  return (
                    <span
                      key={area}
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '12px',
                        color: '#8a7968',
                        border: '1px solid #e8e4de',
                        borderRadius: '2px',
                        padding: '4px 10px',
                      }}
                    >
                      {area} · {count}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant="standard"
                  badge={STATUS_LABEL[property.status] ?? property.status.replace(/_/g, ' ')}
                  badgeDark
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── CTA ── */}
      <div
        className="border-t border-[#e8e4de] py-16 px-6 lg:px-8 text-center"
        style={{ background: '#1e2420' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            color: '#f5f2ee',
            marginBottom: '0.75rem',
          }}
        >
          Looking for your next address?
        </p>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '15px',
            color: 'rgba(245,242,238,0.6)',
            marginBottom: '2rem',
          }}
        >
          Browse our current available properties or get in touch directly.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/properties" className="btn-primary">
            View available properties
          </a>
          <a
            href="/contact"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(245,242,238,0.7)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(245,242,238,0.3)',
              paddingBottom: '1px',
            }}
          >
            Contact us
          </a>
        </div>
      </div>
    </div>
  )
}
