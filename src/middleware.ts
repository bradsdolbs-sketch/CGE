import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret })

  // Helper: redirect preserving callbackUrl
  function redirectTo(path: string, withCallback = true) {
    const url = req.nextUrl.clone()
    url.pathname = path
    if (withCallback) {
      url.searchParams.set('callbackUrl', req.nextUrl.pathname)
    } else {
      url.searchParams.delete('callbackUrl')
    }
    return NextResponse.redirect(url)
  }

  // ── Dashboard (/dashboard/*) — requires ADMIN or AGENT ──────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!token) return redirectTo('/manage')
    if (token.role !== 'ADMIN' && token.role !== 'AGENT') {
      // Redirect to their correct portal
      if (token.role === 'TENANT') return redirectTo('/portal/tenant', false)
      if (token.role === 'LANDLORD') return redirectTo('/portal/landlord', false)
      return redirectTo('/manage')
    }
    return NextResponse.next()
  }

  // ── Tenant portal (/portal/tenant/*) — requires TENANT ──────────────────────
  if (pathname.startsWith('/portal/tenant')) {
    if (!token) return redirectTo('/login')
    if (token.role !== 'TENANT') {
      if (token.role === 'ADMIN' || token.role === 'AGENT') return redirectTo('/dashboard', false)
      if (token.role === 'LANDLORD') return redirectTo('/portal/landlord', false)
      return redirectTo('/login')
    }
    return NextResponse.next()
  }

  // ── Landlord portal (/portal/landlord/*) — requires LANDLORD ────────────────
  if (pathname.startsWith('/portal/landlord')) {
    if (!token) return redirectTo('/login')
    if (token.role !== 'LANDLORD') {
      if (token.role === 'ADMIN' || token.role === 'AGENT') return redirectTo('/dashboard', false)
      if (token.role === 'TENANT') return redirectTo('/portal/tenant', false)
      return redirectTo('/login')
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/tenant/:path*', '/portal/landlord/:path*'],
}
