// ─── Review status ────────────────────────────────────────────────────────────
// Internal review gate only. No final public status lives here.
// review_passed means criteria are met for internal handoff — nothing more.
export type DapOfferTermsReviewStatus =
  | 'review_started'
  | 'review_passed'
  | 'review_failed'
  | 'clarification_requested'

// ─── Review event types ───────────────────────────────────────────────────────
export type DapOfferTermsReviewEventType =
  | 'offer_terms_review.review_started'
  | 'offer_terms_review.review_passed'
  | 'offer_terms_review.review_failed'
  | 'offer_terms_review.clarification_requested'
  | 'offer_terms_review.note_added'

// ─── Structured review criteria ───────────────────────────────────────────────
// All required fields must be true before a review can be marked as passed.
export interface DapOfferTermsReviewCriteria {
  planNamePresent: boolean
  annualFeePresent: boolean
  preventiveCareDefined: boolean
  discountTermsDefined: boolean
  exclusionsDefined: boolean
  cancellationTermsDefined: boolean
  renewalTermsDefined: boolean
  reviewerNotes?: string
}

// ─── Review record ────────────────────────────────────────────────────────────
// Maps to dap_offer_terms_reviews table. One record per offer terms draft.
export interface DapOfferTermsReview {
  id: string
  created_at: string
  updated_at: string
  draft_id: string
  vertical_key: string
  status: DapOfferTermsReviewStatus
  criteria_json: DapOfferTermsReviewCriteria | null
  actor_id: string | null
}

// ─── Review event record ──────────────────────────────────────────────────────
export interface DapOfferTermsReviewEvent {
  id: string
  review_id: string
  event_type: DapOfferTermsReviewEventType
  event_timestamp: string
  actor_type: string
  actor_id: string | null
  event_note: string | null
  metadata_json: Record<string, unknown> | null
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateDapOfferTermsReviewInput {
  draftId: string
  actorId?: string
  note?: string
}

export interface DapOfferTermsReviewActionInput {
  reviewId: string
  draftId: string
  criteria?: DapOfferTermsReviewCriteria
  actorId?: string
  note?: string
}

// ─── Failure codes ────────────────────────────────────────────────────────────

export type DapOfferTermsReviewFailureCode =
  | 'draft_not_found'
  | 'vertical_scope_mismatch'
  | 'draft_not_submitted_for_review'
  | 'review_already_exists'
  | 'review_not_found'
  | 'criteria_not_satisfied'
  | 'invalid_transition'
  | 'review_update_failed'
  | 'event_insert_failed'

// ─── Result type ──────────────────────────────────────────────────────────────

export type DapOfferTermsReviewResult =
  | { ok: true; review: DapOfferTermsReview }
  | { ok: false; code: DapOfferTermsReviewFailureCode; message: string }
