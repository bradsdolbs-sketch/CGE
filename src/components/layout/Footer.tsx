import Link from 'next/link'

// ─── Social icon SVGs ─────────────────────────────────────────────────────────

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com/centralgatestates', icon: <IconInstagram /> },
  { label: 'Facebook', href: 'https://facebook.com/profile.php?id=61576161913090', icon: <IconFacebook /> },
]

const navLinks = [
  { label: 'Properties to Rent', href: '/properties' },
  { label: 'Landlords', href: '/landlords' },
  { label: 'Tenants', href: '/tenants' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const areaLinks = [
  { label: 'Shoreditch', href: '/areas/shoreditch' },
  { label: 'Bethnal Green', href: '/areas/bethnal-green' },
  { label: 'Hackney', href: '/areas/hackney' },
  { label: 'Hoxton', href: '/areas/hoxton' },
  { label: 'Whitechapel', href: '/areas/whitechapel' },
  { label: 'Bow', href: '/areas/bow' },
  { label: 'Stepney Green', href: '/areas/stepney-green' },
]

const regulatoryBadges = ['PRS', 'TDS']

// ─── Footer ───────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a1a1a', color: '#f5f2ee' }}>

      {/* Edge-to-edge editorial headline — bleeds full width */}
      <div style={{ borderBottom: '1px solid #242424', overflow: 'hidden' }}>
        <div style={{ padding: 'clamp(48px, 8vw, 96px) clamp(24px, 5vw, 64px) clamp(40px, 6vw, 72px)' }}>
          <p
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#1A3D2B',
              marginBottom: '20px',
            }}
          >
            East London Lettings
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: 'clamp(2.75rem, 8vw, 6rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#f5f2ee',
              margin: 0,
            }}
          >
            Central Gate
            <br />
            <span style={{ color: '#1A3D2B' }}>Estates.</span>
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '15px',
              color: '#8a7968',
              marginTop: '24px',
              maxWidth: '40ch',
            }}
          >
            Independent. Rooted in East London. We manage properties like they&apos;re our own — because this is our neighbourhood too.
          </p>
        </div>
      </div>

      {/* 3-column links grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-8">

          {/* Column 1: Navigate + Areas */}
          <div>
            <h3
              className="mb-5"
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#f5f2ee',
              }}
            >
              Navigate
            </h3>
            <ul className="space-y-3 mb-8">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors duration-150 hover:text-[#f5f2ee]"
                    style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#8a7968' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 mt-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="transition-colors duration-200 text-[rgba(245,242,238,0.4)] hover:text-[#1A3D2B]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Areas */}
          <div>
            <h3
              className="mb-5"
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#f5f2ee',
              }}
            >
              East London Areas
            </h3>
            <ul className="space-y-3">
              {areaLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors duration-150 hover:text-[#f5f2ee]"
                    style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#8a7968' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact + Landlord CTA */}
          <div>
            <h3
              className="mb-5"
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#f5f2ee',
              }}
            >
              Get In Touch
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.link/gy7gtr"
                  className="transition-colors duration-150 hover:text-[#f5f2ee]"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#8a7968' }}
                >
                  WhatsApp us
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@centralgateestates.com"
                  className="transition-colors duration-150 hover:text-[#f5f2ee]"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#8a7968' }}
                >
                  hello@centralgateestates.com
                </a>
              </li>
              <li style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#8a7968', lineHeight: '1.6' }}>
                4th Floor, Silverstream House, 45 Fitzroy Street<br />
                Fitzrovia, London, W1T 6EB
              </li>

              {/* WhatsApp contacts */}
              <li className="pt-1 space-y-2.5">
                <a
                  href="https://wa.link/0nr9sr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors duration-150 text-[#8a7968] hover:text-green-400"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px' }}
                  data-cursor="hover-cta"
                >
                  <span className="text-green-500 flex-shrink-0">
                    <IconWhatsApp />
                  </span>
                  WhatsApp Claire
                </a>
                <a
                  href="https://wa.link/gy7gtr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors duration-150 text-[#8a7968] hover:text-green-400"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px' }}
                  data-cursor="hover-cta"
                >
                  <span className="text-green-500 flex-shrink-0">
                    <IconWhatsApp />
                  </span>
                  WhatsApp Bradley
                </a>
              </li>
            </ul>

            {/* Landlord CTA */}
            <div
              className="mt-8 pt-8"
              style={{ borderTop: '1px solid #242424' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#f5f2ee',
                  marginBottom: '8px',
                }}
              >
                Got a property to let?
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '13px',
                  color: '#8a7968',
                  marginBottom: '16px',
                  lineHeight: 1.6,
                }}
              >
                We&apos;ll find you quality tenants, fast. No hidden fees.
              </p>
              <Link
                href="/landlords"
                className="btn-primary"
                data-cursor="hover-cta"
              >
                Landlord Info →
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom regulatory strip */}
      <div style={{ backgroundColor: '#111111', borderTop: '1px solid #1e1e1e' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p
            style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(245,242,238,0.35)' }}
          >
            &copy; {new Date().getFullYear()} Central Gate Estates Ltd. Registered in England &amp; Wales. Lettings only.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {regulatoryBadges.map((badge) => (
              <span
                key={badge}
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  color: 'rgba(245,242,238,0.4)',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
