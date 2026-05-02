import type {
  DapOfferTermsReview,
  DapOfferTermsReviewEvent,
  DapOfferTermsReviewEventType,
  DapOfferTermsReviewStatus,
  DapOfferTermsReviewResult,
  CreateDapOfferTermsReviewInput,
  DapOfferTermsReviewActionInput,
} from '../dap/registry/dapOfferTermsReviewTypes'
import {
  isOfferTermsDraftEligibleForReview,
  evaluateOfferTermsReviewCriteria,
  assertValidDapOfferTermsReviewTransition,
} from '../dap/registry/dapOfferTermsReviewRules'
import { getSupabaseAdminClient } from './supabaseClient'

// review_passed ≠ practice ready for public listing
// review_passed ≠ pricing terms are usable in patient-facing claims
// review_passed means internal criteria were met for the next internal handoff step

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchDraftForReview(draftId: string): Promise<
  | { ok: true; draft: { id: string; status: string; vertical_key: string } }
  | { ok: false; code: 'draft_not_found' | 'vertical_scope_mismatch' | 'draft_not_submitted_for_review'; message: string }
> {
  const db = getSupabaseAdminClient()
  const { data: draft } = await db
    .from('dap_offer_terms_drafts')
    .select('id, status, vertical_key')
    .eq('id', draftId)
    .maybeSingle()

  if (!draft) {
    return { ok: false, code: 'draft_not_found', message: `Draft ${draftId} not found` }
  }

  if (draft.vertical_key !== 'dap') {
    return { ok: false, code: 'vertical_scope_mismatch', message: 'Draft does not belong to DAP vertical' }
  }

  if (!isOfferTermsDraftEligibleForReview(draft.status as never)) {
    return {
      ok: false,
      code: 'draft_not_submitted_for_review',
      message: `Draft status '${draft.status}' is not eligible for review`,
    }
  }

  return { ok: true, draft }
}

async function fetchReview(reviewId: string): Promise<
  | { ok: true; review: DapOfferTermsReview }
  | { ok: false; code: 'review_not_found'; message: string }
