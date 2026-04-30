// ─── Onboarding workflow status ───────────────────────────────────────────────
// Tracks internal outreach and evaluation progress for a practice.
// Provider confirmation status belongs in a later phase after offer terms validation.
export type DapPracticeOnboardingStatus =
  | 'intake_created'
  | 'outreach_needed'
  | 'outreach_started'
  | 'practice_responded'
  | 'not_interested'
  | 'interested'
  | 'terms_needed'
  | 'terms_under_review'
  | 'ready_for_offer_validation'

// ─── Onboarding event types ───────────────────────────────────────────────────
// Append-only audit events for intake state changes.
export type DapPracticeOnboardingEventType =
  | 'onboarding.intake_created'
  | 'onboarding.outreach_needed'
  | 'onboarding.status_changed'
  | 'onboarding.note_added'

// ─── Intake record ────────────────────────────────────────────────────────────
// Maps to dap_practice_onboarding_intakes table.
// One intake per approved DAP request. Not a public provider record.
export interface DapPracticeOnboardingIntake {
  id: string
  created_at: string
  updated_at: string
  request_id: string
  vertical_key: string
  client_key: string
  status: DapPracticeOnboardingStatus
  practice_name: string | null
  practice_slug: string | null
  city: string | null
  zip: string | null
  actor_id: string | null
  note: string | null
}

// ─── Onboarding event record ──────────────────────────────────────────────────
// Maps to dap_practice_onboarding_events table. Append-only.
export interface DapPracticeOnboardingEvent {
  id: string
  intake_id: string
  event_type: DapPracticeOnboardingEventType
  event_timestamp: string
  actor_type: string
  actor_id: string | null
  event_note: string | null
  metadata_json: Record<string, unknown> | null
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateDapPracticeOnboardingInput {
  requestId: string
  actorId?: string
  note?: string
}

// ─── Failure codes ────────────────────────────────────────────────────────────

export type DapPracticeOnboardingFailureCode =
  | 'request_not_found'
  | 'vertical_scope_mismatch'
  | 'request_not_approved'
  | 'intake_already_exists'
  | 'intake_create_failed'
  | 'event_insert_failed'

// ─── Result type ──────────────────────────────────────────────────────────────

export type DapPracticeOnboardingResult =
  | {
      ok: true
      intake: DapPracticeOnboardingIntake
    }
  | {
      ok: false
      code: DapPracticeOnboardingFailureCode
      message: string
    }
