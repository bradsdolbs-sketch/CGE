import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PropertyCard from '@/components/public/PropertyCard'
import type { PropertyWithListing, AreaGuide } from '@/types'
import type { Metadata } from 'next'

// ─── Area Data ─────────────────────────────────────────────────────────────────

const AREA_DATA: Record<string, AreaGuide> = {
  shoreditch: {
    slug: 'shoreditch',
    displayName: 'Shoreditch',
    description: [
      "Shoreditch sits at the creative heart of East London — the place where converted warehouses became tech offices, where street art is institutional, and where you can get an espresso, a gallery visit and a vinyl record in the same block. E1 and EC2A bring together the remnants of the original rag trade, tech startups, and a hospitality scene that's been London's most reliably interesting for two decades.",
      "For renters, Shoreditch offers a dense mix of warehouse conversions, purpose-built flats and older Victorian terraces on the E1/N1 border. It's not the cheapest postcode in our patch, but the combination of transport links — the Elizabeth Line at Liverpool Street, the Overground at Shoreditch High Street, and the tube at Old Street — makes it genuinely convenient. Expect competition for quality flats. Move fast.",
    ],
    transport: [
      { name: 'Shoreditch High Street', type: 'overground', lines: ['London Overground'] },
      { name: 'Old Street', type: 'tube', lines: ['Northern'] },
      { name: 'Liverpool Street', type: 'elizabeth', lines: ['Elizabeth', 'Central', 'Circle', 'Hammersmith & City', 'Metropolitan'] },
    ],
    avgRent: { studio: 1800, oneBed: 2200, twoBed: 3000 },
    vibe: 'Creative, tech-forward, always-on',
    unsplashId: '1513635269975-59663e0ac1ad',
  },
  'bethnal-green': {
    slug: 'bethnal-green',
    displayName: 'Bethnal Green',
    description: [
      "Bethnal Green is where East London authenticity meets genuine community. E2 has long been home to Bangladeshi and Somali communities, independent market traders on Columbia Road, and — increasingly — young professionals priced out of Shoreditch who discovered that Bethnal Green has its own excellent coffee, its own parks (the excellent Victoria Park is minutes away), and its own character that resists being smoothed away.",
      "For renters, Bethnal Green is a sweet spot. Prices are lower than Shoreditch while the transport links are excellent — two tube lines at Bethnal Green, the Overground at Cambridge Heath, and direct access to the City and West End. The housing stock ranges from Victorian terraces and 1930s mansion blocks to modern new-builds. The best flats go quickly; viewings within 48 hours of listing are the norm.",
    ],
    transport: [
      { name: 'Bethnal Green', type: 'tube', lines: ['Central'] },
      { name: 'Cambridge Heath', type: 'overground', lines: ['London Overground'] },
      { name: 'Whitechapel', type: 'elizabeth', lines: ['Elizabeth', 'District', 'Hammersmith & City'] },
    ],
    avgRent: { studio: 1500, oneBed: 1800, twoBed: 2400 },
    vibe: 'Community, markets, Victoria Park',
    unsplashId: '1444084689872-7f5f09e78d62',
  },
  hackney: {
    slug: 'hackney',
    displayName: 'Hackney',
    description: [
      "London Fields, Broadway Market, Dalston — Hackney's postcodes (E8, E9, N16) cover enough variation that it almost constitutes a borough in its own right. The area has a strong arts and music identity, excellent independent restaurants and pubs, and a density of parks and green spaces that surprises people who've only seen it from the overground.",
      "Hackney tends to attract tenants who want space over location — larger flats, garden-flat conversions, and the occasional house rental are more achievable here than in Shoreditch. The Overground is the main transport link; while slower than the tube for City commuters, it connects directly to Stratford, Highbury & Islington, and Clapham Junction.",
    ],
    transport: [
      { name: 'London Fields', type: 'overground', lines: ['London Overground'] },
      { name: 'Hackney Central', type: 'overground', lines: ['London Overground'] },
      { name: 'Hackney Downs', type: 'overground', lines: ['London Overground'] },
    ],
    avgRent: { studio: 1500, oneBed: 1950, twoBed: 2600 },
    vibe: 'Arts, space, Broadway Market Saturdays',
    unsplashId: '1533929736458-ca588d08c8be',
  },
  hoxton: {
    slug: 'hoxton',
    displayName: 'Hoxton',
    description: [
      "Hoxton Square gave its name to a whole aesthetic in the early 2000s — and it's still delivering. N1 Hoxton sits between Old Street and Haggerston, with a food and bar scene that punches above its postcode. The character oscillates between industrial-chic warehouses and tight Victorian terraces, with a growing number of architect-designed new-builds filling former light-industrial sites.",
      "For renters, Hoxton is close enough to the City to be genuinely convenient (Old Street tube is a short walk), but removed enough from the Shoreditch core to offer slightly more competitive rents. The Overground at Hoxton connects quickly north and south. It's a strong choice for people who want to be in the thick of East London without paying EC2 prices.",
    ],
    transport: [
      { name: 'Hoxton', type: 'overground', lines: ['London Overground'] },
      { name: 'Old Street', type: 'tube', lines: ['Northern'] },
      { name: 'Haggerston', type: 'overground', lines: ['London Overground'] },
    ],
    avgRent: { studio: 1650, oneBed: 2100, twoBed: 2750 },
    vibe: 'Galleries, late-night bars, Old Street adjacency',
    unsplashId: '1520083689325-85d0d8bc3aa1',
  },
  whitechapel: {
    slug: 'whitechapel',
    displayName: 'Whitechapel',
    description: [
      "Whitechapel is one of the best-connected postcodes in East London — and still one of the most underrated. E1 sits at the convergence of the District, Hammersmith & City, and Elizabeth Lines, making it possible to reach the West End, Canary Wharf, Heathrow or Reading without changing trains. The Elizabeth Line arrival at Whitechapel has already begun to reshape the rental market here.",
      "The housing stock is diverse: post-war council estates alongside Victorian terraces, purpose-built flats, and converted commercial buildings. It's a genuinely multicultural area — the Whitechapel Road market, the mosque and the Altab Ali Park reflect a community character that has been here for generations. Prices remain competitive relative to the transport links on offer.",
    ],
    transport: [
      { name: 'Whitechapel', type: 'elizabeth', lines: ['Elizabeth', 'District', 'Hammersmith & City'] },
      { name: 'Aldgate East', type: 'tube', lines: ['District', 'Hammersmith & City'] },
      { name: 'Shadwell', type: 'overground', lines: ['London Overground'] },
    ],
    avgRent: { studio: 1400, oneBed: 1650, twoBed: 2200 },
    vibe: 'Connected, multicultural, value for money',
    unsplashId: '1465188162835-a4c5a11c692c',
  },
  bow: {
    slug: 'bow',
    displayName: 'Bow',
    description: [
      "Bow (E3) is where East London thins out into something more residential and, frankly, more affordable. The area around Bow Road, Mile End and Roman Road has a strong community identity, a busy market, and more green space than the central East London postcodes — Victoria Park borders it to the north, Mile End Park runs through it.",
      "For renters on a tighter budget who still want proper East London — not Stratford-adjacent — Bow is worth serious consideration. The Central and District lines at Bow Road and Mile End give reasonable access to the City and West End. The housing stock includes a lot of Victorian terraces and 1960s–70s estates, with some newer developments along the Bow Creek corridor.",
    ],
    transport: [
      { name: 'Bow Road', type: 'tube', lines: ['District', 'Hammersmith & City'] },
      { name: 'Mile End', type: 'tube', lines: ['Central', 'District', 'Hammersmith & City'] },
      { name: 'Devons Road', type: 'overground', lines: ['London Overground'] },
    ],
    avgRent: { studio: 1250, oneBed: 1550, twoBed: 2100 },
    vibe: 'Affordable, park-side, proper East End',
    unsplashId: '1571068316304-793e6c3a4ccc',
  },
  'stepney-green': {
    slug: 'stepney-green',
    displayName: 'Stepney Green',
    description: [
      "Stepney Green (E1) is one of East London's quieter corners — a residential pocket between Whitechapel, Mile End and Limehouse, with a tube station that gives quick access to the City and the West End. It's not as conspicuous as its neighbours, which means it's retained a more genuinely local character.",
      "The housing here tends towards Victorian and Edwardian terraces, with some interwar blocks and newer developments. It's a good choice for people who want the connectivity of central East London without the footfall of Shoreditch or Whitechapel — and the rents reflect that. A quieter, solid East London option.",
    ],
    transport: [
      { name: 'Stepney Green', type: 'tube', lines: ['District', 'Hammersmith & City'] },
      { name: 'Whitechapel', type: 'elizabeth', lines: ['Elizabeth'] },
      { name: 'Limehouse', type: 'overground', lines: ['London Overground'] },
    ],
    avgRent: { studio: 1350, oneBed: 1600, twoBed: 2150 },
    vibe: 'Quiet, residential, underrated',
    unsplashId: '1556909114-f6e7ad7d3136',
  },
  'stoke-newington': {
    slug: 'stoke-newington',
    displayName: 'Stoke Newington',
    description: [
      "Stoke Newington (N16) feels like a village that got absorbed into London but never quite forgot it. Church Street has independent bookshops, a farmers' market, restaurants that have been here for decades, and a pace that's notably different from the rest of inner North-East London. It's quieter, greener, and more neighbourhood-oriented than the postcodes to its south.",
      "For renters, Stoke Newington punches above its weight. The housing stock is excellent — mainly late Victorian and Edwardian terraces, many with original features still intact, alongside purpose-built mansion blocks from the same era. It's not the most tube-connected area (the nearest station is Manor House or Highbury & Islington), but the 73 and 476 buses move fast, and Rectory Road and Stoke Newington Overground stations serve the area well. Abney Park Cemetery, Clissold Park, and a genuine sense of community make it one of the most liveable parts of the CGE patch.",
    ],
    transport: [
      { name: 'Stoke Newington', type: 'overground', lines: ['London Overground'] },
      { name: 'Rectory Road', type: 'overground', lines: ['London Overground'] },
      { name: 'Manor House', type: 'tube', lines: ['Piccadilly'] },
    ],
    avgRent: { studio: 1400, oneBed: 1750, twoBed: 2350 },
    vibe: 'Village-feel, independent, park-side',
    unsplashId: '1551632436-cbf8dd35adfa',
  },
}

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return Object.keys(AREA_DATA).map((area) => ({ area }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { area: string } }): Promise<Metadata> {
  const data = AREA_DATA[params.area]
  if (!data) return { title: 'Area Not Found' }
  return {
    title: `${data.displayName} Area Guide`,
    description: `Everything you need to know about renting in ${data.displayName}, East London. Transport, average rents, and available properties.`,
  }
}

