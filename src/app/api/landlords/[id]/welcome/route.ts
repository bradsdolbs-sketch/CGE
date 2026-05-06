import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const landlord = await prisma.landlord.findUnique({
    where: { id: params.id },
    include: { user: true },
  })
  if (!landlord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const portalUrl = `${baseUrl}/login?callbackUrl=/portal/landlord`

  await sendWelcomeEmail(
    landlord.user.email,
    `${landlord.firstName} ${landlord.lastName}`,
    'LANDLORD',
    portalUrl,
    'ChangeMe2024!',
  )

  return NextResponse.json({ ok: true })
}
