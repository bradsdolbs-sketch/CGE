'use client'

import React from 'react'

interface TickerItem {
  address: string
  area: string
  beds: number
  price: number
}

interface MarqueeTickerProps {
  items?: TickerItem[]
  staticItems?: string[]
  duration?: number
  dark?: boolean
  className?: string
}

const FALLBACK: string[] = [
  'AVAILABLE · 12 Calvert Avenue, Shoreditch · 2 BED · £2,200 PCM',
  'AVAILABLE · 67 Brick Lane, Whitechapel · 2 BED · £1,950 PCM',
  'AVAILABLE · 23 Wilton Way, Hackney · 3 BED · £2,850 PCM',
  'AVAILABLE · 8 Columbia Road, Bethnal Green · 1 BED · £1,450 PCM',
  'AVAILABLE · 14 Hoxton Square, Hoxton · 1 BED · £1,750 PCM',
]

function formatItem(item: TickerItem): string {
  const price = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(item.price)
  return `AVAILABLE · ${item.address}, ${item.area} · ${item.beds} BED · ${price} PCM`
}

export default function MarqueeTicker({
  items,
  staticItems,
  duration = 40,
  dark = true,
  className = '',
}: MarqueeTickerProps) {
  // Build display strings
  const strings: string[] =
    items && items.length > 0
      ? items.map(formatItem)
      : staticItems && staticItems.length > 0
      ? staticItems
      : FALLBACK

  const bg = dark ? '#1a1a1a' : '#f5f2ee'
  const textColor = dark ? '#8a7968' : '#1a1a1a'
  const dotColor = '#1A3D2B'
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,26,0.06)'

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        backgroundColor: bg,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        padding: '14px 0',
      }}
      aria-hidden="true" // decorative
    >
      {/* Two copies for seamless infinite loop */}
      <div
        className="animate-marquee flex whitespace-nowrap"
        style={
          { '--marquee-duration': `${duration}s` } as React.CSSProperties
        }
      >
        {[...strings, ...strings].map((text, i) => (
          <React.Fragment key={i}>
            <span
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: textColor,
                padding: '0 6px',
              }}
            >
              {text}
            </span>
            <span
              style={{
                color: dotColor,
                margin: '0 20px',
                fontSize: '6px',
                lineHeight: 1,
                alignSelf: 'center',
              }}
            >
              ●
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
