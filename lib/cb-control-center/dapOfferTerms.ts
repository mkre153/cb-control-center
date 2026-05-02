import type {
  DapOfferTermsDraft,
  DapOfferTermsDraftFields,
  DapOfferTermsDraftStatus,
  DapOfferTermsEvent,
  DapOfferTermsEventType,
  DapOfferTermsResult,
  CreateDapOfferTermsDraftInput,
  UpdateDapOfferTermsDraftInput,
  DapOfferTermsActionInput,
} from '../dap/registry/dapOfferTermsTypes'
import {
  isOnboardingEligibleForOfferTermsCollection,
  assertValidDapOfferTermsTransition,
} from './dapOfferTermsRules'
import { getSupabaseAdminClient } from './supabaseClient'

// collected offer terms ≠ validated offer terms
// submitted_for_review ≠ approved pricing
// draft existence ≠ confirmed DAP provider

function fieldsToDbRecord(
  fields: DapOfferTermsDraftFields,
): Record<string, unknown> {
  return {
    ...(fields.planName             !== undefined ? { plan_name: fields.planName } : {}),
    ...(fields.annualMembershipFee  !== undefined ? { annual_membership_fee: fields.annualMembershipFee } : {}),
    ...(fields.includedCleaningsPerYear !== undefined ? { included_cleanings_per_year: fields.includedCleaningsPerYear } : {}),
    ...(fields.includedExamsPerYear !== undefined ? { included_exams_per_year: fields.includedExamsPerYear } : {}),
    ...(fields.includedXraysPerYear !== undefined ? { included_xrays_per_year: fields.includedXraysPerYear } : {}),
    ...(fields.preventiveCareSummary !== undefined ? { preventive_care_summary: fields.preventiveCareSummary } : {}),
    ...(fields.discountPercentage   !== undefined ? { discount_percentage: fields.discountPercentage } : {}),
    ...(fields.excludedServices     !== undefined ? { excluded_services: fields.excludedServices } : {}),
    ...(fields.waitingPeriod        !== undefined ? { waiting_period: fields.waitingPeriod } : {}),
    ...(fields.cancellationTerms    !== undefined ? { cancellation_terms: fields.cancellationTerms } : {}),
    ...(fields.renewalTerms         !== undefined ? { renewal_terms: fields.renewalTerms } : {}),
    ...(fields.notes                !== undefined ? { notes: fields.notes } : {}),
  }
}

// ─── createOfferTermsDraftFromOnboarding ──────────────────────────────────────

export async function createOfferTermsDraftFromOnboarding(
  input: CreateDapOfferTermsDraftInput,
): Promise<DapOfferTermsResult> {
  const db = getSupabaseAdminClient()

  // Step 1: Verify onboarding intake exists and is scoped to DAP
  const { data: intake, error: intakeError } = await db
    .from('dap_practice_onboarding_intakes')
    .select('id, status, vertical_key, practice_name, practice_slug, city, zip')
    .eq('id', input.onboardingIntakeId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (intakeError || !intake) {
    return {
      ok: false,
      code: 'onboarding_not_found',
      message: 'Onboarding intake not found or not in DAP vertical',
    }
  }

  // Step 2: Require eligible onboarding status
  if (!isOnboardingEligibleForOfferTermsCollection(intake.status)) {
    return {
      ok: false,
      code: 'onboarding_status_not_eligible',
      message: `Onboarding status '${intake.status}' is not eligible for offer terms collection`,
    }
  }

  // Step 3: Block duplicate draft for the same intake
  const { data: existing } = await db
    .from('dap_offer_terms_drafts')
    .select('id')
    .eq('onboarding_intake_id', input.onboardingIntakeId)
    .maybeSingle()

  if (existing) {
    return {
      ok: false,
      code: 'draft_already_exists',
      message: `An offer terms draft already exists for intake ${input.onboardingIntakeId}`,
    }
  }

  // Step 4: Insert draft (snapshot practice info from intake at creation time)
  const fieldRecord = input.fields ? fieldsToDbRecord(input.fields) : {}
  const { data: draft, error: draftError } = await db
    .from('dap_offer_terms_drafts')
    .insert({
      onboarding_intake_id: input.onboardingIntakeId,
      vertical_key:         'dap',
      client_key:           'dental_advantage_plan',
      status:               'draft_created',
      practice_name:        intake.practice_name ?? null,
      practice_slug:        intake.practice_slug ?? null,
      city:                 intake.city ?? null,
      zip:                  intake.zip ?? null,
      actor_id:             input.actorId ?? null,
      ...fieldRecord,
    })
    .select()
    .single()

  if (draftError || !draft) {
    return {
      ok: false,
      code: 'draft_update_failed',
      message: draftError?.message ?? 'Draft creation failed',
    }
  }

  // Step 5: Insert creation event
  const { error: eventError } = await db
    .from('dap_offer_terms_events')
    .insert({
      draft_id:      draft.id,
      event_type:    'offer_terms.draft_created',
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        onboarding_intake_id: input.onboardingIntakeId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, draft: draft as DapOfferTermsDraft }
}

// ─── getOfferTermsDraftByOnboardingId ─────────────────────────────────────────

export async function getOfferTermsDraftByOnboardingId(
  onboardingIntakeId: string,
): Promise<DapOfferTermsDraft | null> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_offer_terms_drafts')
    .select('*')
    .eq('onboarding_intake_id', onboardingIntakeId)
    .eq('vertical_key', 'dap')
    .maybeSingle()
  if (error) throw new Error(`getOfferTermsDraftByOnboardingId failed: ${error.message}`)
  return data as DapOfferTermsDraft | null
}

// ─── getOfferTermsDraftById ───────────────────────────────────────────────────

export async function getOfferTermsDraftById(
  draftId: string,
): Promise<DapOfferTermsDraft | null> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_offer_terms_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('vertical_key', 'dap')
    .maybeSingle()
  if (error) throw new Error(`getOfferTermsDraftById failed: ${error.message}`)
  return data as DapOfferTermsDraft | null
}

