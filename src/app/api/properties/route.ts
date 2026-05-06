import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const area = searchParams.get('area')
  const listingType = searchParams.get('listingType')
  const minBeds = searchParams.get('minBeds')
  const maxBeds = searchParams.get('maxBeds')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const featured = searchParams.get('featured')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const sort = searchParams.get('sort') ?? 'newest'

  const where: Prisma.PropertyWhereInput = {
    status: { not: 'ARCHIVED' },
  }

  if (status) where.status = status as Prisma.EnumPropertyStatusFilter
  if (type) where.propertyType = type as Prisma.EnumPropertyTypeFilter
  if (area) where.area = { contains: area, mode: 'insensitive' }
  if (listingType) where.listingType = listingType as Prisma.EnumListingTypeFilter
  if (minBeds) where.bedrooms = { ...((where.bedrooms as object) ?? {}), gte: parseInt(minBeds) }
  if (maxBeds) where.bedrooms = { ...((where.bedrooms as object) ?? {}), lte: parseInt(maxBeds) }

  if (minPrice || maxPrice) {
    where.listing = {
      price: {
        ...(minPrice ? { gte: parseInt(minPrice) } : {}),
        ...(maxPrice ? { lte: parseInt(maxPrice) } : {}),
      },
    }
  }

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === 'price_asc'
      ? { listing: { price: 'asc' } }
      : sort === 'price_desc'
      ? { listing: { price: 'desc' } }
      : { createdAt: 'desc' }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        listing: true,
        landlord: { include: { user: true } },
        _count: { select: { maintenanceReqs: true, complianceItems: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ])

  return NextResponse.json({ properties, total, page, pageSize: limit })
}

export async function POST(req: NextRequest) {
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
    } = body

    if (!addressLine1 || !area || !postcode || !propertyType || !bedrooms || !bathrooms || !landlordId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const baseSlug = slugify(`${addressLine1} ${postcode}`, { lower: true, strict: true })
    let slug = baseSlug
    let counter = 1
    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const property = await prisma.property.create({
      data: {
        slug, addressLine1, addressLine2, town: town ?? 'London',
        area, postcode, propertyType, tenure, bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms), receptions: parseInt(receptions ?? 1),
        sqFt: sqFt ? parseInt(sqFt) : null, epcRating, councilTaxBand,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        status: status ?? 'AVAILABLE', listingType: listingType ?? 'RENT',
        publishedOnWeb: !!publishedOnWeb, landlordId,
      },
      include: { landlord: { include: { user: true } }, listing: true },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
