import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import PropertyCard from '@/components/public/PropertyCard'
import FilterBar from '@/components/public/FilterBar'
import type { PropertyWithListing } from '@/types'
import type { Prisma } from '@prisma/client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Properties',
  description:
    'Search flats and houses to rent in Shoreditch, Bethnal Green, Hackney, Hoxton, Whitechapel and across East London.',
}

const PAGE_SIZE = 12

interface SearchParams {
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  propertyType?: string | string[]
  area?: string
  postcode?: string
  furnished?: string
  pets?: string
  sort?: string
  page?: string
}

async function getProperties(searchParams: SearchParams): Promise<{
  properties: PropertyWithListing[]
  total: number
}> {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const skip = (page - 1) * PAGE_SIZE
  const sort = searchParams.sort ?? 'newest'

  const hasListingFilters = !!(searchParams.minPrice || searchParams.maxPrice || searchParams.furnished || searchParams.pets)
  const listingFilter: Prisma.ListingNullableRelationFilter = hasListingFilters
    ? {
        is: {
          ...(searchParams.minPrice ? { price: { gte: parseInt(searchParams.minPrice) } } : {}),
          ...(searchParams.maxPrice ? { price: { lte: parseInt(searchParams.maxPrice) } } : {}),
          ...(searchParams.furnished === 'true' ? { furnished: true } : {}),
          ...(searchParams.pets === 'true' ? { petsAllowed: true } : {}),
        },
      }
    : { isNot: null }

  const where: Prisma.PropertyWhereInput = {
    publishedOnWeb: true,
    listingType: 'RENT',
    listing: listingFilter,
    ...(searchParams.bedrooms
      ? {
          bedrooms:
            parseInt(searchParams.bedrooms) >= 4
              ? { gte: 4 }
              : { equals: parseInt(searchParams.bedrooms) },
        }
      : {}),
    ...(searchParams.area
      ? {
          OR: [
            { area: { contains: searchParams.area, mode: 'insensitive' } },
            { postcode: { startsWith: searchParams.area.toUpperCase() } },
            { town: { contains: searchParams.area, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(searchParams.propertyType
      ? {
          propertyType: {
            in: (Array.isArray(searchParams.propertyType)
              ? searchParams.propertyType
              : [searchParams.propertyType]) as Prisma.EnumPropertyTypeFilter['in'],
          },
        }
      : {}),
  }

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === 'price_asc'
      ? { listing: { price: 'asc' } }
      : sort === 'price_desc'
      ? { listing: { price: 'desc' } }
      : { createdAt: 'desc' }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        listing: true,
        landlord: { include: { user: true } },
      },
      orderBy,
      take: PAGE_SIZE,
      skip,
    }),
    prisma.property.count({ where }),
  ])

  return { properties: properties as PropertyWithListing[], total }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  searchParams,
}: {
  page: number
  total: number
  searchParams: SearchParams
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k === 'page') return
      if (Array.isArray(v)) v.forEach((val) => params.append(k, val))
      else if (v) params.set(k, v)
    })
    if (p > 1) params.set('page', String(p))
    return `/properties?${params.toString()}`
  }

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)

  return (
    <nav className="flex items-center justify-center gap-1 mt-16" aria-label="Pagination">
      {page > 1 && (
        <a
          href={buildUrl(page - 1)}
          className="px-4 py-2 text-sm font-medium transition-colors duration-150"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            color: '#8a7968',
            border: '1px solid #e8e4de',
            borderRadius: '2px',
          }}
        >
          ← Prev
        </a>
      )}
      {pages.map((p) => (
        <a
          key={p}
          href={buildUrl(p)}
          className="w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors duration-150"
          aria-current={p === page ? 'page' : undefined}
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: p === page ? 700 : 400,
            color: p === page ? '#f5f2ee' : '#1a1a1a',
            background: p === page ? '#1A3D2B' : 'transparent',
            border: p === page ? '1px solid #1A3D2B' : '1px solid #e8e4de',
            borderRadius: '2px',
            textDecoration: 'none',
          }}
        >
          {p}
        </a>
      ))}
      {page < totalPages && (
        <a
          href={buildUrl(page + 1)}
          className="px-4 py-2 text-sm font-medium transition-colors duration-150"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            color: '#8a7968',
            border: '1px solid #e8e4de',
            borderRadius: '2px',
          }}
        >
          Next →
        </a>
      )}
    </nav>
  )
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────

function SortDropdown({ current, searchParams }: { current: string; searchParams: SearchParams }) {
  const options = [
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
  ]

  const buildUrl = (sort: string) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k === 'sort' || k === 'page') return
      if (Array.isArray(v)) v.forEach((val) => params.append(k, val))
      else if (v) params.set(k, v)
    })
    params.set('sort', sort)
    return `/properties?${params.toString()}`
  }

  return (
    <div className="flex items-center gap-2">
      <span
        style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#8a7968' }}
      >
        Sort:
      </span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <a
            key={opt.value}
            href={buildUrl(opt.value)}
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
              color: current === opt.value ? '#1A3D2B' : '#8a7968',
              fontWeight: current === opt.value ? 500 : 400,
              textDecoration: 'none',
              padding: '4px 0',
              borderBottom: current === opt.value ? '2px solid #1A3D2B' : '2px solid transparent',
            }}
          >
            {opt.label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-28 text-center">
      <div
        className="w-12 h-12 flex items-center justify-center mx-auto mb-6"
        style={{ background: '#e8e4de', borderRadius: '2px' }}
      >
        <svg className="w-6 h-6" style={{ color: '#8a7968' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2
        className="mb-3"
        style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}
      >
        No properties found
      </h2>
      <p
        className="mb-8"
        style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: '#8a7968', maxWidth: '360px', margin: '0 auto 32px' }}
      >
        Try adjusting your filters, expanding your search area, or get in touch — we may have unlisted properties that match.
      </p>
      <div className="flex items-center justify-center gap-3">
        <a
          href="/properties"
          className="btn-primary"
        >
          Clear filters
        </a>
        <a
          href="/contact"
          className="btn-secondary"
          style={{ color: '#1a1a1a', borderColor: '#e8e4de' }}
        >
          Contact us
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const { properties, total } = await getProperties(searchParams)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const eyebrow = total > 0
    ? `${total} rental properties · East London`
    : `East London rentals`

  const sort = searchParams.sort ?? 'newest'

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="border-b border-[#e8e4de] py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              color: '#1a1a1a',
              lineHeight: 1,
            }}
          >
            Properties{' '}
            <span style={{ color: '#8a7968', fontWeight: 700 }}>
              to Rent
            </span>
          </h1>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-cream border-b border-[#e8e4de]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="h-14 flex items-center">
                <div className="skeleton h-8 w-96 rounded-sm" />
              </div>
            }
          >
            <FilterBar />
          </Suspense>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {properties.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Results bar */}
            <div className="flex items-center justify-between mb-8">
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '14px',
                  color: '#8a7968',
                }}
              >
                Showing {from}–{to} of {total} properties
              </p>
              <SortDropdown current={sort} searchParams={searchParams} />
            </div>

            {/* Grid — 3-col desktop, 2-col tablet, 1-col mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} variant="standard" />
              ))}
            </div>

            <Pagination page={page} total={total} searchParams={searchParams} />
          </>
        )}
      </div>
    </div>
  )
}
