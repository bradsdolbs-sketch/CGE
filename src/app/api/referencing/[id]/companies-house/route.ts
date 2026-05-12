import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CH_BASE = 'https://api.company-information.service.gov.uk'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })

  const headers: HeadersInit = {}
  if (process.env.COMPANIES_HOUSE_API_KEY) {
    headers['Authorization'] = `Basic ${Buffer.from(`${process.env.COMPANIES_HOUSE_API_KEY}:`).toString('base64')}`
  }

  const res = await fetch(
    `${CH_BASE}/search/companies?q=${encodeURIComponent(q)}&items_per_page=5`,
    { headers }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Companies House lookup failed' }, { status: 502 })
  }

  const data = await res.json()
  const results = (data.items ?? []).map((item: Record<string, unknown>) => ({
    companyName: item.title,
    companyNumber: item.company_number,
    status: item.company_status,
    address: (item.address as Record<string, string> | undefined)
      ? [
          (item.address as Record<string, string>).address_line_1,
          (item.address as Record<string, string>).locality,
          (item.address as Record<string, string>).postal_code,
        ].filter(Boolean).join(', ')
      : null,
  }))

  return NextResponse.json({ results })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyNumber, companyName, status } = await req.json()
  if (!companyNumber) return NextResponse.json({ error: 'companyNumber required' }, { status: 400 })

  // Fetch authoritative status from Companies House
  const headers: HeadersInit = {}
  if (process.env.COMPANIES_HOUSE_API_KEY) {
    headers['Authorization'] = `Basic ${Buffer.from(`${process.env.COMPANIES_HOUSE_API_KEY}:`).toString('base64')}`
  }

  let authoritativeStatus = status
  try {
    const res = await fetch(`${CH_BASE}/company/${companyNumber}`, { headers })
    if (res.ok) {
      const data = await res.json()
      authoritativeStatus = data.company_status ?? status
    }
  } catch {
    // Use the status from the search result as fallback
  }

  const updated = await prisma.tenantReferenceApplication.update({
    where: { id: params.id },
    data: {
      companiesHouseNumber: companyNumber,
      companiesHouseStatus: authoritativeStatus,
      companiesHouseMatch: true,
    },
  })

  return NextResponse.json({
    companiesHouseNumber: updated.companiesHouseNumber,
    companiesHouseStatus: updated.companiesHouseStatus,
    companiesHouseMatch: updated.companiesHouseMatch,
  })
}
