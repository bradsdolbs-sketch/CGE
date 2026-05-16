import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { property: { include: { landlord: { include: { user: true } } } } },
  })

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      price, description, shortDescription, furnished, billsIncluded, parking,
      garden, balcony, petsAllowed, dssConsidered, studentFriendly, features,
      photos, primaryPhoto, floorplan, virtualTourUrl, availableFrom,
      priceFrequency, publishRightmove, publishZoopla,
    } = body

    const parsedPrice = price !== undefined ? parseInt(price) : undefined

    const listing = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...(parsedPrice !== undefined && !isNaN(parsedPrice) && { price: parsedPrice }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription: shortDescription || null }),
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
        ...(primaryPhoto !== undefined && { primaryPhoto: primaryPhoto || null }),
        ...(floorplan !== undefined && { floorplan: floorplan || null }),
        ...(virtualTourUrl !== undefined && { virtualTourUrl: virtualTourUrl || null }),
        // availableFrom: empty string must become null
        ...(availableFrom !== undefined && { availableFrom: availableFrom ? new Date(availableFrom) : null }),
        ...(priceFrequency !== undefined && { priceFrequency }),
        ...(publishRightmove !== undefined && { publishRightmove }),
        ...(publishZoopla !== undefined && { publishZoopla }),
      },
    })

    return NextResponse.json(listing)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.listing.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
