'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { clsx } from 'clsx'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const PROPERTY_TYPES = [
  { value: 'FLAT', label: 'Flat' },
  { value: 'HOUSE', label: 'House' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'MAISONETTE', label: 'Maisonette' },
  { value: 'HMO', label: 'HMO' },
]

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: 'Studio' },
  { value: '1', label: '1 bed' },
  { value: '2', label: '2 beds' },
  { value: '3', label: '3 beds' },
  { value: '4', label: '4+ beds' },
]

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  // Derive state from URL
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const bedrooms = searchParams.get('bedrooms') ?? ''
  const area = searchParams.get('area') ?? ''
  const furnished = searchParams.get('furnished') === 'true'
  const petsAllowed = searchParams.get('pets') === 'true'
  const sort = searchParams.get('sort') ?? 'newest'

  const selectedTypes = searchParams.getAll('propertyType')

  const updateParams = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key)
      if (value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v))
        } else if (value !== '') {
          params.set(key, value)
        }
      }
    })
    // Reset to page 1 when filters change
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const toggleType = (type: string) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type]
    updateParams({ propertyType: next.length > 0 ? next : null })
  }

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters =
    minPrice ||
    maxPrice ||
    bedrooms ||
    area ||
    furnished ||
    petsAllowed ||
    selectedTypes.length > 0

  return (
    <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm">
      {/* Primary bar */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        {/* Area / postcode */}
        <div className="flex-1 min-w-[160px] max-w-[240px]">
          <input
            type="text"
            placeholder="Area or postcode…"
            value={area}
            onChange={(e) => updateParams({ area: e.target.value || null })}
            className="input-base text-sm h-10"
          />
        </div>

        {/* Bedrooms */}
        <div className="w-32">
          <select
            value={bedrooms}
            onChange={(e) => updateParams({ bedrooms: e.target.value || null })}
            className="input-base text-sm h-10 pr-8 appearance-none"
          >
            {BEDROOM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="w-44">
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="input-base text-sm h-10 pr-8 appearance-none"
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            expanded
              ? 'bg-charcoal text-white border-charcoal'
              : 'text-charcoal-600 border-charcoal-200 hover:bg-charcoal-50'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-terracotta" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-terracotta transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="border-t border-charcoal-100 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Min price */}
          <div>
            <label className="text-xs font-medium text-charcoal-500 mb-1.5 block">
              Min price (pcm)
            </label>
            <input
              type="number"
              placeholder="No min"
              value={minPrice}
              onChange={(e) => updateParams({ minPrice: e.target.value || null })}
              min={0}
              step={100}
              className="input-base text-sm h-10"
            />
          </div>

          {/* Max price */}
          <div>
            <label className="text-xs font-medium text-charcoal-500 mb-1.5 block">
              Max price (pcm)
            </label>
            <input
              type="number"
              placeholder="No max"
              value={maxPrice}
              onChange={(e) => updateParams({ maxPrice: e.target.value || null })}
              min={0}
              step={100}
              className="input-base text-sm h-10"
            />
          </div>

          {/* Property type */}
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-charcoal-500 mb-1.5 block">Property type</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => toggleType(type.value)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    selectedTypes.includes(type.value)
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'text-charcoal-600 border-charcoal-200 hover:border-charcoal-400'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-charcoal-700">
              <input
                type="checkbox"
                checked={furnished}
                onChange={(e) => updateParams({ furnished: e.target.checked ? 'true' : null })}
                className="w-4 h-4 rounded border-charcoal-300 text-terracotta focus:ring-terracotta"
              />
              Furnished
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-charcoal-700">
              <input
                type="checkbox"
                checked={petsAllowed}
                onChange={(e) => updateParams({ pets: e.target.checked ? 'true' : null })}
                className="w-4 h-4 rounded border-charcoal-300 text-terracotta focus:ring-terracotta"
              />
              Pets allowed
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
