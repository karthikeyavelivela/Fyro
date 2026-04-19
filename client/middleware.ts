import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fyro_jwt_secret_change_in_prod_2026'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('fyro_token')?.value;
  const path = request.nextUrl.pathname;

  // Public paths
  if (path === '/' || path === '/login' || path === '/register') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;
        // Redirect logged-in users away from auth pages
        if (path === '/login' || path === '/register') {
          if (role === 'customer') return NextResponse.redirect(new URL('/dashboard', request.url));
          if (role === 'driver') return NextResponse.redirect(new URL('/driver', request.url));
          if (role === 'hamali') return NextResponse.redirect(new URL('/hamali', request.url));
          if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch (e) {
        // Token invalid, let them stay on auth page
      }
    }
    return NextResponse.next();
  }

  // Protected paths
  if (!token) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Role Guarding
    if (path.startsWith('/driver') && role !== 'driver') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/hamali') && role !== 'hamali') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if ((path.startsWith('/dashboard') || path.startsWith('/book') || path.startsWith('/schedule')) && role !== 'customer') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Token verification failed
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/book/:path*',
    '/schedule/:path*',
    '/bookings/:path*',
    '/payments/:path*',
    '/complaints/:path*',
    '/profile/:path*',
    '/driver/:path*',
    '/hamali/:path*',
    '/admin/:path*'
  ],
};
