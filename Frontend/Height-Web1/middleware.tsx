import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/kyc', '/portfolio', '/trade', '/wallet', '/settings'];
  const path = req.nextUrl.pathname;

  // Check if the route is protected and user is not authenticated
  if (protectedRoutes.some(route => path.startsWith(route)) && !session) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

// Run the middleware on all routes except for static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};