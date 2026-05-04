import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Per-IP rate limit (in-memory, resets on restart) ────────────────────────
const ipHits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ─── GET /api/leads (admin/agent only) ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const track = searchParams.get('track')
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const leads = await prisma.propertyLead.findMany({
    where: {
      ...(track ? { track: track as never } : {}),
      ...(status ? { status: status as never } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { postcode: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leads)
}

// ─── POST /api/leads (public — valuation bot) ────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()

  // Honeypot check
  if (body.website) {
    return NextResponse.json({ ok: true }) // Silent drop
  }

  const {
    name,
    email,
    phone,
    postcode,
    inCatchment,
    bedrooms,
    propertyType,
    condition,
    furnishing,
    sqft,
    features,
    epcRating,
    estimatedRentLow,
    estimatedRentHigh,
    serviceInterest,
    timing,
    paidValuation,
    stripeSessionId,
  } = body

  if (!name || !email || !postcode) {
    return NextResponse.json({ error: 'name, email and postcode are required' }, { status: 400 })
  }

  const lead = await prisma.propertyLead.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      postcode: postcode.toUpperCase(),
      inCatchment: inCatchment ?? true,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      propertyType: propertyType ?? null,
      condition: condition ?? null,
      furnishing: furnishing ?? null,
      sqft: sqft ? Number(sqft) : null,
      features: features ? JSON.stringify(features) : null,
      epcRating: epcRating ?? null,
      estimatedRentLow: estimatedRentLow ? Number(estimatedRentLow) : null,
      estimatedRentHigh: estimatedRentHigh ? Number(estimatedRentHigh) : null,
      serviceInterest: serviceInterest ?? 'FULL_MANAGEMENT',
      timing: timing ?? null,
      paidValuation: paidValuation ?? false,
      stripeSessionId: stripeSessionId ?? null,
      ipAddress: ip,
      source: 'valuation_bot',
    },
  })

  return NextResponse.json({ ok: true, id: lead.id })
}
