import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const AUTH_PREFIX = '/(auth)';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token in cookies (if set) or skip for localStorage-only setup
  // For MVP, localStorage tokens can't be read server-side, so middleware
  // uses a server-set cookie that mirrors the auth state
  const authCookie = request.cookies.get('auth-logged-in');

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isDashboard = pathname.startsWith('/dashboard');

  // Redirect unauthenticated users away from protected routes
  if (isDashboard && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPath && authCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
