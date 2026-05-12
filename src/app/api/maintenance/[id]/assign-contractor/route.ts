import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendContractorJobEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: params.id },
    include: { property: { select: { addressLine1: true, area: true } }, contractor: true },
  })

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!request.contractor) return NextResponse.json({ error: 'No contractor assigned' }, { status: 400 })
  if (!request.contractor.email) {
    return NextResponse.json({ error: 'Contractor has no email address' }, { status: 400 })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const updated = await prisma.maintenanceRequest.update({
    where: { id: params.id },
    data: {
      contractorToken: token,
      contractorTokenExpiry: expiry,
      contractorNotifiedAt: new Date(),
      contractorAcceptedAt: null,
      contractorDeclinedAt: null,
      contractorDeclineReason: null,
      contractorCompletedAt: null,
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
    include: { property: true, contractor: true },
  })

  const magicLink = `${process.env.NEXTAUTH_URL}/job/${token}`

  await sendContractorJobEmail({
    to: request.contractor.email,
    contractorName: request.contractor.name,
    agencyName: 'Central Gate Estates',
    jobTitle: request.title,
    jobDescription: request.description,
    propertyAddress: `${request.property.addressLine1}, ${request.property.area}`,
    priority: request.priority,
    magicLink,
    accessNotes: request.notes ?? undefined,
  })

  return NextResponse.json(updated)
}
