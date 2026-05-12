import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function validateToken(guarantorId: string, token: string | null) {
  if (!token) return null
  const guarantor = await prisma.guarantor.findUnique({ where: { id: guarantorId } })
  if (!guarantor || guarantor.portalToken !== token) return null
  if (guarantor.portalTokenExpiry && guarantor.portalTokenExpiry < new Date()) return null
  return guarantor
}

// GET — public (token) or agent
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = new URL(req.url).searchParams.get('token')
  const session = await getServerSession(authOptions)
  const isAgent = session && ['ADMIN', 'AGENT'].includes(session.user.role)

  if (!isAgent && !token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (token) {
    const g = await validateToken(params.id, token)
    if (!g) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 })
  }

  const guarantor = await prisma.guarantor.findUnique({
    where: { id: params.id },
    include: {
      tenancy: {
        include: {
          tenants: { include: { tenant: { select: { firstName: true, lastName: true } } }, where: { isPrimary: true }, take: 1 },
          property: { select: { addressLine1: true, addressLine2: true } },
        },
      },
    },
  })
  if (!guarantor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(guarantor)
}

// PUT — save guarantor details (public via token)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = new URL(req.url).searchParams.get('token')
  const session = await getServerSession(authOptions)
  const isAgent = session && ['ADMIN', 'AGENT'].includes(session.user.role)

  if (!isAgent && !token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (token) {
    const g = await validateToken(params.id, token)
    if (!g) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 })
    if (g.guarantorRefStatus === 'UNDER_REVIEW' || g.guarantorRefStatus === 'PASSED' || g.guarantorRefStatus === 'FAILED') {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 400 })
    }
  }

  const body = await req.json()
  const {
    dob, niNumber, addressLine1, postcode,
    guarantorEmployerName, guarantorEmployerEmail, guarantorJobTitle,
    guarantorContractType, guarantorEmploymentStart, annualSalary,
  } = body

  const updated = await prisma.guarantor.update({
    where: { id: params.id },
    data: {
      dob: dob ? new Date(dob) : undefined,
      niNumber: niNumber ?? undefined,
      addressLine1: addressLine1 ?? undefined,
      postcode: postcode ?? undefined,
      guarantorEmployerName: guarantorEmployerName ?? undefined,
      guarantorEmployerEmail: guarantorEmployerEmail ?? undefined,
      guarantorJobTitle: guarantorJobTitle ?? undefined,
      guarantorContractType: guarantorContractType ?? undefined,
      guarantorEmploymentStart: guarantorEmploymentStart ? new Date(guarantorEmploymentStart) : undefined,
      annualSalary: annualSalary ? parseInt(annualSalary) : undefined,
    },
  })

  return NextResponse.json(updated)
}
