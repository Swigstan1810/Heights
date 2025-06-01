import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if this is a protected route
  const protectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                         request.nextUrl.pathname.startsWith('/trade') || 
                         request.nextUrl.pathname.startsWith('/portfolio');
  
  // Check if this is an auth route (login, signup)
  const authRoute = request.nextUrl.pathname.startsWith('/login') || 
                   request.nextUrl.pathname.startsWith('/signup');
  
  // Redirect logic (KYC completely disabled)
  if (protectedRoute && !session) {
    // If trying to access protected route without being logged in
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (authRoute && session) {
    // If trying to access auth routes while logged in, go straight to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return response;
}