// ─── listOfferTermsDrafts ─────────────────────────────────────────────────────

export async function listOfferTermsDrafts(): Promise<DapOfferTermsDraft[]> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_offer_terms_drafts')
    .select('*')
    .eq('vertical_key', 'dap')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`listOfferTermsDrafts failed: ${error.message}`)
  return (data ?? []) as DapOfferTermsDraft[]
}

// ─── getOfferTermsEvents ──────────────────────────────────────────────────────

export async function getOfferTermsEvents(
  draftId: string,
): Promise<DapOfferTermsEvent[]> {
  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('dap_offer_terms_events')
    .select('*')
    .eq('draft_id', draftId)
    .order('event_timestamp', { ascending: true })
  if (error) throw new Error(`getOfferTermsEvents failed: ${error.message}`)
  return (data ?? []) as DapOfferTermsEvent[]
}

// ─── updateOfferTermsDraft ────────────────────────────────────────────────────

export async function updateOfferTermsDraft(
  input: UpdateDapOfferTermsDraftInput,
): Promise<DapOfferTermsResult> {
  const db = getSupabaseAdminClient()

  const { data: existing } = await db
    .from('dap_offer_terms_drafts')
    .select('id')
    .eq('id', input.draftId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (!existing) {
    return { ok: false, code: 'draft_not_found', message: `Draft ${input.draftId} not found` }
  }

  const { data: updated, error: updateError } = await db
    .from('dap_offer_terms_drafts')
    .update(fieldsToDbRecord(input.fields))
    .eq('id', input.draftId)
    .eq('vertical_key', 'dap')
    .select()
    .single()

  if (updateError || !updated) {
    return {
      ok: false,
      code: 'draft_update_failed',
      message: updateError?.message ?? 'Update failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_offer_terms_events')
    .insert({
      draft_id:      input.draftId,
      event_type:    'offer_terms.draft_updated',
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, draft: updated as DapOfferTermsDraft }
}

// ─── executeDraftStatusAction (internal) ──────────────────────────────────────

async function executeDraftStatusAction(
  draftId: string,
  newStatus: DapOfferTermsDraftStatus,
  eventType: DapOfferTermsEventType,
  input: DapOfferTermsActionInput,
): Promise<DapOfferTermsResult> {
  const db = getSupabaseAdminClient()

  const { data: draft } = await db
    .from('dap_offer_terms_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (!draft) {
    return { ok: false, code: 'draft_not_found', message: `Draft ${draftId} not found` }
  }

  const previousStatus = draft.status as DapOfferTermsDraftStatus

  try {
    assertValidDapOfferTermsTransition(previousStatus, newStatus)
  } catch {
    return {
      ok: false,
      code: 'invalid_transition',
      message: `Cannot transition '${previousStatus}' → '${newStatus}'`,
    }
  }

  const { data: updated, error: updateError } = await db
    .from('dap_offer_terms_drafts')
    .update({ status: newStatus })
    .eq('id', draftId)
    .eq('vertical_key', 'dap')
    .select()
    .single()

  if (updateError || !updated) {
    return {
      ok: false,
      code: 'draft_update_failed',
      message: updateError?.message ?? 'Status update failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_offer_terms_events')
    .insert({
      draft_id:      draftId,
      event_type:    eventType,
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        previous_status: previousStatus,
        new_status:      newStatus,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, draft: updated as DapOfferTermsDraft }
}

// ─── submitOfferTermsDraftForReview ───────────────────────────────────────────

export async function submitOfferTermsDraftForReview(
  input: DapOfferTermsActionInput,
): Promise<DapOfferTermsResult> {
  return executeDraftStatusAction(
    input.draftId,
    'submitted_for_review',
    'offer_terms.submitted_for_review',
    input,
  )
}

// ─── markOfferTermsDraftNeedsClarification ────────────────────────────────────

export async function markOfferTermsDraftNeedsClarification(
  input: DapOfferTermsActionInput,
): Promise<DapOfferTermsResult> {
  return executeDraftStatusAction(
    input.draftId,
    'needs_clarification',
    'offer_terms.needs_clarification',
    input,
  )
}

// ─── markOfferTermsDraftCollecting ────────────────────────────────────────────

export async function markOfferTermsDraftCollecting(
  input: DapOfferTermsActionInput,
): Promise<DapOfferTermsResult> {
  return executeDraftStatusAction(
    input.draftId,
    'collecting_terms',
    'offer_terms.draft_updated',
    input,
  )
}

// ─── addOfferTermsNote ────────────────────────────────────────────────────────

export async function addOfferTermsNote(
  input: DapOfferTermsActionInput,
): Promise<DapOfferTermsResult> {
  const db = getSupabaseAdminClient()

  const { data: draft } = await db
    .from('dap_offer_terms_drafts')
    .select('*')
    .eq('id', input.draftId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (!draft) {
    return { ok: false, code: 'draft_not_found', message: `Draft ${input.draftId} not found` }
  }

  const { error: eventError } = await db
    .from('dap_offer_terms_events')
    .insert({
      draft_id:      input.draftId,
      event_type:    'offer_terms.note_added',
      actor_type:    'admin',
      event_note:    input.note ?? null,
      metadata_json: {
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, draft: draft as DapOfferTermsDraft }
}
