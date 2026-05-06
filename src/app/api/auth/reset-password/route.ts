import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? 'secret')
    let payload: { sub?: string; type?: string }

    try {
      const { payload: p } = await jwtVerify(token, secret)
      payload = p as typeof payload
    } catch {
      return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 })
    }

    if (payload.type !== 'password-reset' || !payload.sub) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id: payload.sub }, data: { password: hashed } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password error:', err)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
