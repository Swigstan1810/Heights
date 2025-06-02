import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Get session (can be used for logging or future use)
  const { data: { session } } = await supabase.auth.getSession();
  
  // Removed all redirect logic for auth protection.
  // Client-side context will handle authentication and redirects.
  
  return response;
}