import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the service role key.
 * This bypasses Row Level Security (RLS) and should ONLY be used
 * in server-side API routes that need unrestricted database access
 * (e.g., extension data collection endpoints).
 *
 * NEVER expose this client to the browser or client-side code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
