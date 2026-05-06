import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const app = await prisma.tenantReferenceApplication.findUnique({ where: { id: params.id } })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.user.role === 'TENANT') {
    const tenant = await prisma.tenant.findUnique({ where: { userId: session.user.id } })
    if (!tenant || tenant.id !== app.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (!['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { url, name, docType, size } = await req.json()
    if (!url || !name || !docType) {
      return NextResponse.json({ error: 'url, name, and docType are required' }, { status: 400 })
    }

    const doc = await prisma.tenantRefDocument.create({
      data: { applicationId: params.id, url, name, docType, size: size || null },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
