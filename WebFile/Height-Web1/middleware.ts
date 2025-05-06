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
  
  // Check if this is the KYC route
  const kycRoute = request.nextUrl.pathname.startsWith('/kyc');
  
  // Handle KYC completion status (if user is logged in)
  let kycCompleted = false;
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_completed')
      .eq('id', session.user.id)
      .single();
    
    kycCompleted = profile?.kyc_completed || false;
  }

  // Redirect logic
  if (protectedRoute && !session) {
    // If trying to access protected route without being logged in
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (authRoute && session) {
    // If trying to access auth routes while logged in
    if (!kycCompleted) {
      return NextResponse.redirect(new URL('/kyc', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  if (kycRoute && session && kycCompleted) {
    // If KYC is completed and trying to access KYC page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (protectedRoute && session && !kycCompleted && !kycRoute) {
    // If user is logged in but hasn't completed KYC and tries to access protected routes
    return NextResponse.redirect(new URL('/kyc', request.url));
  }
  
  return response;
}