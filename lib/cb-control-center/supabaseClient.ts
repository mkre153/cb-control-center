// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, 'public', any>

// Server-side admin client — uses service role key.
// Never expose this to the browser; only import from server-only code.
function createSupabaseAdminClient(): AdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment'
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Lazily initialized so missing env vars surface at call time, not at module load.
let _client: AdminClient | null = null

export function getSupabaseAdminClient(): AdminClient {
  if (!_client) {
    _client = createSupabaseAdminClient()
  }
  return _client
}
