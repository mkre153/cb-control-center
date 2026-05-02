import type { DapRequest, DapRequestStatus, DapRequestEventType } from './dapRequestTypes'
import type { DapAdminRejectionEmailTemplateKey } from './dapAdminRejectionEmailTypes'
import { canTransitionDapRequestStatus } from './dapRequestRules'
import { getSupabaseAdminClient } from './supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DapRequestDecisionInput {
  requestId: string
  actorId?: string
  note?: string
  rejectionEmailTemplateKey?: DapAdminRejectionEmailTemplateKey
}

export type DapRequestActionResult =
  | {
      ok: true
      request: DapRequest
      eventType: DapRequestEventType
      previousStatus: DapRequestStatus
      newStatus: DapRequestStatus
    }
  | {
      ok: false
      code:
        | 'request_not_found'
        | 'vertical_scope_mismatch'
        | 'invalid_transition'
        | 'status_update_failed'
        | 'event_insert_failed'
      message: string
    }

// ─── Internal types ───────────────────────────────────────────────────────────

interface DapRequestMeta {
  id: string
  request_status: DapRequestStatus
  vertical_key: string
}

// ─── fetchDapRequestForMutation ───────────────────────────────────────────────
// Reads request metadata for mutation. Scoped by both id and vertical_key.
// Returns null if not found or if vertical_key ≠ 'dap'.

async function fetchDapRequestForMutation(
  db: ReturnType<typeof getSupabaseAdminClient>,
  requestId: string,
): Promise<DapRequestMeta | null> {
  const { data, error } = await db
    .from('dap_requests')
    .select('id, request_status, vertical_key')
    .eq('id', requestId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (error || !data) return null
  return data as DapRequestMeta
}

// ─── executeDecision ──────────────────────────────────────────────────────────
// Shared decision execution:
// 1. Validates the transition is allowed
// 2. Updates request status (double-scoped by id + vertical_key)
// 3. Inserts append-only event with full transition metadata
// Steps 2 and 3 only run if step 1 passes — no partial events on invalid transitions.

async function executeDecision(
  db: ReturnType<typeof getSupabaseAdminClient>,
  existing: DapRequestMeta,
  newStatus: 'approved' | 'rejected' | 'needs_review',
  eventType: 'request_approved' | 'request_rejected' | 'request_needs_review',
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const previousStatus = existing.request_status

  if (!canTransitionDapRequestStatus(previousStatus, newStatus)) {
    return {
      ok: false,
      code: 'invalid_transition',
      message: `Cannot transition from '${previousStatus}' to '${newStatus}'`,
    }
  }

  const { data: updated, error: updateError } = await db
    .from('dap_requests')
    .update({ request_status: newStatus })
    .eq('id', existing.id)
    .eq('vertical_key', 'dap')
    .select()
    .single()

  if (updateError) {
    return { ok: false, code: 'status_update_failed', message: updateError.message }
  }

  const { error: eventError } = await db
    .from('dap_request_events')
    .insert({
      request_id: existing.id,
      event_type: eventType,
      actor_type: 'admin',
      event_note: input.note ?? null,
      metadata_json: {
        previous_status: previousStatus,
        new_status: newStatus,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, request: updated as DapRequest, eventType, previousStatus, newStatus }
}

// ─── approveDapRequest ────────────────────────────────────────────────────────
// approved ≠ provider confirmed. Does not publish a dentist page.
// Does not validate offer terms. Does not unlock patient-facing claims.

export async function approveDapRequest(
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const db = getSupabaseAdminClient()
  const existing = await fetchDapRequestForMutation(db, input.requestId)
  if (!existing) {
    return { ok: false, code: 'request_not_found', message: 'Request not found or not in DAP vertical' }
  }
  return executeDecision(db, existing, 'approved', 'request_approved', input)
}

// ─── rejectDapRequest ─────────────────────────────────────────────────────────
// rejection does not trigger patient notification — that is a later phase.

export async function rejectDapRequest(
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const db = getSupabaseAdminClient()
  const existing = await fetchDapRequestForMutation(db, input.requestId)
  if (!existing) {
    return { ok: false, code: 'request_not_found', message: 'Request not found or not in DAP vertical' }
  }
  return executeDecision(db, existing, 'rejected', 'request_rejected', input)
}

// ─── markDapRequestNeedsReview ────────────────────────────────────────────────
// Flags a DAP request as needing further review before a final decision.

export async function markDapRequestNeedsReview(
  input: DapRequestDecisionInput,
): Promise<DapRequestActionResult> {
  const db = getSupabaseAdminClient()
  const existing = await fetchDapRequestForMutation(db, input.requestId)
  if (!existing) {
    return { ok: false, code: 'request_not_found', message: 'Request not found or not in DAP vertical' }
  }
  return executeDecision(db, existing, 'needs_review', 'request_needs_review', input)
}
