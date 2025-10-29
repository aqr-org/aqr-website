import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for serverless environments (Netlify Functions, etc.)
 * This client does not use cookie-based authentication and is suitable for background jobs.
 * 
 * Uses environment variables:
 * - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
 * 
 * Note: For operations that require elevated permissions (bypassing RLS),
 * you may need to use SUPABASE_SERVICE_ROLE_KEY instead of ANON_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseKey) {
    throw new Error('Missing Supabase key. Set SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

