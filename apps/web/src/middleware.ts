import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get('auth-logged-in');
  const roleCookie = request.cookies.get('user-role');
  const isAdmin = roleCookie?.value === 'admin';

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = pathname.startsWith('/admin');
  const isProtected = pathname.startsWith('/dashboard') || isAdminPath;

  // Unauthenticated → login
  if (isProtected && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in but not admin → show 403 at same URL
  if (isAdminPath && authCookie && !isAdmin) {
    return NextResponse.rewrite(new URL('/403', request.url));
  }

  // Already logged in → redirect away from auth pages based on role
  if (isPublicPath && authCookie) {
    const dest = isAdmin ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
