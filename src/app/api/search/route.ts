import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const search = { contains: q, mode: 'insensitive' as const }

  const [properties, tenants, landlords] = await Promise.all([
    prisma.property.findMany({
      where: {
        OR: [
          { addressLine1: search },
          { area: search },
          { postcode: search },
        ],
      },
      select: { id: true, addressLine1: true, area: true, postcode: true, status: true },
      take: 5,
    }),
    prisma.tenant.findMany({
      where: {
        OR: [
          { firstName: search },
          { lastName: search },
          { email: search },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 5,
    }),
    prisma.landlord.findMany({
      where: {
        OR: [
          { firstName: search },
          { lastName: search },
          { user: { email: search } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
      take: 5,
    }),
  ])

  return NextResponse.json({
    results: {
      properties: properties.map(p => ({
        id: p.id,
        label: p.addressLine1,
        sublabel: `${p.area} · ${p.postcode}`,
        status: p.status,
        href: `/dashboard/properties/${p.id}`,
        type: 'property',
      })),
      tenants: tenants.map(t => ({
        id: t.id,
        label: `${t.firstName} ${t.lastName}`,
        sublabel: t.email,
        href: `/dashboard/tenants/${t.id}`,
        type: 'tenant',
      })),
      landlords: landlords.map(l => ({
        id: l.id,
        label: `${l.firstName} ${l.lastName}`,
        sublabel: l.user.email,
        href: `/dashboard/landlords/${l.id}`,
        type: 'landlord',
      })),
    },
  })
}
