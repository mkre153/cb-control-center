import type { DapRequest, DapRequestEvent, DapRequestInput } from '../dap/registry/dapRequestTypes'
import { buildDapRequestDedupeKey } from './dapRequestRules'
import { getSupabaseAdminClient } from './supabaseClient'

// ─── createDapRequest ─────────────────────────────────────────────────────────
// Persists a new DAP request from a validated, normalized DapRequestInput.
// Initial status is always 'submitted' — never 'enrolled' or any CRM state.

export async function createDapRequest(
  input: DapRequestInput,
  meta: { ip_hash: string | null; user_agent_hash: string | null },
): Promise<DapRequest> {
  const db = getSupabaseAdminClient()
  const dedupe_key = buildDapRequestDedupeKey(input)
  const now = new Date().toISOString()

  const { data, error } = await db
    .from('dap_requests')
    .insert({
      // Scoping — CB Control Center is the DB owner; DAP is a client vertical
      client_key: input.client_key,
      vertical_key: input.vertical_key,
      project_key: input.project_key,
      request_status: 'submitted',
      source_page_kind: input.source_page_kind,
      source_path: input.source_path,
      city: input.city,
      zip: input.zip,
      preferred_practice_name: input.preferred_practice_name,
      preferred_practice_slug: input.preferred_practice_slug,
      treatment_interest: input.treatment_interest,
      requester_name: input.requester_name,
      requester_email: input.requester_email,
      requester_phone: input.requester_phone,
      consent_to_contact_practice: input.consent_to_contact_practice,
      consent_to_contact_patient: input.consent_to_contact_patient,
      consent_text: input.consent_text,
      consent_timestamp: now,
      no_phi_acknowledged: input.no_phi_acknowledged,
      user_message: input.user_message,
      dedupe_key,
      ip_hash: meta.ip_hash,
      user_agent_hash: meta.user_agent_hash,
    })
    .select()
    .single()

  if (error) throw new Error(`createDapRequest failed: ${error.message}`)
  return data as DapRequest
}

// ─── createDapRequestEvent ────────────────────────────────────────────────────
// Appends an event to the event log. The event log is append-only.
// consent_captured events must include consent_text in metadata_json.

export async function createDapRequestEvent(
  event: Omit<DapRequestEvent, 'id' | 'event_timestamp'>,
): Promise<DapRequestEvent> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_request_events')
    .insert(event)
    .select()
    .single()

  if (error) throw new Error(`createDapRequestEvent failed: ${error.message}`)
  return data as DapRequestEvent
}

// ─── findDuplicateDapRequest ──────────────────────────────────────────────────
// Returns the most recent active request for the given dedupe key, or null.
// Closed/invalid/duplicate requests are excluded from duplicate detection.

const CLOSED_STATUSES = [
  'closed_invalid',
  'closed_duplicate',
  'closed_user_requested_stop',
  'closed_no_response',
]

export async function findDuplicateDapRequest(
  dedupeKey: string,
): Promise<DapRequest | null> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_requests')
    .select('*')
    .eq('dedupe_key', dedupeKey)
    .not('request_status', 'in', `(${CLOSED_STATUSES.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`findDuplicateDapRequest failed: ${error.message}`)
  return (data as DapRequest | null)
}

// ─── sanitizeDapRequestForConfirmation ───────────────────────────────────────
// Returns only the fields safe to expose in the API confirmation response.
// Does not include PII, hashes, or internal status fields beyond request_status.

export function sanitizeDapRequestForConfirmation(
  request: DapRequest,
): Pick<DapRequest, 'id' | 'request_status' | 'created_at'> {
  return {
    id: request.id,
    request_status: request.request_status,
    created_at: request.created_at,
  }
}
