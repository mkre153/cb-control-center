// ─── Participation confirmation status ────────────────────────────────────────
// Internal workflow only. No public, published, or patient-facing status here.
// participation_confirmed records explicit agreement — it does not unlock public eligibility.
export type DapProviderParticipationStatus =
  | 'confirmation_started'
  | 'agreement_sent'
  | 'agreement_received'
  | 'participation_confirmed'
  | 'participation_declined'
  | 'confirmation_voided'

// ─── Event types ──────────────────────────────────────────────────────────────
export type DapProviderParticipationEventType =
  | 'provider_participation.confirmation_started'
  | 'provider_participation.agreement_sent'
  | 'provider_participation.agreement_received'
  | 'provider_participation.participation_confirmed'
  | 'provider_participation.participation_declined'
  | 'provider_participation.confirmation_voided'
  | 'provider_participation.note_added'

// ─── Agreement tracking fields ────────────────────────────────────────────────
// All internal-only. None of these unlock public provider eligibility.
export interface DapProviderParticipationFields {
  agreementSentAt?: string
  agreementReceivedAt?: string
  signerName?: string
  signerTitle?: string
  signerEmail?: string
  agreementVersion?: string
  agreementDocumentUrl?: string
  confirmationNotes?: string
}

// ─── Confirmation record ──────────────────────────────────────────────────────
// Maps to dap_provider_participation_confirmations table.
// One record per offer terms review. Not a public provider record.
export interface DapProviderParticipationConfirmation {
  id: string
  created_at: string
  updated_at: string
  review_id: string
  draft_id: string
  practice_name: string | null
  city: string | null
  vertical_key: string
  status: DapProviderParticipationStatus
  agreement_sent_at: string | null
  agreement_received_at: string | null
  signer_name: string | null
  signer_title: string | null
  signer_email: string | null
  agreement_version: string | null
  agreement_document_url: string | null
  confirmation_notes: string | null
  actor_id: string | null
}

// ─── Event record ─────────────────────────────────────────────────────────────
export interface DapProviderParticipationEvent {
  id: string
  confirmation_id: string
  event_type: DapProviderParticipationEventType
  event_timestamp: string
  actor_type: string
  actor_id: string | null
  event_note: string | null
  metadata_json: Record<string, unknown> | null
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateDapProviderParticipationInput {
  reviewId: string
  actorId?: string
  note?: string
}

export interface DapProviderParticipationActionInput {
  confirmationId: string
  reviewId: string
  fields?: DapProviderParticipationFields
  actorId?: string
  note?: string
}

export interface UpdateDapProviderParticipationInput {
  confirmationId: string
  reviewId: string
  fields: DapProviderParticipationFields
  actorId?: string
  note?: string
}

// ─── Failure codes ────────────────────────────────────────────────────────────

export type DapProviderParticipationFailureCode =
  | 'review_not_found'
  | 'vertical_scope_mismatch'
  | 'review_not_passed'
  | 'confirmation_already_exists'
  | 'confirmation_not_found'
  | 'invalid_transition'
  | 'confirmation_update_failed'
  | 'event_insert_failed'

// ─── Result type ──────────────────────────────────────────────────────────────

export type DapProviderParticipationResult =
  | { ok: true; confirmation: DapProviderParticipationConfirmation }
  | { ok: false; code: DapProviderParticipationFailureCode; message: string }
