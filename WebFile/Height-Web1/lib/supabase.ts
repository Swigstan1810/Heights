// lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Create a single supabase client for interacting with your database
export const supabase = createClientComponentClient<Database>();

// Helper to create a new client instance when needed
export function createClient() {
  return createClientComponentClient<Database>();
}