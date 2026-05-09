import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React, { type ReactElement } from 'react'
import ASTDraftPDF, { ASTData } from '@/components/pdf/ASTDraftPDF'
import * as fs from 'fs'
import * as path from 'path'
import { addMonths, format } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/agreements — list all agreements (agent/admin only)
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const agreements = await prisma.agreement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      enquiry: {
        include: {
          property: { select: { addressLine1: true, area: true } },
        },
      },
      tenancy: {
        include: {
          property: { select: { addressLine1: true, area: true } },
        },
      },
    },
  })

  return NextResponse.json(agreements)
}

// POST /api/agreements — generate AST draft from enquiry/offer data
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { enquiryId, tenancyId } = await req.json()
    if (!enquiryId && !tenancyId) {
      return NextResponse.json({ error: 'enquiryId or tenancyId required' }, { status: 400 })
    }

    let tenantName = 'Tenant'
    let tenantEmail = ''
    let landlordName = 'Landlord'
    let landlordAddress = ''
    let propertyAddress = ''
    let propertyPostcode = ''
    let startDate: Date = new Date()
    let rentAmount = 0
    let rentFrequency = 'month'
    let depositAmount = 0
    let depositScheme = 'TDS'
    let tenancyTerm = 12
    let specialConditions: string | null = null

    if (enquiryId) {
      const enquiry = await prisma.enquiry.findUnique({
        where: { id: enquiryId },
        include: {
          offer: true,
          property: {
            include: {
              landlord: {
                include: { user: { select: { email: true } } },
              },
            },
          },
        },
      })

      if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
      if (!enquiry.offer) return NextResponse.json({ error: 'No offer found — capture offer terms first' }, { status: 400 })

      // Get tenant from referencing application
      const refApp = await prisma.tenantReferenceApplication.findFirst({
        where: { enquiryId },
        include: { tenant: { include: { user: true } } },
      })

      if (refApp) {
        tenantName = `${refApp.tenant.firstName} ${refApp.tenant.lastName}`
        tenantEmail = refApp.tenant.user.email
      } else {
        tenantName = `${enquiry.firstName} ${enquiry.lastName}`
        tenantEmail = enquiry.email
      }

      if (enquiry.property) {
        const p = enquiry.property
        propertyAddress = `${p.addressLine1}${p.addressLine2 ? `, ${p.addressLine2}` : ''}, ${p.area}, ${p.town}`
        propertyPostcode = p.postcode
        const ll = p.landlord
        landlordName = `${ll.firstName} ${ll.lastName}${ll.companyName ? ` (${ll.companyName})` : ''}`
        landlordAddress = [ll.addressLine1, ll.addressLine2, ll.postcode].filter(Boolean).join(', ')
      }

      startDate = enquiry.offer.startDate
      tenancyTerm = enquiry.offer.tenancyTerm
      rentAmount = enquiry.offer.proposedRent
      depositAmount = enquiry.offer.depositAmount
      depositScheme = enquiry.offer.depositScheme
      specialConditions = enquiry.offer.specialConditions ?? null
    } else if (tenancyId) {
      const tenancy = await prisma.tenancy.findUnique({
        where: { id: tenancyId },
        include: {
          property: {
            include: {
              landlord: { include: { user: true } },
            },
          },
          landlord: { include: { user: true } },
          tenants: {
            include: { tenant: { include: { user: true } } },
            where: { isPrimary: true },
          },
        },
      })

      if (!tenancy) return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 })

      const primaryTenant = tenancy.tenants[0]?.tenant
      if (primaryTenant) {
        tenantName = `${primaryTenant.firstName} ${primaryTenant.lastName}`
        tenantEmail = primaryTenant.user.email
      }

      const p = tenancy.property
      propertyAddress = `${p.addressLine1}${p.addressLine2 ? `, ${p.addressLine2}` : ''}, ${p.area}, ${p.town}`
      propertyPostcode = p.postcode
      const ll = tenancy.landlord
      landlordName = `${ll.firstName} ${ll.lastName}${ll.companyName ? ` (${ll.companyName})` : ''}`
      landlordAddress = [ll.addressLine1, ll.addressLine2, ll.postcode].filter(Boolean).join(', ')

      startDate = tenancy.startDate
      rentAmount = tenancy.rentAmount
      rentFrequency = tenancy.rentFrequency
      depositAmount = tenancy.depositAmount
      depositScheme = tenancy.depositScheme ?? 'TDS'
      tenancyTerm = Math.round((tenancy.endDate.getTime() - tenancy.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }

    const endDate = addMonths(startDate, tenancyTerm)
    const agreementRef = `CGE-${Date.now().toString(36).toUpperCase()}`

    const astData: ASTData = {
      tenantName,
      tenantEmail,
      landlordName,
      landlordAddress,
      agentName: 'Central Gate Estates Ltd',
      propertyAddress,
      propertyPostcode,
      startDate: format(startDate, 'd MMMM yyyy'),
      endDate: format(endDate, 'd MMMM yyyy'),
      rentAmount,
      rentFrequency,
      depositAmount,
      depositScheme,
      tenancyTerm,
      specialConditions,
      preparedDate: format(new Date(), 'd MMMM yyyy'),
      agreementRef,
      isDraft: true,
    }

    // Generate PDF
    const buffer = await renderToBuffer(React.createElement(ASTDraftPDF, { data: astData }) as ReactElement<DocumentProps>)

    // Save to disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'agreements')
    fs.mkdirSync(uploadsDir, { recursive: true })
    const filename = `ast-${agreementRef.toLowerCase()}.pdf`
    const filePath = path.join(uploadsDir, filename)
    fs.writeFileSync(filePath, buffer)

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'
    const draftUrl = `${baseUrl}/api/documents/agreements/${filename}`

    // Create Agreement record
    const agreement = await prisma.agreement.create({
      data: {
        enquiryId: enquiryId ?? null,
        tenancyId: tenancyId ?? null,
        draftUrl,
        status: 'DRAFT',
      },
    })

    // Notify agents
    const agents = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
      select: { id: true },
    })
    for (const agent of agents) {
      await prisma.notification.create({
        data: {
          userId: agent.id,
          type: 'GENERAL',
          title: `AST draft ready: ${tenantName} — ${propertyAddress}`,
          message: 'A draft Assured Shorthold Tenancy Agreement has been generated and is ready for agent review.',
          link: `/dashboard/agreements/${agreement.id}`,
        },
      })
    }

    return NextResponse.json({ agreement, draftUrl }, { status: 201 })
  } catch (err) {
    console.error('POST /api/agreements error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
