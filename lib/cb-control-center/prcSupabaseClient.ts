import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrcAdminClient = SupabaseClient<any, 'public', any>

// Server-side admin client for the PremiumRoast Supabase project
// (lyhujabgfykccweoypwr) — a SEPARATE project from CB Control Center's own DB.
// Powers the /platform Channel Intelligence dashboard. Uses the PRC service role
// key. Never expose this to the browser; only import from server-only code.
function createPrcAdminClient(): PrcAdminClient {
  const url = process.env.PRC_SUPABASE_URL
  const key = process.env.PRC_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'PRC_SUPABASE_URL and PRC_SUPABASE_SERVICE_ROLE_KEY must be set in environment'
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Lazily initialized so missing env vars surface at call time, not at module load.
let _client: PrcAdminClient | null = null

export function getPrcSupabaseClient(): PrcAdminClient {
  if (!_client) {
    _client = createPrcAdminClient()
  }
  return _client
}
