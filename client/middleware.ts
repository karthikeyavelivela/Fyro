import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard': ['customer'],
  '/driver': ['driver'],
  '/hamali': ['hamali'],
  '/admin': ['admin'],
  '/book': ['customer'],
  '/bookings': ['customer', 'driver', 'hamali'],
  '/payments': ['customer'],
  '/complaints': ['customer'],
  '/profile': ['customer', 'driver', 'hamali'],
}

const ROLE_HOME: Record<string, string> = {
  customer: '/dashboard',
  driver: '/driver',
  hamali: '/hamali',
  admin: '/admin',
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('fyro_token')?.value
  const path = req.nextUrl.pathname

  const matchedRoute = Object.keys(ROLE_ROUTES).find(r => path.startsWith(r))
  if (!matchedRoute) return NextResponse.next()

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'fyro_super_secret_jwt_key_change_in_production')
    )
    const role = payload.role as string
    const allowed = ROLE_ROUTES[matchedRoute]

    if (!allowed.includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] || '/login', req.url))
    }
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/driver/:path*', '/hamali/:path*', '/admin/:path*',
            '/book/:path*', '/bookings/:path*', '/payments/:path*', '/complaints/:path*', '/profile/:path*']
}