// ─── Transport icon ───────────────────────────────────────────────────────────

function TransportIcon({ type }: { type: string }) {
  if (type === 'elizabeth') {
    return <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">E</span>
  }
  if (type === 'overground') {
    return <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">O</span>
  }
  return <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">T</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AreaPage({ params }: { params: { area: string } }) {
  const data = AREA_DATA[params.area]
  if (!data) notFound()

  // Fetch properties for this area
  const properties = await prisma.property.findMany({
    where: {
      publishedOnWeb: true,
      area: { contains: data.displayName, mode: 'insensitive' },
      listing: { isNot: null },
    },
    include: { listing: true, landlord: { include: { user: true } } },
    take: 3,
    orderBy: { createdAt: 'desc' },
  }) as PropertyWithListing[]

  const formatRent = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-end overflow-hidden">
        <Image
          src={`https://images.unsplash.com/photo-${data.unsplashId}?w=1920&q=80`}
          alt={data.displayName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">{data.displayName}</span>
          </nav>
          <p className="text-terracotta-300 font-semibold text-sm uppercase tracking-wider mb-2">Area Guide</p>
          <h1 className="font-display text-4xl sm:text-5xl text-white">{data.displayName}</h1>
          <p className="text-cream-300 mt-2 text-lg">{data.vibe}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left / Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-charcoal mb-5">About {data.displayName}</h2>
              <div className="prose-cge space-y-4">
                {data.description.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            {/* Transport */}
            <section>
              <h2 className="text-xl font-bold text-charcoal mb-5">Getting around</h2>
              <div className="space-y-3">
                {data.transport.map((station) => (
                  <div key={station.name} className="bg-white rounded-xl border border-charcoal-100 p-4 flex items-start gap-3">
                    <TransportIcon type={station.type} />
                    <div>
                      <p className="font-semibold text-charcoal text-sm">{station.name}</p>
                      {station.lines && (
                        <p className="text-xs text-charcoal-400 mt-0.5">{station.lines.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Avg rent table */}
            <section>
              <h2 className="text-xl font-bold text-charcoal mb-5">Average rents in {data.displayName}</h2>
              <div className="bg-white rounded-xl border border-charcoal-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-charcoal-50 border-b border-charcoal-100">
                      <th className="text-left py-3 px-5 font-semibold text-charcoal-700">Property type</th>
                      <th className="text-right py-3 px-5 font-semibold text-charcoal-700">Avg monthly rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-100">
                    <tr>
                      <td className="py-3 px-5 text-charcoal-700">Studio</td>
                      <td className="py-3 px-5 text-right font-semibold text-charcoal">{formatRent(data.avgRent.studio)} pcm</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 text-charcoal-700">1 bedroom</td>
                      <td className="py-3 px-5 text-right font-semibold text-charcoal">{formatRent(data.avgRent.oneBed)} pcm</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 text-charcoal-700">2 bedrooms</td>
                      <td className="py-3 px-5 text-right font-semibold text-charcoal">{formatRent(data.avgRent.twoBed)} pcm</td>
                    </tr>
                  </tbody>
                </table>
                <div className="px-5 py-3 bg-charcoal-50 text-xs text-charcoal-400 border-t border-charcoal-100">
                  Averages based on current and recent listings in {data.displayName}. Updated regularly.
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* CTA */}
            <div className="bg-charcoal rounded-xl p-5 text-white">
              <h3 className="font-bold text-lg mb-2">Looking in {data.displayName}?</h3>
              <p className="text-charcoal-300 text-sm mb-4">We often have unlisted properties available before they go online. Give us a call.</p>
              <a
                href="https://wa.link/gy7gtr"
                className="flex items-center justify-center gap-2 bg-terracotta text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-terracotta-600 transition-colors w-full"
              >
                WhatsApp us
              </a>
            </div>

            {/* Nearby areas */}
            <div className="bg-white rounded-xl border border-charcoal-200 p-5">
              <h3 className="font-semibold text-charcoal mb-3 text-sm">Other areas we cover</h3>
              <div className="space-y-1">
                {Object.values(AREA_DATA)
                  .filter((a) => a.slug !== data.slug)
                  .slice(0, 5)
                  .map((a) => (
                    <Link
                      key={a.slug}
                      href={`/areas/${a.slug}`}
                      className="block text-sm text-charcoal-600 hover:text-terracotta py-1.5 border-b border-charcoal-100 last:border-0 transition-colors"
                    >
                      {a.displayName}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Properties */}
        {properties.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-charcoal">Properties in {data.displayName}</h2>
              <Link
                href={`/properties?area=${encodeURIComponent(data.displayName)}`}
                className="text-sm text-terracotta font-medium hover:text-terracotta-600 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
