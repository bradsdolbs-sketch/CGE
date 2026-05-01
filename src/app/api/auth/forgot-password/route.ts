import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { SignJWT } from 'jose'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    // Always return 200 — don't leak whether email exists
    if (!user) return NextResponse.json({ ok: true })

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? 'secret')
    const token = await new SignJWT({ sub: user.id, email: user.email, type: 'password-reset' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(secret)

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendPasswordResetEmail(user.email, user.name ?? user.email, resetUrl)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
