import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { url, name, type, size, mimeType, tenantId, tenancyId } = body

    if (!url || !name || !type) {
      return NextResponse.json({ error: 'url, name and type are required' }, { status: 400 })
    }

    // Tenants can only upload to their own record
    if (session.user.role === 'TENANT') {
      const tenant = await prisma.tenant.findUnique({ where: { userId: session.user.id } })
      if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

      const doc = await prisma.document.create({
        data: { url, name, type, size, mimeType, tenantId: tenant.id },
      })
      return NextResponse.json(doc)
    }

    // Agents/admins can create for any tenant or tenancy
    if (!['ADMIN', 'AGENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const doc = await prisma.document.create({
      data: { url, name, type, size, mimeType, tenantId: tenantId ?? null, tenancyId: tenancyId ?? null },
    })
    return NextResponse.json(doc)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