> {
  const db = getSupabaseAdminClient()
  const { data: review } = await db
    .from('dap_offer_terms_reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle()

  if (!review) {
    return { ok: false, code: 'review_not_found', message: `Review ${reviewId} not found` }
  }

  return { ok: true, review: review as DapOfferTermsReview }
}

async function executeReviewTransition(
  reviewId: string,
  draftId: string,
  newStatus: DapOfferTermsReviewStatus,
  eventType: DapOfferTermsReviewEventType,
  input: DapOfferTermsReviewActionInput,
): Promise<DapOfferTermsReviewResult> {
  const reviewFetch = await fetchReview(reviewId)
  if (!reviewFetch.ok) return reviewFetch

  const { review } = reviewFetch
  const previousStatus = review.status

  try {
    assertValidDapOfferTermsReviewTransition(previousStatus, newStatus)
  } catch {
    return {
      ok: false,
      code: 'invalid_transition',
      message: `Cannot transition '${previousStatus}' → '${newStatus}'`,
    }
  }

  const db = getSupabaseAdminClient()

  const { data: updated, error: updateError } = await db
    .from('dap_offer_terms_reviews')
    .update({
      status: newStatus,
      ...(input.criteria ? { criteria_json: input.criteria } : {}),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (updateError || !updated) {
    return {
      ok: false,
      code: 'review_update_failed',
      message: updateError?.message ?? 'Review status update failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_offer_terms_review_events')
    .insert({
      review_id:     reviewId,
      event_type:    eventType,
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        previous_status: previousStatus,
        new_status:      newStatus,
        draft_id:        draftId,
        ...(input.actorId  ? { actor_id: input.actorId }   : {}),
        ...(input.note     ? { note: input.note }           : {}),
        ...(input.criteria ? { criteria: input.criteria }   : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, review: updated as DapOfferTermsReview }
}

// ─── startOfferTermsReview ────────────────────────────────────────────────────

export async function startOfferTermsReview(
  input: CreateDapOfferTermsReviewInput,
): Promise<DapOfferTermsReviewResult> {
  const draftCheck = await fetchDraftForReview(input.draftId)
  if (!draftCheck.ok) return draftCheck

  const db = getSupabaseAdminClient()

  // Block duplicate active review for same draft
  const { data: existing } = await db
    .from('dap_offer_terms_reviews')
    .select('id')
    .eq('draft_id', input.draftId)
    .maybeSingle()

  if (existing) {
    return {
      ok: false,
      code: 'review_already_exists',
      message: `A review already exists for draft ${input.draftId}`,
    }
  }

  const { data: review, error: insertError } = await db
    .from('dap_offer_terms_reviews')
    .insert({
      draft_id:     input.draftId,
      vertical_key: 'dap',
      status:       'review_started',
      actor_id:     input.actorId ?? null,
    })
    .select()
    .single()

  if (insertError || !review) {
    return {
      ok: false,
      code: 'review_update_failed',
      message: insertError?.message ?? 'Review creation failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_offer_terms_review_events')
    .insert({
      review_id:     review.id,
      event_type:    'offer_terms_review.review_started',
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        draft_id: input.draftId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, review: review as DapOfferTermsReview }
}

// ─── passOfferTermsReview ─────────────────────────────────────────────────────

export async function passOfferTermsReview(
  input: DapOfferTermsReviewActionInput,
): Promise<DapOfferTermsReviewResult> {
  const draftCheck = await fetchDraftForReview(input.draftId)
  if (!draftCheck.ok) return draftCheck

  if (!input.criteria) {
    return {
      ok: false,
      code: 'criteria_not_satisfied',
      message: 'Review criteria must be provided to pass a review',
    }
  }

  if (!evaluateOfferTermsReviewCriteria(input.criteria)) {
    return {
      ok: false,
      code: 'criteria_not_satisfied',
      message: 'All required review criteria must be satisfied before the review can be passed',
    }
  }

  return executeReviewTransition(
    input.reviewId,
    input.draftId,
    'review_passed',
    'offer_terms_review.review_passed',
    input,
  )
}

// ─── failOfferTermsReview ─────────────────────────────────────────────────────

export async function failOfferTermsReview(
  input: DapOfferTermsReviewActionInput,
): Promise<DapOfferTermsReviewResult> {
  const draftCheck = await fetchDraftForReview(input.draftId)
  if (!draftCheck.ok) return draftCheck

  const result = await executeReviewTransition(
    input.reviewId,
    input.draftId,
    'review_failed',
    'offer_terms_review.review_failed',
    input,
  )

  if (result.ok) {
    // Move draft back to needs_clarification after review failure
    const db = getSupabaseAdminClient()
    await db
      .from('dap_offer_terms_drafts')
      .update({ status: 'needs_clarification' })
      .eq('id', input.draftId)
      .eq('vertical_key', 'dap')
  }

  return result
}

// ─── requestOfferTermsClarification ──────────────────────────────────────────

export async function requestOfferTermsClarification(
  input: DapOfferTermsReviewActionInput,
): Promise<DapOfferTermsReviewResult> {
  const draftCheck = await fetchDraftForReview(input.draftId)
  if (!draftCheck.ok) return draftCheck

  const result = await executeReviewTransition(
    input.reviewId,
    input.draftId,
    'clarification_requested',
    'offer_terms_review.clarification_requested',
    input,
  )

  if (result.ok) {
    // Move draft back to needs_clarification so the operator can collect more detail
    const db = getSupabaseAdminClient()
    await db
      .from('dap_offer_terms_drafts')
      .update({ status: 'needs_clarification' })
      .eq('id', input.draftId)
      .eq('vertical_key', 'dap')
  }

  return result
}

// ─── addOfferTermsReviewNote ──────────────────────────────────────────────────

export async function addOfferTermsReviewNote(
  input: DapOfferTermsReviewActionInput,
): Promise<DapOfferTermsReviewResult> {
  const reviewFetch = await fetchReview(input.reviewId)
  if (!reviewFetch.ok) return reviewFetch

  const db = getSupabaseAdminClient()

  const { error: eventError } = await db
    .from('dap_offer_terms_review_events')
    .insert({
      review_id:     input.reviewId,
      event_type:    'offer_terms_review.note_added',
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        draft_id: input.draftId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, review: reviewFetch.review }
}

// ─── getOfferTermsReviewByDraftId ─────────────────────────────────────────────

export async function getOfferTermsReviewByDraftId(
  draftId: string,
): Promise<DapOfferTermsReview | null> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_offer_terms_reviews')
    .select('*')
    .eq('draft_id', draftId)
    .eq('vertical_key', 'dap')
    .maybeSingle()
  if (error) throw new Error(`getOfferTermsReviewByDraftId failed: ${error.message}`)
  return data as DapOfferTermsReview | null
}

// ─── getOfferTermsReviewEvents ────────────────────────────────────────────────

export async function getOfferTermsReviewEvents(
  reviewId: string,
): Promise<DapOfferTermsReviewEvent[]> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_offer_terms_review_events')
    .select('*')
    .eq('review_id', reviewId)
    .order('event_timestamp', { ascending: true })
  if (error) throw new Error(`getOfferTermsReviewEvents failed: ${error.message}`)
  return (data ?? []) as DapOfferTermsReviewEvent[]
}
