import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

// Called from the public verify page when employer/landlord submits their response
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { payload } = await jwtVerify(params.token, secret)
    const { type, applicationId } = payload as { type: string; applicationId: string }

    const body = await req.json()
    const app = await prisma.tenantReferenceApplication.findUnique({ where: { id: applicationId } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    if (type === 'employer-verify') {
      const { confirms, actualSalary, notes } = body
      await prisma.tenantReferenceApplication.update({
        where: { id: applicationId },
        data: {
          employerConfirmed: confirms === true,
          employerConfirmedAt: new Date(),
          employerConfirmedSalary: actualSalary ? parseInt(actualSalary) : null,
          employerNotes: notes || null,
          status: 'UNDER_REVIEW',
        },
      })

      // Notify agents
      const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'AGENT'] } } })
      const tenant = await prisma.tenant.findUnique({ where: { id: app.tenantId } })
      for (const agent of agents) {
        await prisma.notification.create({
          data: {
            userId: agent.id,
            type: 'GENERAL',
            title: 'Employer Verification Received',
            message: `${tenant?.firstName} ${tenant?.lastName}'s employer has ${confirms ? 'confirmed' : 'disputed'} their employment.`,
            link: `/dashboard/referencing/${applicationId}`,
          },
        })
      }

      return NextResponse.json({ ok: true, type: 'employer' })
    }

    if (type === 'landlord-verify') {
      const { confirms, rating, arrears, notes } = body
      await prisma.tenantReferenceApplication.update({
        where: { id: applicationId },
        data: {
          prevLandlordConfirmed: confirms === true,
          prevLandlordConfirmedAt: new Date(),
          prevLandlordRating: rating || null,
          prevLandlordArrears: arrears === true,
          prevLandlordNotes: notes || null,
          status: 'UNDER_REVIEW',
        },
      })

      const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'AGENT'] } } })
      const tenant = await prisma.tenant.findUnique({ where: { id: app.tenantId } })
      for (const agent of agents) {
        await prisma.notification.create({
          data: {
            userId: agent.id,
            type: 'GENERAL',
            title: 'Landlord Reference Received',
            message: `${tenant?.firstName} ${tenant?.lastName}'s previous landlord has submitted a reference (${rating ?? 'no rating'}).`,
            link: `/dashboard/referencing/${applicationId}`,
          },
        })
      }

      return NextResponse.json({ ok: true, type: 'landlord' })
    }

    return NextResponse.json({ error: 'Invalid token type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
}
