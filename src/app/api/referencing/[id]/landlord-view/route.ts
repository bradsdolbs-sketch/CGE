import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// GET /api/referencing/[id]/landlord-view?token=xxx
// Public-ish endpoint to fetch application data for landlord portal
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET ?? 'secret') as {
      applicationId: string
      action: string
    }
    if (payload.applicationId !== params.id || payload.action !== 'landlord-approval') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Expired or invalid token' }, { status: 401 })
  }

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      affordabilityScore: true,
      affordabilityPass: true,
      landlordApprovalStatus: true,
      reportUrl: true,
      enquiryId: true,
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          user: { select: { email: true } },
        },
      },
    },
  })

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch enquiry + property + offer
  let enquiry = null
  if (app.enquiryId) {
    enquiry = await prisma.enquiry.findUnique({
      where: { id: app.enquiryId },
      select: {
        property: {
          select: {
            addressLine1: true,
            area: true,
            postcode: true,
          },
        },
        offer: {
          select: {
            proposedRent: true,
            startDate: true,
            tenancyTerm: true,
            depositAmount: true,
            depositScheme: true,
          },
        },
      },
    })
  }

  return NextResponse.json({ ...app, enquiry })
}
