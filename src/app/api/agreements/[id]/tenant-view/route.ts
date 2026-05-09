import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/agreements/[id]/tenant-view?token=xxx
// Public endpoint for tenant signing page
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.nextUrl.searchParams.get('token')
  const session = await getServerSession(authOptions)

  // Must have either a valid session (tenant) or a valid token
  if (!session && !token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET ?? 'secret') as {
        agreementId: string; action: string
      }
      if (payload.agreementId !== params.id || payload.action !== 'tenant-sign') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Expired or invalid token' }, { status: 401 })
    }
  }

  const agreement = await prisma.agreement.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      draftUrl: true,
      tenantSignedAt: true,
    },
  })

  if (!agreement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Build response with property/offer data
  let propertyAddress = ''
  let proposedRent = 0
  let startDate = ''
  let tenancyTerm = 12
  let depositAmount = 0
  let depositScheme = 'TDS'
  let landlordName = ''

  if (agreement.status === 'FULLY_SIGNED') {
    // Already signed — return basic info
  }

  // We need to get this from enquiry or tenancy
  const full = await prisma.agreement.findUnique({
    where: { id: params.id },
    include: {
      enquiry: {
        include: {
          offer: true,
          property: {
            include: { landlord: { include: { user: true } } },
          },
        },
      },
      tenancy: {
        include: {
          property: true,
          landlord: { include: { user: true } },
        },
      },
    },
  })

  if (full?.enquiry?.property) {
    const p = full.enquiry.property
    propertyAddress = `${p.addressLine1}, ${p.area}, ${p.postcode}`
    const ll = p.landlord
    landlordName = `${ll.firstName} ${ll.lastName}`
  }
  if (full?.enquiry?.offer) {
    const o = full.enquiry.offer
    proposedRent = o.proposedRent
    startDate = o.startDate.toISOString()
    tenancyTerm = o.tenancyTerm
    depositAmount = o.depositAmount
    depositScheme = o.depositScheme
  }
  if (full?.tenancy?.property) {
    const p = full.tenancy.property
    propertyAddress = `${p.addressLine1}, ${p.area}, ${p.postcode}`
    proposedRent = full.tenancy.rentAmount
    startDate = full.tenancy.startDate.toISOString()
    depositAmount = full.tenancy.depositAmount
    depositScheme = full.tenancy.depositScheme ?? 'TDS'
  }

  return NextResponse.json({
    ...agreement,
    propertyAddress,
    proposedRent,
    startDate,
    tenancyTerm,
    depositAmount,
    depositScheme,
    landlordName,
  })
}
