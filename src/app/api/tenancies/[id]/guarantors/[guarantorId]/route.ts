import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; guarantorId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const guarantor = await prisma.guarantor.findUnique({ where: { id: params.guarantorId } })
    if (!guarantor || guarantor.tenancyId !== params.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.guarantor.delete({ where: { id: params.guarantorId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete guarantor' }, { status: 500 })
  }
}
