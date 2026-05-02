import type {
  DapProviderParticipationConfirmation,
  DapProviderParticipationEvent,
  DapProviderParticipationEventType,
  DapProviderParticipationStatus,
  DapProviderParticipationResult,
  DapProviderParticipationFields,
  CreateDapProviderParticipationInput,
  DapProviderParticipationActionInput,
  UpdateDapProviderParticipationInput,
} from '../dap/registry/dapProviderParticipationTypes'
import {
  isOfferTermsReviewEligibleForParticipationConfirmation,
  assertValidDapProviderParticipationTransition,
} from './dapProviderParticipationRules'
import { getSupabaseAdminClient } from './supabaseClient'

// participation_confirmed ≠ practice ready for public listing
// participation_confirmed ≠ pricing terms usable in patient-facing claims
// participation_confirmed records explicit practice agreement for internal tracking only

// ─── Field conversion helpers ─────────────────────────────────────────────────

function fieldsToDbRecord(fields: DapProviderParticipationFields): Record<string, unknown> {
  return {
    ...(fields.agreementSentAt       !== undefined ? { agreement_sent_at:      fields.agreementSentAt || null }       : {}),
    ...(fields.agreementReceivedAt   !== undefined ? { agreement_received_at:  fields.agreementReceivedAt || null }   : {}),
    ...(fields.signerName            !== undefined ? { signer_name:            fields.signerName || null }            : {}),
    ...(fields.signerTitle           !== undefined ? { signer_title:           fields.signerTitle || null }           : {}),
    ...(fields.signerEmail           !== undefined ? { signer_email:           fields.signerEmail || null }           : {}),
    ...(fields.agreementVersion      !== undefined ? { agreement_version:      fields.agreementVersion || null }      : {}),
    ...(fields.agreementDocumentUrl  !== undefined ? { agreement_document_url: fields.agreementDocumentUrl || null }  : {}),
    ...(fields.confirmationNotes     !== undefined ? { confirmation_notes:     fields.confirmationNotes || null }     : {}),
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchReviewForParticipation(reviewId: string): Promise<
  | { ok: true; review: { id: string; status: string; vertical_key: string; draft_id: string } }
  | { ok: false; code: 'review_not_found' | 'vertical_scope_mismatch' | 'review_not_passed'; message: string }
> {
  const db = getSupabaseAdminClient()
  const { data: review } = await db
    .from('dap_offer_terms_reviews')
    .select('id, status, vertical_key, draft_id')
    .eq('id', reviewId)
    .maybeSingle()

  if (!review) {
    return { ok: false, code: 'review_not_found', message: `Review ${reviewId} not found` }
  }

  if (review.vertical_key !== 'dap') {
    return { ok: false, code: 'vertical_scope_mismatch', message: 'Review does not belong to DAP vertical' }
  }

  if (review.status !== 'review_passed') {
    return {
      ok: false,
      code: 'review_not_passed',
      message: `Review status '${review.status}' is not eligible for participation confirmation (must be review_passed)`,
    }
  }

  return { ok: true, review }
}

async function fetchConfirmation(confirmationId: string): Promise<
  | { ok: true; confirmation: DapProviderParticipationConfirmation }
  | { ok: false; code: 'confirmation_not_found'; message: string }
> {
  const db = getSupabaseAdminClient()
  const { data: confirmation } = await db
    .from('dap_provider_participation_confirmations')
    .select('*')
    .eq('id', confirmationId)
    .maybeSingle()

  if (!confirmation) {
    return {
      ok: false,
      code: 'confirmation_not_found',
      message: `Participation confirmation ${confirmationId} not found`,
    }
  }

  return { ok: true, confirmation: confirmation as DapProviderParticipationConfirmation }
}

async function executeParticipationTransition(
  confirmationId: string,
  reviewId: string,
  newStatus: DapProviderParticipationStatus,
  eventType: DapProviderParticipationEventType,
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const confFetch = await fetchConfirmation(confirmationId)
  if (!confFetch.ok) return confFetch

  const { confirmation } = confFetch
  const previousStatus = confirmation.status

  try {
    assertValidDapProviderParticipationTransition(previousStatus, newStatus)
  } catch {
    return {
      ok: false,
      code: 'invalid_transition',
      message: `Cannot transition '${previousStatus}' → '${newStatus}'`,
    }
  }

  const db = getSupabaseAdminClient()

  const fieldUpdate = input.fields ? fieldsToDbRecord(input.fields) : {}
  const { data: updated, error: updateError } = await db
    .from('dap_provider_participation_confirmations')
    .update({ status: newStatus, ...fieldUpdate })
    .eq('id', confirmationId)
    .select()
    .single()

  if (updateError || !updated) {
    return {
      ok: false,
      code: 'confirmation_update_failed',
      message: updateError?.message ?? 'Status update failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_provider_participation_events')
    .insert({
      confirmation_id: confirmationId,
      event_type:      eventType,
      actor_type:      'admin',
      event_note:      input.note ?? null,
      metadata_json:   {
        previous_status: previousStatus,
        new_status:      newStatus,
        review_id:       reviewId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, confirmation: updated as DapProviderParticipationConfirmation }
}

// ─── startProviderParticipationConfirmation ────────────────────────────────────

export async function startProviderParticipationConfirmation(
  input: CreateDapProviderParticipationInput,
): Promise<DapProviderParticipationResult> {
  const reviewCheck = await fetchReviewForParticipation(input.reviewId)
  if (!reviewCheck.ok) return reviewCheck

  const { review } = reviewCheck
  const db = getSupabaseAdminClient()

  // Block duplicate active confirmation for same review
  const { data: existing } = await db
    .from('dap_provider_participation_confirmations')
    .select('id')
    .eq('review_id', input.reviewId)
    .maybeSingle()

  if (existing) {
    return {
      ok: false,
      code: 'confirmation_already_exists',
      message: `A participation confirmation already exists for review ${input.reviewId}`,
    }
  }

  // Fetch draft for practice snapshot
  const { data: draft } = await db
    .from('dap_offer_terms_drafts')
    .select('id, practice_name, city')
    .eq('id', review.draft_id)
    .maybeSingle()

  const { data: confirmation, error: insertError } = await db
    .from('dap_provider_participation_confirmations')
    .insert({
      review_id:     input.reviewId,
      draft_id:      review.draft_id,
      vertical_key:  'dap',
      status:        'confirmation_started',
      practice_name: draft?.practice_name ?? null,
      city:          draft?.city ?? null,
      actor_id:      input.actorId ?? null,
    })
    .select()
    .single()

  if (insertError || !confirmation) {
    return {
      ok: false,
      code: 'confirmation_update_failed',
      message: insertError?.message ?? 'Confirmation creation failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_provider_participation_events')
    .insert({
      confirmation_id: confirmation.id,
      event_type:      'provider_participation.confirmation_started',
      actor_type:      'admin',
      event_note:      input.note ?? null,
      metadata_json:   {
        review_id: input.reviewId,
        draft_id:  review.draft_id,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, confirmation: confirmation as DapProviderParticipationConfirmation }
}

// ─── markAgreementSent ────────────────────────────────────────────────────────

export async function markAgreementSent(
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const reviewCheck = await fetchReviewForParticipation(input.reviewId)
  if (!reviewCheck.ok) return reviewCheck

  return executeParticipationTransition(
    input.confirmationId,
    input.reviewId,
    'agreement_sent',
    'provider_participation.agreement_sent',
    input,
  )
}

// ─── markAgreementReceived ────────────────────────────────────────────────────

export async function markAgreementReceived(
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const reviewCheck = await fetchReviewForParticipation(input.reviewId)
  if (!reviewCheck.ok) return reviewCheck

  return executeParticipationTransition(
    input.confirmationId,
    input.reviewId,
    'agreement_received',
    'provider_participation.agreement_received',
    input,
  )
}

// ─── confirmProviderParticipation ─────────────────────────────────────────────

export async function confirmProviderParticipation(
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const reviewCheck = await fetchReviewForParticipation(input.reviewId)
  if (!reviewCheck.ok) return reviewCheck

  return executeParticipationTransition(
    input.confirmationId,
    input.reviewId,
    'participation_confirmed',
    'provider_participation.participation_confirmed',
    input,
  )
}

// ─── declineProviderParticipation ─────────────────────────────────────────────

export async function declineProviderParticipation(
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const reviewCheck = await fetchReviewForParticipation(input.reviewId)
  if (!reviewCheck.ok) return reviewCheck

  return executeParticipationTransition(
    input.confirmationId,
    input.reviewId,
    'participation_declined',
    'provider_participation.participation_declined',
    input,
  )
}

// ─── voidProviderParticipationConfirmation ────────────────────────────────────

export async function voidProviderParticipationConfirmation(
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const reviewCheck = await fetchReviewForParticipation(input.reviewId)
  if (!reviewCheck.ok) return reviewCheck

  return executeParticipationTransition(
    input.confirmationId,
    input.reviewId,
    'confirmation_voided',
    'provider_participation.confirmation_voided',
    input,
  )
}

// ─── addProviderParticipationNote ─────────────────────────────────────────────

export async function addProviderParticipationNote(
  input: DapProviderParticipationActionInput,
): Promise<DapProviderParticipationResult> {
  const confFetch = await fetchConfirmation(input.confirmationId)
  if (!confFetch.ok) return confFetch

  const db = getSupabaseAdminClient()

  const { error: eventError } = await db
    .from('dap_provider_participation_events')
    .insert({
      confirmation_id: input.confirmationId,
      event_type:      'provider_participation.note_added',
      actor_type:      'admin',
      event_note:      input.note ?? null,
      metadata_json:   {
        review_id: input.reviewId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, confirmation: confFetch.confirmation }
}

// ─── updateProviderParticipationFields ────────────────────────────────────────

export async function updateProviderParticipationFields(
  input: UpdateDapProviderParticipationInput,
): Promise<DapProviderParticipationResult> {
  const confFetch = await fetchConfirmation(input.confirmationId)
  if (!confFetch.ok) return confFetch

  const db = getSupabaseAdminClient()

  const { data: updated, error: updateError } = await db
    .from('dap_provider_participation_confirmations')
    .update(fieldsToDbRecord(input.fields))
    .eq('id', input.confirmationId)
    .select()
    .single()

  if (updateError || !updated) {
    return {
      ok: false,
      code: 'confirmation_update_failed',
      message: updateError?.message ?? 'Field update failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_provider_participation_events')
    .insert({
      confirmation_id: input.confirmationId,
      event_type:      'provider_participation.note_added',
      actor_type:      'admin',
      event_note:      input.note ?? null,
      metadata_json:   {
        review_id: input.reviewId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, confirmation: updated as DapProviderParticipationConfirmation }
}

// ─── getProviderParticipationByReviewId ───────────────────────────────────────

export async function getProviderParticipationByReviewId(
  reviewId: string,
): Promise<DapProviderParticipationConfirmation | null> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_provider_participation_confirmations')
    .select('*')
    .eq('review_id', reviewId)
    .eq('vertical_key', 'dap')
    .maybeSingle()
  if (error) throw new Error(`getProviderParticipationByReviewId failed: ${error.message}`)
  return data as DapProviderParticipationConfirmation | null
}

// ─── getProviderParticipationById ─────────────────────────────────────────────

export async function getProviderParticipationById(
  confirmationId: string,
): Promise<DapProviderParticipationConfirmation | null> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_provider_participation_confirmations')
    .select('*')
    .eq('id', confirmationId)
    .eq('vertical_key', 'dap')
    .maybeSingle()
  if (error) throw new Error(`getProviderParticipationById failed: ${error.message}`)
  return data as DapProviderParticipationConfirmation | null
}

// ─── getProviderParticipationEvents ──────────────────────────────────────────

export async function getProviderParticipationEvents(
  confirmationId: string,
): Promise<DapProviderParticipationEvent[]> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_provider_participation_events')
    .select('*')
    .eq('confirmation_id', confirmationId)
    .order('event_timestamp', { ascending: true })
  if (error) throw new Error(`getProviderParticipationEvents failed: ${error.message}`)
  return (data ?? []) as DapProviderParticipationEvent[]
}

// ─── listProviderParticipationConfirmations ───────────────────────────────────

export async function listProviderParticipationConfirmations(): Promise<DapProviderParticipationConfirmation[]> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_provider_participation_confirmations')
    .select('*')
    .eq('vertical_key', 'dap')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`listProviderParticipationConfirmations failed: ${error.message}`)
  return (data ?? []) as DapProviderParticipationConfirmation[]
}
