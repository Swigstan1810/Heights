// middleware.ts - Optimized with better performance and caching
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Routes configuration
const PROTECTED_ROUTES = ['/dashboard', '/portfolio', '/trade', '/profile', '/wallet'];
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback', '/news', '/market', '/ai', '/crypto', '/home'];
const STATIC_EXTENSIONS = ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2'];

// Rate limiting with memory optimization
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const DEFAULT_RATE_LIMIT = 200;

// Clean up expired entries more efficiently
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, 30000); // Every 30 seconds

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

// Enhanced CSP for better security
const generateCSP = (nonce: string) => `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://s3.tradingview.com https://cdnjs.cloudflare.com https://accounts.google.com https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com;
  img-src 'self' blob: data: https: http: https://lh3.googleusercontent.com https://images.unsplash.com;
  font-src 'self' data: https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'none';
  frame-src 'self' https://s.tradingview.com https://accounts.google.com;
  connect-src 'self' https://api.coinbase.com wss://ws-feed.exchange.coinbase.com https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://www.googleapis.com https://newsapi.org https://gnews.io;
  media-src 'self';
  worker-src 'self' blob:;
`.replace(/\s+/g, ' ').trim();

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  // Quick bypass for static assets
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext)) || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  
  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Set CSP with nonce
  response.headers.set('Content-Security-Policy', generateCSP(nonce));
  response.headers.set('X-Nonce', nonce);

  // Rate limiting
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    'anonymous';
  
  if (!checkRateLimit(identifier)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': String(DEFAULT_RATE_LIMIT),
        'X-RateLimit-Remaining': '0',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Skip auth for public API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    response.headers.set('X-Response-Time', String(Date.now() - startTime));
    return response;
  }

  // Only check auth for protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    response.headers.set('X-Response-Time', String(Date.now() - startTime));
    return response;
  }

  // Auth check for protected routes
  try {
    const supabase = createMiddlewareClient({ req: request, res: response });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // Add user context to headers for downstream use
    response.headers.set('X-User-Id', session.user.id);
    response.headers.set('X-User-Email', session.user.email || '');
    
  } catch (error) {
    console.error('Auth check error:', error);
    // Allow request to continue even if auth check fails
  }

  // Add performance header
  response.headers.set('X-Response-Time', String(Date.now() - startTime));
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     * - .well-known (for various verifications)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public|.well-known).*)',
  ],
};