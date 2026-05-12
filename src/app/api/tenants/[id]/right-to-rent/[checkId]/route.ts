import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/upload'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; checkId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const check = await prisma.rightToRentCheck.findUnique({
    where: { id: params.checkId },
  })
  if (!check || check.tenantId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (check.documentUrl) {
    await deleteFile(check.documentUrl).catch(() => {})
  }

  await prisma.rightToRentCheck.delete({ where: { id: params.checkId } })

  return NextResponse.json({ ok: true })
}
