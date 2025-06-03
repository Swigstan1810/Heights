// middleware.ts
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

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/portfolio', '/trade', '/profile', '/wallet'];

// Routes that require KYC completion
const KYC_REQUIRED_ROUTES = ['/trade', '/wallet'];

// API routes that require authentication
const PROTECTED_API_ROUTES = ['/api/trades', '/api/portfolio', '/api/wallet'];

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/auth/login': { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  '/api/auth/signup': { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  '/api/trades': { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  '/api/market': { requests: 300, windowMs: 60 * 1000 }, // 300 requests per minute
  default: { requests: 200, windowMs: 60 * 1000 }, // 200 requests per minute default
};

function getRateLimitKey(identifier: string, path: string): string {
  return `${identifier}:${path}`;
}

function checkRateLimit(identifier: string, path: string): boolean {
  const key = getRateLimitKey(identifier, path);
  const now = Date.now();
  const limit = RATE_LIMITS[path as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + limit.windowMs,
    });
    return true;
  }
  
  if (record.count >= limit.requests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Clean up expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}, 60 * 1000); // Clean up every minute

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { pathname } = request.nextUrl;

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Get client identifier (IP address or session)
  const identifier = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // Apply rate limiting
  if (!checkRateLimit(identifier, pathname)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': String(RATE_LIMITS[pathname as keyof typeof RATE_LIMITS]?.requests || RATE_LIMITS.default.requests),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // Get session
  const { data: { session }, error } = await supabase.auth.getSession();

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isProtectedAPIRoute = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
  const requiresKYC = KYC_REQUIRED_ROUTES.some(route => pathname.startsWith(route));

  // Handle protected routes
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Handle protected API routes
  if (isProtectedAPIRoute && !session) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Check KYC status for routes that require it
  if (session && requiresKYC) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_completed')
      .eq('id', session.user.id)
      .single();

    if (profile && !profile.kyc_completed) {
      const url = request.nextUrl.clone();
      url.pathname = '/kyc';
      return NextResponse.redirect(url);
    }
  }

  // Add session info to request headers for API routes
  if (session && pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email || '');
  }

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://s3.tradingview.com https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://s.tradingview.com;
    connect-src 'self' https://api.coinbase.com wss://ws-feed.exchange.coinbase.com https://*.supabase.co wss://*.supabase.co;
  `.replace(/\n/g, '');

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};