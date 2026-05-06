'use client'

import { useState, useEffect, useCallback } from 'react'

interface Testimonial {
  text: string
  name: string
  detail: string
}

function GoogleStars() {
  return (
    <div className="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-label="Google">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBC05">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(26,26,26,0.45)', letterSpacing: '0.01em' }}>
        Google Reviews
      </span>
    </div>
  )
}

export default function TestimonialCarousel({
  testimonials,
  background = '#fff',
  interval = 5000,
}: {
  testimonials: Testimonial[]
  background?: string
  interval?: number
}) {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((index: number) => {
    setFading(true)
    setTimeout(() => {
      setActive(index)
      setFading(false)
    }, 280)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((active + 1) % testimonials.length)
    }, interval)
    return () => clearInterval(timer)
  }, [active, testimonials.length, interval, goTo])

  const t = testimonials[active]

  return (
    <section style={{ background, padding: '80px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="flex items-center justify-between mb-10">
          <GoogleStars />
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Review ${i + 1}`}
                style={{
                  width: i === active ? '24px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === active ? '#1A3D2B' : 'rgba(26,26,26,0.15)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity 0.28s ease, transform 0.28s ease',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 md:gap-16"
            style={{ borderTop: '1px solid rgba(26,26,26,0.08)', paddingTop: '40px' }}
          >
            <div style={{ paddingTop: '4px' }}>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '3px' }}>
                {t.name}
              </p>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(26,26,26,0.4)' }}>
                {t.detail}
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 'clamp(17px, 2vw, 22px)', color: 'rgba(26,26,26,0.78)', lineHeight: 1.7 }}>
              {t.text}
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
