import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const NOT_CONFIGURED = { error: 'Credit check not configured', code: 'NOT_CONFIGURED' }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.CREDIT_CHECK_API_KEY
  if (!apiKey) return NextResponse.json(NOT_CONFIGURED, { status: 503 })

  const app = await prisma.tenantReferenceApplication.findUnique({ where: { id: params.id } })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Placeholder: when a real provider is contracted, implement here
  return NextResponse.json(NOT_CONFIGURED, { status: 503 })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const app = await prisma.tenantReferenceApplication.findUnique({
    where: { id: params.id },
    select: { creditCheckStatus: true, creditScore: true, creditProvider: true, creditCheckedAt: true, ccjCount: true, bankruptcyFlag: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...app,
    configured: !!process.env.CREDIT_CHECK_API_KEY,
  })
}
