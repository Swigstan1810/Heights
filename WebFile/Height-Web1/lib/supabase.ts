// lib/supabase.ts - Production-ready Supabase configuration with robust error handling
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Debug logger for Supabase issues
const supabaseDebug = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Supabase Debug] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[Supabase Error] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Supabase Warning] ${message}`, data || '');
  }
};

// Validate environment variables with detailed debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

supabaseDebug.log('Environment variables check', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
});

if (!supabaseUrl) {
  supabaseDebug.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not defined');
}

if (!supabaseAnonKey) {
  supabaseDebug.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not defined');
}

// Create supabase client with error handling
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

try {
  supabaseClient = createClientComponentClient<Database>({
    supabaseUrl,
    supabaseKey: supabaseAnonKey
  });
  supabaseDebug.log('Successfully created Supabase client');
} catch (error) {
  supabaseDebug.error('Failed to create Supabase client', error);
  throw error;
}

export const supabase = supabaseClient;

// Helper to create a new client instance when needed
export function createClientInstance() {
  try {
    supabaseDebug.log('Creating new Supabase client instance');
    return createClientComponentClient<Database>({
      supabaseUrl: supabaseUrl!,
      supabaseKey: supabaseAnonKey!
    });
  } catch (error) {
    supabaseDebug.error('Failed to create new Supabase client instance', error);
    throw error;
  }
}

// Direct client for cases where auth helpers don't work
export const directSupabase = (() => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      supabaseDebug.warn('Cannot create direct Supabase client - missing credentials');
      return null;
    }
    
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      global: {
        headers: {
          'X-Client-Info': 'Heights-Web-App'
        }
      }
    });
    
    supabaseDebug.log('Successfully created direct Supabase client');
    return client;
  } catch (error) {
    supabaseDebug.error('Failed to create direct Supabase client', error);
    return null;
  }
})();

// Health check function
export async function checkSupabaseConnection() {
  try {
    supabaseDebug.log('Checking Supabase connection');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Simple health check - try to get session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      supabaseDebug.warn('Supabase session check failed', error);
      return { success: false, error: error.message };
    }
    
    supabaseDebug.log('Supabase connection healthy', { hasSession: !!data.session });
    return { success: true, hasSession: !!data.session };
  } catch (error) {
    supabaseDebug.error('Supabase health check failed', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export debug utilities for use in other files
export { supabaseDebug };