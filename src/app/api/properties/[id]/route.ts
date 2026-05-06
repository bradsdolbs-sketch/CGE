import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      landlord: { include: { user: true } },
      tenancies: {
        include: { tenants: { include: { tenant: { include: { user: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
      complianceItems: { orderBy: { expiryDate: 'asc' } },
      maintenanceReqs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { contractor: true },
      },
      inspections: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      _count: { select: { maintenanceReqs: true } },
    },
  })

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  return NextResponse.json(property)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      addressLine1, addressLine2, town, area, postcode,
      propertyType, tenure, bedrooms, bathrooms, receptions,
      sqFt, epcRating, councilTaxBand, yearBuilt,
      status, listingType, publishedOnWeb, landlordId,
      latitude, longitude,
    } = body

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...(addressLine1 !== undefined && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(town !== undefined && { town }),
        ...(area !== undefined && { area }),
        ...(postcode !== undefined && { postcode }),
        ...(propertyType !== undefined && { propertyType }),
        ...(tenure !== undefined && { tenure }),
        ...(bedrooms !== undefined && { bedrooms: parseInt(bedrooms) }),
        ...(bathrooms !== undefined && { bathrooms: parseInt(bathrooms) }),
        ...(receptions !== undefined && { receptions: parseInt(receptions) }),
        ...(sqFt !== undefined && { sqFt: sqFt ? parseInt(sqFt) : null }),
        ...(epcRating !== undefined && { epcRating }),
        ...(councilTaxBand !== undefined && { councilTaxBand }),
        ...(yearBuilt !== undefined && { yearBuilt: yearBuilt ? parseInt(yearBuilt) : null }),
        ...(status !== undefined && { status }),
        ...(listingType !== undefined && { listingType }),
        ...(publishedOnWeb !== undefined && { publishedOnWeb: !!publishedOnWeb }),
        ...(landlordId !== undefined && { landlordId }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      include: { listing: true, landlord: { include: { user: true } } },
    })

    return NextResponse.json(property)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.property.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to archive property' }, { status: 500 })
  }
}
