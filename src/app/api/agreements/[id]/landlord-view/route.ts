import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/agreements/[id]/landlord-view?token=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.nextUrl.searchParams.get('token')
  const session = await getServerSession(authOptions)

  if (!session && !token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET ?? 'secret') as {
        agreementId: string; action: string
      }
      if (payload.agreementId !== params.id || payload.action !== 'landlord-sign') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Expired or invalid token' }, { status: 401 })
    }
  }

  const full = await prisma.agreement.findUnique({
    where: { id: params.id },
    include: {
      enquiry: {
        include: {
          offer: true,
          property: { select: { addressLine1: true, area: true, postcode: true } },
        },
      },
      tenancy: {
        include: {
          property: { select: { addressLine1: true, area: true, postcode: true } },
        },
      },
    },
  })

  if (!full) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let propertyAddress = ''
  let proposedRent = 0
  let startDate = ''
  let tenancyTerm = 12
  let depositAmount = 0
  let depositScheme = 'TDS'

  if (full.enquiry?.property) {
    const p = full.enquiry.property
    propertyAddress = `${p.addressLine1}, ${p.area}, ${p.postcode}`
  }
  if (full.enquiry?.offer) {
    const o = full.enquiry.offer
    proposedRent = o.proposedRent
    startDate = o.startDate.toISOString()
    tenancyTerm = o.tenancyTerm
    depositAmount = o.depositAmount
    depositScheme = o.depositScheme
  }
  if (full.tenancy?.property) {
    const p = full.tenancy.property
    propertyAddress = `${p.addressLine1}, ${p.area}, ${p.postcode}`
    proposedRent = full.tenancy.rentAmount
    startDate = full.tenancy.startDate.toISOString()
    depositAmount = full.tenancy.depositAmount
    depositScheme = full.tenancy.depositScheme ?? 'TDS'
  }

  return NextResponse.json({
    id: full.id,
    status: full.status,
    draftUrl: full.draftUrl,
    landlordSignedAt: full.landlordSignedAt,
    tenantSignedName: full.tenantSignedName,
    propertyAddress,
    proposedRent,
    startDate,
    tenancyTerm,
    depositAmount,
    depositScheme,
  })
}
