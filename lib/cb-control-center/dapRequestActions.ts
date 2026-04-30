import type { DapRequest } from './dapRequestTypes'
import { getSupabaseAdminClient } from './supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DapRequestDecisionInput {
  requestId: string
  actorId?: string
  note?: string
}

export interface DapRequestActionResult {
  success: boolean
  request: DapRequest | null
  error?: string
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchDapRequest(
  db: ReturnType<typeof getSupabaseAdminClient>,
  requestId: string,
): Promise<{ id: string; request_status: string; vertical_key: string } | null> {
  const { data, error } = await db
    .from('dap_requests')
    .select('id, request_status, vertical_key')
    .eq('id', requestId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (error || !data) return null
  return data as { id: string; request_status: string; vertical_key: string }
}

async function setDapRequestStatus(
  db: ReturnType<typeof getSupabaseAdminClient>,
  requestId: string,
  status: 'approved' | 'rejected' | 'needs_review',
  eventType: 'request_approved' | 'request_rejected' | 'request_needs_review',
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  // Double-scope the mutation: id AND vertical_key must match
  const { data: updated, error: updateError } = await db
    .from('dap_requests')
    .update({ request_status: status })
    .eq('id', requestId)
    .eq('vertical_key', 'dap')
    .select()
    .single()

  if (updateError) {
    return { success: false, request: null, error: updateError.message }
  }

  const { error: eventError } = await db
    .from('dap_request_events')
    .insert({
      request_id: requestId,
      event_type: eventType,
      actor_type: 'admin',
      event_note: input.note ?? null,
      metadata_json: input.actorId ? { actor_id: input.actorId } : null,
    })

  if (eventError) {
    return { success: false, request: updated as DapRequest, error: eventError.message }
  }

  return { success: true, request: updated as DapRequest }
}

// ─── approveDapRequest ────────────────────────────────────────────────────────
// Marks a DAP request as approved by an internal admin reviewer.
// approved ≠ provider confirmed. Does not publish a dentist page.
// Does not validate offer terms. Does not unlock patient-facing claims.

export async function approveDapRequest(
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const db = getSupabaseAdminClient()

  const existing = await fetchDapRequest(db, input.requestId)
  if (!existing) {
    return { success: false, request: null, error: 'Request not found or not in DAP vertical' }
  }

  return setDapRequestStatus(db, input.requestId, 'approved', 'request_approved', input)
}

// ─── rejectDapRequest ─────────────────────────────────────────────────────────
// Marks a DAP request as rejected by an internal admin reviewer.
// rejection does not trigger patient notification — that is a later phase.

export async function rejectDapRequest(
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const db = getSupabaseAdminClient()

  const existing = await fetchDapRequest(db, input.requestId)
  if (!existing) {
    return { success: false, request: null, error: 'Request not found or not in DAP vertical' }
  }

  return setDapRequestStatus(db, input.requestId, 'rejected', 'request_rejected', input)
}

// ─── markDapRequestNeedsReview ────────────────────────────────────────────────
// Flags a DAP request as needing further review before a final decision.

export async function markDapRequestNeedsReview(
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const db = getSupabaseAdminClient()

  const existing = await fetchDapRequest(db, input.requestId)
  if (!existing) {
    return { success: false, request: null, error: 'Request not found or not in DAP vertical' }
  }

  return setDapRequestStatus(db, input.requestId, 'needs_review', 'request_needs_review', input)
}
