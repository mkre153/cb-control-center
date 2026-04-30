import type { DapPublicPageKind } from './dapPublicUxTypes'

// ─── Source page kinds ────────────────────────────────────────────────────────
// All public page kinds may originate a request.
export type DapRequestSourcePageKind = DapPublicPageKind

// ─── Request status lifecycle ─────────────────────────────────────────────────
// Status represents the operational state of a single request record.
// Transitions are constrained — see canTransitionDapRequestStatus in dapRequestRules.ts.
// No status implies enrollment. provider_confirmed requires an external onboarding flow.
// Phase 9F: approved/rejected/needs_review are admin review decisions only.
// approved ≠ provider confirmed. approved ≠ public provider page. approved = initial review passed.
export type DapRequestStatus =
  | 'draft'
  | 'submitted'
  | 'consent_verified'
  | 'queued_for_review'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'practice_outreach_ready'
  | 'practice_contacted'
  | 'practice_declined'
  | 'practice_interested'
  | 'provider_onboarding_started'
  | 'provider_confirmed'
  | 'closed_no_response'
  | 'closed_invalid'
  | 'closed_duplicate'
  | 'closed_user_requested_stop'

// ─── Event types ──────────────────────────────────────────────────────────────
// Events are append-only. Status is updated only through allowed transitions.
// consent_captured events must preserve a snapshot of consent_text in metadata_json.
// Phase 9F: request_approved/rejected/needs_review are admin review events only.
export type DapRequestEventType =
  | 'request_created'
  | 'consent_captured'
  | 'request_validated'
  | 'duplicate_detected'
  | 'queued_for_manual_review'
  | 'marked_outreach_ready'
  | 'request_approved'
  | 'request_rejected'
  | 'request_needs_review'
  | 'practice_contacted'
  | 'practice_response_received'
  | 'provider_onboarding_started'
  | 'provider_confirmation_linked'
  | 'user_contacted'
  | 'user_opted_out'
  | 'request_closed'

// ─── Actor types ──────────────────────────────────────────────────────────────
export type DapRequestActorType = 'system' | 'patient' | 'admin' | 'practice'

// ─── Client/vertical scoping ──────────────────────────────────────────────────
// dap_requests lives in the CB Control Center Supabase project, not a DAP-specific DB.
// These fields scope every row to the originating client, vertical, and optional project.
// DAP is a vertical inside CB Control Center — it does not own the database.
export interface DapRequestScope {
  client_key: string   // e.g. 'dental_advantage_plan'
  vertical_key: string // e.g. 'dap'
  project_key: string | null // optional sub-project, e.g. 'sd-launch'; null = no sub-scoping
}

// Default scope for all DAP requests originating from the public DAP site.
export const DAP_REQUEST_SCOPE: DapRequestScope = {
  client_key: 'dental_advantage_plan',
  vertical_key: 'dap',
  project_key: null,
}

// ─── Input (pre-persist) ──────────────────────────────────────────────────────
// Shape of data collected from the request flow before persistence.
// Validated by validateDapRequestInput() before a DapRequest record is created.
export interface DapRequestInput {
  // Scoping — injected by the API route, not user-supplied
  client_key: string
  vertical_key: string
  project_key: string | null
  // Contact
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  // Geographic target
  city: string | null
  zip: string | null
  preferred_practice_name: string | null
  preferred_practice_slug: string | null
  // Intent
  treatment_interest: string | null
  // Consent
  consent_to_contact_practice: boolean
  consent_to_contact_patient: boolean
  consent_text: string
  no_phi_acknowledged: boolean
  // Optional note
  user_message: string | null
  // Attribution
  source_page_kind: DapRequestSourcePageKind
  source_path: string
}

// ─── Persisted request record ─────────────────────────────────────────────────
// Maps to the dap_requests table in the CB Control Center Supabase project.
// All timestamps are ISO 8601 strings (UTC).
// ip_hash and user_agent_hash are one-way hashed before persistence.
export interface DapRequest {
  id: string
  created_at: string
  updated_at: string
  // Scoping — identifies which client/vertical/project owns this request row
  client_key: string
  vertical_key: string
  project_key: string | null
  request_status: DapRequestStatus
  source_page_kind: DapRequestSourcePageKind
  source_path: string
  city: string | null
  zip: string | null
  preferred_practice_name: string | null
  preferred_practice_slug: string | null
  treatment_interest: string | null
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  consent_to_contact_practice: boolean
  consent_to_contact_patient: boolean
  consent_text: string
  consent_timestamp: string
  no_phi_acknowledged: boolean
  user_message: string | null
  dedupe_key: string
  ip_hash: string | null
  user_agent_hash: string | null
}

// ─── Request event record ─────────────────────────────────────────────────────
// Maps to the conceptual dap_request_events table.
// Append-only — records are never updated or deleted.
export interface DapRequestEvent {
  id: string
  request_id: string
  event_type: DapRequestEventType
  event_timestamp: string
  actor_type: DapRequestActorType
  event_note: string | null
  metadata_json: Record<string, unknown> | null
}

// ─── Validation ───────────────────────────────────────────────────────────────
export interface DapRequestValidationIssue {
  field: string
  code: string
  message: string
}

export interface DapRequestValidationResult {
  valid: boolean
  issues: DapRequestValidationIssue[]
}

// ─── Safety flags ─────────────────────────────────────────────────────────────
// Structural invariants on the request system — typed as literal false/true
// to prevent accidental re-assignment at callsites.
export interface DapRequestSafetyFlags {
  readonly impliesEnrollment: false
  readonly impliesGuaranteedAvailability: false
  readonly impliesGuaranteedPricing: false
  readonly requiresConsent: true
  phiRiskDetected: boolean
  duplicateRisk: boolean
}

// ─── Confirmation model ───────────────────────────────────────────────────────
// Shown to the patient after successful submission.
// All safety fields are typed as literal false to enforce correct messaging at compile time.
export interface DapRequestConfirmationModel {
  readonly requestReceived: true
  readonly isEnrollment: false
  readonly guaranteesAvailability: false
  readonly guaranteesPricing: false
  readonly practiceContactedWithoutConsent: false
  headline: string
  body: string
  nextStep: string
  mayContactForClarification: boolean
}
