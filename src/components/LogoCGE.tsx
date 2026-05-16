import React from 'react'

interface LogoCGEProps {
  /**
   * size: controls the height of the mark
   * 'xs' = 24px | 'sm' = 32px | 'md' = 40px | 'lg' = 52px | 'xl' = 64px
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * variant:
   *  'mark'       — just the dark square monogram (default for nav contexts)
   *  'horizontal' — mark + "Central Gate Estates" side by side (for light bg contexts)
   *  'stacked'    — mark + full name stacked (for login / email)
   */
  variant?: 'mark' | 'horizontal' | 'stacked'
  /**
   * onDark: true when placed on a dark background
   * Affects the text colour in horizontal/stacked variants
   */
  onDark?: boolean
  className?: string
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 64,
}

/** CGE editorial-serif monogram mark */
function Mark({ size }: { size: number }) {
  // The mark is always square; font size scales proportionally
  const fs = Math.round(size * 0.56)       // letter size ≈ 56% of mark height
  const subFs = Math.round(size * 0.095)   // "SINCE 2024" font size
  const letterY = Math.round(size * 0.66)  // baseline for CGE
  const subY = Math.round(size * 0.86)     // baseline for SINCE 2024
  const cx = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CGE logo"
    >
      {/* Dark background */}
      <rect width={size} height={size} rx={Math.round(size * 0.08)} fill="#1a1a1a" />

      {/* CGE monogram — editorial serif italic */}
      <text
        x={cx}
        y={letterY}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={fs}
        fontStyle="italic"
        fontWeight="400"
        fill="white"
        textAnchor="middle"
        letterSpacing={-Math.round(fs * 0.1)}
      >
        CGE
      </text>

      {/* SINCE 2024 — spaced small caps */}
      <text
        x={cx}
        y={subY}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={subFs}
        fill="white"
        textAnchor="middle"
        letterSpacing={Math.round(subFs * 0.38)}
        opacity="0.55"
      >
        SINCE 2024
      </text>
    </svg>
  )
}

export default function LogoCGE({
  size = 'md',
  variant = 'mark',
  onDark = false,
  className = '',
}: LogoCGEProps) {
  const h = SIZE_MAP[size]

  const mark = <Mark size={h} />

  if (variant === 'mark') {
    return <span className={className}>{mark}</span>
  }

  // Text colour for name / portal label
  const nameColour = onDark ? 'rgba(245,242,238,0.9)' : '#1a1a1a'
  const subColour  = onDark ? 'rgba(245,242,238,0.45)' : 'rgba(26,26,26,0.45)'
  const nameFontSize = Math.round(h * 0.38)
  const subFontSize  = Math.round(h * 0.21)

  if (variant === 'horizontal') {
    return (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        {mark}
        <span style={{ lineHeight: 1 }}>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-syne, Syne, sans-serif)',
              fontWeight: 700,
              fontSize: nameFontSize,
              letterSpacing: '-0.01em',
              color: nameColour,
            }}
          >
            Central Gate
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-syne, Syne, sans-serif)',
              fontWeight: 700,
              fontSize: nameFontSize,
              letterSpacing: '-0.01em',
              color: '#1A3D2B',
            }}
          >
            Estates
          </span>
        </span>
      </span>
    )
  }

  // stacked
  return (
    <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <Mark size={Math.round(h * 1.4)} />
      <span style={{ lineHeight: 1, textAlign: 'center' }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
            fontWeight: 700,
            fontSize: Math.round(h * 0.35),
            letterSpacing: '-0.01em',
            color: nameColour,
          }}
        >
          Central Gate Estates
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
            fontWeight: 400,
            fontSize: Math.round(h * 0.2),
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: subColour,
            marginTop: '4px',
          }}
        >
          Portal Login
        </span>
      </span>
    </span>
  )
}
