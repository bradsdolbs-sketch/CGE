import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'

// ─── Fonts ────────────────────────────────────────────────────────────────────

const syne = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'https://centralgateestates.com'),
  title: {
    default: 'Central Gate Estates | East London Living, Done Right',
    template: '%s | Central Gate Estates',
  },
  description:
    "East London's lettings and property management specialists. Shoreditch, Bethnal Green, Hackney, Hoxton, Whitechapel and beyond. 12 years local expertise. ARLA regulated.",
  keywords: [
    'estate agents East London',
    'letting agents Shoreditch',
    'letting agents Bethnal Green',
    'letting agents Hackney',
    'property management East London',
    'flats to rent East London',
    'Central Gate Estates',
    'ARLA letting agent',
  ],
  authors: [{ name: 'Central Gate Estates Ltd' }],
  creator: 'Central Gate Estates Ltd',
  publisher: 'Central Gate Estates Ltd',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: 'Central Gate Estates',
    title: 'Central Gate Estates | East London Living, Done Right',
    description:
      "East London's lettings and property management specialists. Shoreditch, Bethnal Green, Hackney and beyond.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Central Gate Estates — East London Living, Done Right',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Central Gate Estates | East London Living, Done Right',
    description: "East London's lettings and property management specialists.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-GB"
      className={`${syne.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-cream text-charcoal antialiased" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
