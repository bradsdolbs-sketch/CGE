import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const propertyId = searchParams.get('propertyId')

  const listings = await prisma.listing.findMany({
    where: propertyId ? { propertyId } : {},
    include: { property: { include: { landlord: { include: { user: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(listings)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      propertyId, price, description, shortDescription, furnished, billsIncluded,
      parking, garden, balcony, petsAllowed, dssConsidered, studentFriendly,
      features, photos, primaryPhoto, floorplan, virtualTourUrl, availableFrom,
      priceFrequency, publishRightmove, publishZoopla,
    } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 })
    }

    const listing = await prisma.listing.create({
      data: {
        propertyId,
        price: price ? parseInt(price) : 0,
        description: description ?? '',
        ...(shortDescription && { shortDescription }),
        ...(furnished !== undefined && { furnished }),
        ...(billsIncluded !== undefined && { billsIncluded }),
        ...(parking !== undefined && { parking }),
        ...(garden !== undefined && { garden }),
        ...(balcony !== undefined && { balcony }),
        ...(petsAllowed !== undefined && { petsAllowed }),
        ...(dssConsidered !== undefined && { dssConsidered }),
        ...(studentFriendly !== undefined && { studentFriendly }),
        ...(features !== undefined && { features }),
        ...(photos !== undefined && { photos }),
        ...(primaryPhoto && { primaryPhoto }),
        ...(floorplan && { floorplan }),
        ...(virtualTourUrl && { virtualTourUrl }),
        ...(availableFrom && { availableFrom: new Date(availableFrom) }),
        ...(priceFrequency && { priceFrequency }),
        ...(publishRightmove !== undefined && { publishRightmove }),
        ...(publishZoopla !== undefined && { publishZoopla }),
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
