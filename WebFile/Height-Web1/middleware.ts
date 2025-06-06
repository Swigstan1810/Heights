// middleware.ts - Fixed for production deployment
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Routes configuration - Updated to match your app structure
const PROTECTED_ROUTES = ['/home', '/portfolio', '/trade', '/profile', '/wallet', '/crypto'];
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback', '/news', '/market', '/ai'];
const STATIC_EXTENSIONS = ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];

// Simple rate limiting for production
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const DEFAULT_RATE_LIMIT = 300; // Increased for production

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (record.count >= DEFAULT_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Quick bypass for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.') ||
    STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';
  
  if (!checkRateLimit(identifier)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': String(DEFAULT_RATE_LIMIT),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // Skip auth for API routes (except auth routes) and public routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return response;
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
  
  // Allow public routes without auth check
  if (isPublicRoute && !isProtectedRoute) {
    return response;
  }

  // Auth check for protected routes only
  if (isProtectedRoute) {
    try {
      const supabase = createMiddlewareClient({ req: request, res: response });
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        const url = new URL('/login', request.url);
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }

      // Add user context to headers for downstream use
      response.headers.set('X-User-Id', session.user.id);
      if (session.user.email) {
        response.headers.set('X-User-Email', session.user.email);
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      // Redirect to login on auth errors for protected routes
      const url = new URL('/login', request.url);
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - .well-known (for various verifications)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)',
  ],
};