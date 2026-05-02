// ─── Draft workflow status ────────────────────────────────────────────────────
// Collection and internal review only. No approved, validated, or public status.
// Those belong to a later phase after offer terms review.
export type DapOfferTermsDraftStatus =
  | 'draft_created'
  | 'collecting_terms'
  | 'submitted_for_review'
  | 'needs_clarification'

// ─── Event types ──────────────────────────────────────────────────────────────
export type DapOfferTermsEventType =
  | 'offer_terms.draft_created'
  | 'offer_terms.draft_updated'
  | 'offer_terms.submitted_for_review'
  | 'offer_terms.needs_clarification'
  | 'offer_terms.note_added'

// ─── Structured offer fields ──────────────────────────────────────────────────
// Internal only. Never used in CMS export, public pages, or patient-facing claims.
export interface DapOfferTermsDraftFields {
  planName?: string
  annualMembershipFee?: number
  includedCleaningsPerYear?: number
  includedExamsPerYear?: number
  includedXraysPerYear?: number
  preventiveCareSummary?: string
  discountPercentage?: number
  excludedServices?: string[]
  waitingPeriod?: string
  cancellationTerms?: string
  renewalTerms?: string
  notes?: string
}

// ─── Draft record ─────────────────────────────────────────────────────────────
// Maps to dap_offer_terms_drafts table. One draft per onboarding intake.
// Not a validated pricing record. Not a public provider claim.
export interface DapOfferTermsDraft {
  id: string
  created_at: string
  updated_at: string
  onboarding_intake_id: string
  vertical_key: string
  client_key: string
  status: DapOfferTermsDraftStatus
  practice_name: string | null
  practice_slug: string | null
  city: string | null
  zip: string | null
  plan_name: string | null
  annual_membership_fee: number | null
  included_cleanings_per_year: number | null
  included_exams_per_year: number | null
  included_xrays_per_year: number | null
  preventive_care_summary: string | null
  discount_percentage: number | null
  excluded_services: string[] | null
  waiting_period: string | null
  cancellation_terms: string | null
  renewal_terms: string | null
  notes: string | null
  actor_id: string | null
}

// ─── Event record ─────────────────────────────────────────────────────────────
export interface DapOfferTermsEvent {
  id: string
  draft_id: string
  event_type: DapOfferTermsEventType
  event_timestamp: string
  actor_type: string
  actor_id: string | null
  event_note: string | null
  metadata_json: Record<string, unknown> | null
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateDapOfferTermsDraftInput {
  onboardingIntakeId: string
  actorId?: string
  note?: string
  fields?: DapOfferTermsDraftFields
}

export interface UpdateDapOfferTermsDraftInput {
  draftId: string
  actorId?: string
  note?: string
  fields: DapOfferTermsDraftFields
}

export interface DapOfferTermsActionInput {
  draftId: string
  actorId?: string
  note?: string
}

// ─── Failure codes ────────────────────────────────────────────────────────────

export type DapOfferTermsFailureCode =
  | 'onboarding_not_found'
  | 'vertical_scope_mismatch'
  | 'onboarding_status_not_eligible'
  | 'draft_already_exists'
  | 'draft_not_found'
  | 'draft_update_failed'
  | 'event_insert_failed'
  | 'invalid_transition'

// ─── Result type ──────────────────────────────────────────────────────────────

export type DapOfferTermsResult =
  | { ok: true; draft: DapOfferTermsDraft }
  | { ok: false; code: DapOfferTermsFailureCode; message: string }
