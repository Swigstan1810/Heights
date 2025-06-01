import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Enhanced client configuration for better session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'heights-trading-platform'
    }
  }
});

// Debug function to check auth state
export const debugAuth = async () => {
  if (typeof window !== 'undefined') {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔐 Auth Debug:', {
      session: session ? 'Active' : 'None',
      user: session?.user?.email || 'Not logged in',
      error: error?.message || 'No error',
      expires: session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A'
    });
    return { session, error };
  }
  return { session: null, error: null };
};