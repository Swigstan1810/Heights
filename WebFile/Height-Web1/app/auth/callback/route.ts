// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestUrl.origin;
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const state = requestUrl.searchParams.get('state');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, errorDescription });
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', error);
    redirectUrl.searchParams.set('error_description', errorDescription || 'Authentication failed');
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
      
      // Exchange code for session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError);
        const redirectUrl = new URL('/login', baseUrl);
        redirectUrl.searchParams.set('error', 'session_error');
        redirectUrl.searchParams.set('error_description', sessionError.message);
        return NextResponse.redirect(redirectUrl);
      }
      
      if (session) {
        // Log successful OAuth login
        await supabase.rpc('log_security_event', {
          p_user_id: session.user.id,
          p_event_type: 'oauth_login_success',
          p_event_details: {
            provider: session.user.app_metadata?.provider || 'unknown',
            email: session.user.email,
            email_verified: session.user.user_metadata?.email_verified || false,
          },
          p_ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          p_user_agent: request.headers.get('user-agent') || 'unknown'
        });
        
        // Check if this is a new user (first time Google login)
        const { data: profile } = await supabase
          .from('profiles')
          .select('kyc_completed, email_verified')
          .eq('id', session.user.id)
          .single();
        
        // Always redirect to dashboard, regardless of KYC status
        return NextResponse.redirect(new URL('/dashboard', baseUrl));
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      const redirectUrl = new URL('/login', baseUrl);
      redirectUrl.searchParams.set('error', 'callback_error');
      redirectUrl.searchParams.set('error_description', 'An error occurred during authentication');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', baseUrl));
}