import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import type { ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages'
import fs from 'fs/promises'
import path from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL ?? '/uploads'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getPostcodeData(postcode: string) {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const { result } = await res.json()
    return result as {
      latitude: number
      longitude: number
      admin_district: string
      parliamentary_constituency: string
      parish: string | null
    }
  } catch {
    return null
  }
}

async function getNearbyStations(lat: number, lon: number): Promise<string[]> {
  try {
    const types = 'NaptanMetroStation,NaptanRailStation'
    const url = `https://api.tfl.gov.uk/StopPoint?lat=${lat}&lon=${lon}&stopTypes=${types}&radius=1200&useStopPointHierarchy=False&returnLines=true`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data = await res.json()
    const stops = (data.stopPoints ?? []) as Array<{
      commonName: string
      distance: number
      lines?: Array<{ id: string; name: string }>
      modes?: string[]
    }>
    // Sort by distance, deduplicate by name, take top 5
    const seen = new Set<string>()
    return stops
      .sort((a, b) => a.distance - b.distance)
      .filter((s) => {
        const key = s.commonName.replace(/ (Underground|Rail|Overground|DLR|Elizabeth line) Station$/, '')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 5)
      .map((s) => {
        const name = s.commonName.replace(/ (Underground|Rail|Overground|DLR|Elizabeth line) Station$/, '')
        const walkMins = Math.round(s.distance / 80) // ~80m/min walking
        const lines = (s.lines ?? [])
          .map((l) => l.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(', ')
        return `${name} (${walkMins} min walk${lines ? ` · ${lines}` : ''})`
      })
  } catch {
    return []
  }
}

type AllowedMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

function extToMediaType(ext: string): AllowedMediaType {
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

// Read a photo from disk (or URL) and return base64 + media type
async function photoToBase64(storedPath: string): Promise<{ base64: string; mediaType: AllowedMediaType } | null> {
  try {
    if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
      const res = await fetch(storedPath)
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      const ext = storedPath.split('.').pop()?.toLowerCase() ?? 'jpeg'
      return { base64: buf.toString('base64'), mediaType: extToMediaType(ext) }
    }

    // Local file
    let relative = storedPath
    if (relative.startsWith(UPLOAD_URL)) relative = relative.slice(UPLOAD_URL.length)
    relative = relative.replace(/^\/+/, '')
    const filePath = path.join(UPLOAD_DIR, relative)
    const buf = await fs.readFile(filePath)
    const ext = path.extname(filePath).slice(1).toLowerCase()
    return { base64: buf.toString('base64'), mediaType: extToMediaType(ext) }
  } catch {
    return null
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { propertyId } = await req.json()
    if (!propertyId) return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 })

    // ── Load property + listing from DB ──
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { listing: true },
    })
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    const photos: string[] = property.listing?.photos ?? []
    const features: string[] = property.listing?.features ?? []

    // ── Location enrichment ──
    const postcodeData = await getPostcodeData(property.postcode)
    const stations: string[] = postcodeData
      ? await getNearbyStations(postcodeData.latitude, postcodeData.longitude)
      : []

    // ── Photos → base64 (first 5 only, skip failures) ──
    const imageInputs = await Promise.all(
      photos.slice(0, 5).map((p) => photoToBase64(p))
    )
    const validImages = imageInputs.filter(Boolean) as { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }[]

    // ── Build context string ──
    const propertyContext = [
      `Property type: ${property.propertyType}`,
      `Bedrooms: ${property.bedrooms}`,
      `Bathrooms: ${property.bathrooms}`,
      `Address: ${property.addressLine1}${property.addressLine2 ? ', ' + property.addressLine2 : ''}`,
      `Area: ${property.area}`,
      `Postcode: ${property.postcode}`,
      property.sqFt ? `Floor area: ${property.sqFt} sq ft` : null,
      property.epcRating ? `EPC rating: ${property.epcRating}` : null,
      property.listing?.price ? `Monthly rent: £${property.listing.price.toLocaleString()}` : null,
      property.listing?.furnished ? 'Furnished' : null,
      property.listing?.garden ? 'Has garden' : null,
      property.listing?.balcony ? 'Has balcony' : null,
      property.listing?.parking ? 'Has parking' : null,
      property.listing?.billsIncluded ? 'Bills included' : null,
      property.listing?.petsAllowed ? 'Pets allowed' : null,
      features.length > 0 ? `Notable features: ${features.join(', ')}` : null,
      stations.length > 0 ? `Nearby stations: ${stations.join('; ')}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    // ── System prompt ──
    const system = `You are the listings copywriter for Central Gate Estates, a boutique letting agency operating exclusively in East London (E1, E2, E8, N1, N16 and surrounding postcodes).

Your job is to write one property listing description per request. These appear on Rightmove and the CGE website.

VOICE: Direct, honest, locally knowledgeable. You sound like someone who has lived in this part of London for years and knows every street. Not a salesperson. Not breathless. Confident but not pushy.

ABSOLUTELY BANNED — never use any of these words or phrases:
stunning, immaculate, rarely available, must-see, boasting, featuring, ideally located, well-appointed, sought-after, dream home, viewing is essential, conveniently located, beautiful, gorgeous, spacious (say the actual size), bright and airy, light-filled, flooded with light, deceptively spacious, nestled, charming, cosy, characterful, bespoke, luxury, high-spec, contemporary, modern, thoughtfully, tastefully, meticulously, superbly, beautifully presented, in excellent condition, is a credit to the owner, the heart of the home, perfect for professionals/couples/families (never target demographics).

STRUCTURE — 3 paragraphs, no bullet points, no headers:
1. First paragraph (2-3 sentences): What the property is and what makes it worth renting. The core proposition. Be specific and honest.
2. Second paragraph (3-4 sentences): The flat/house itself. Use what you can actually see in the photos. Describe specific rooms, finishes, layout flow. If the kitchen looks recently fitted, say "recently fitted kitchen". If there are high ceilings, say "high ceilings". If the bathroom is simple but functional, say that honestly. Do not invent features.
3. Third paragraph (3-4 sentences): The location. Name specific stations with realistic walking times. Name actual streets, markets, cafes, parks, or local landmarks that someone in this postcode would recognise. Capture the character of the specific neighbourhood — E2 Bethnal Green is not the same as E1 Whitechapel or E8 Hackney.

LENGTH: 160–220 words total.

DO NOT start with "This flat", "This property", "Located in", or the street name. DO NOT end with a call to action or an invitation to view. Write in present tense.`

    // ── Build the message content ──
    const content: (ImageBlockParam | TextBlockParam)[] = []

    // Add photos first so Claude sees them before reading the brief
    for (const img of validImages) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
      })
    }

    content.push({
      type: 'text',
      text: `Write a listing description for the following property. Use the photos above to inform your description of the interior.\n\n${propertyContext}\n\nWrite the description now. No preamble, no commentary — just the three paragraphs.`,
    })

    // ── Call Claude ──
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content }],
    })

    const description = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    return NextResponse.json({ description })
  } catch (err) {
    console.error('[generate-description]', err)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
