import type { DapRequest, DapRequestEvent } from '../dap/registry/dapRequestTypes'
import { getSupabaseAdminClient } from './supabaseClient'

// ─── listDapRequests ──────────────────────────────────────────────────────────
// Returns all DAP requests, newest first. Scoped to the DAP vertical.
// Read-only — no mutations.

export async function listDapRequests(): Promise<DapRequest[]> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_requests')
    .select('*')
    .eq('vertical_key', 'dap')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listDapRequests failed: ${error.message}`)
  return (data ?? []) as DapRequest[]
}

// ─── getDapRequest ────────────────────────────────────────────────────────────
// Returns a single DAP request by id, or null if not found.
// Read-only — no mutations.

export async function getDapRequest(id: string): Promise<DapRequest | null> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_requests')
    .select('*')
    .eq('id', id)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (error) throw new Error(`getDapRequest failed: ${error.message}`)
  return (data as DapRequest | null)
}

// ─── getDapRequestEvents ──────────────────────────────────────────────────────
// Returns all events for a request, oldest first (chronological audit log).
// Read-only — no mutations.

export async function getDapRequestEvents(requestId: string): Promise<DapRequestEvent[]> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_request_events')
    .select('*')
    .eq('request_id', requestId)
    .order('event_timestamp', { ascending: true })

  if (error) throw new Error(`getDapRequestEvents failed: ${error.message}`)
  return (data ?? []) as DapRequestEvent[]
}
