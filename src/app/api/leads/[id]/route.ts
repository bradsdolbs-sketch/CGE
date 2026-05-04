import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── PATCH /api/leads/:id — update status, track, notes ──────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { track, status, agentNotes } = await req.json()

  const lead = await prisma.propertyLead.update({
    where: { id: params.id },
    data: {
      ...(track ? { track } : {}),
      ...(status ? { status } : {}),
      ...(agentNotes !== undefined ? { agentNotes } : {}),
    },
  })

  return NextResponse.json(lead)
}

// ─── DELETE /api/leads/:id — admin only ──────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  await prisma.propertyLead.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
