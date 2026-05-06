import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Allows landlords to attach a certificate URL to their own compliance items
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { certificateUrl } = await req.json()
    if (!certificateUrl) return NextResponse.json({ error: 'certificateUrl required' }, { status: 400 })

    const item = await prisma.complianceItem.findUnique({
      where: { id: params.id },
      include: { property: { include: { landlord: { include: { user: true } } } } },
    })

    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Landlords may only update compliance for their own properties
    if (session.user.role === 'LANDLORD') {
      const isOwner = item.property.landlord?.user.email === session.user.email
      if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else if (!['ADMIN', 'AGENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.complianceItem.update({
      where: { id: params.id },
      data: { certificateUrl },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
