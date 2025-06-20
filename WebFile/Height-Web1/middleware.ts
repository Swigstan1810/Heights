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
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Security headers to fix the vulnerabilities
  const securityHeaders = {
    // Content Security Policy - Prevents XSS attacks
    'Content-Security-Policy': 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://s3.tradingview.com; " +
      "frame-src https://s.tradingview.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'none'; " +
      "form-action 'self'; " +
      "base-uri 'self';",
    
    // X-Frame-Options - Prevents clickjacking
    'X-Frame-Options': 'DENY',
    
    // X-Content-Type-Options - Prevents MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Referrer Policy - Controls referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy - Controls browser features
    'Permissions-Policy': 
      'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Strict Transport Security - Forces HTTPS
    'Strict-Transport-Security': 
      'max-age=31536000; includeSubDomains; preload',
    
    // X-XSS-Protection - Additional XSS protection for older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Cache Control for sensitive data
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    
    // Prevent information disclosure
    'X-Powered-By': '',
    'Server': '',
  };
  
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
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    return response;
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => request.nextUrl.pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route));
  
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
        url.searchParams.set('redirectTo', request.nextUrl.pathname);
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
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};