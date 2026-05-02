import type {
  DapPracticeOnboardingActionInput,
  DapPracticeOnboardingActionResult,
  DapPracticeOnboardingIntake,
  DapPracticeOnboardingEventType,
  DapPracticeOnboardingStatus,
} from '../dap/registry/dapPracticeOnboardingTypes'
import { assertValidDapPracticeOnboardingTransition } from '../dap/registry/dapPracticeOnboardingRules'
import { getSupabaseAdminClient } from './supabaseClient'

// outreach status ≠ provider confirmation. interested ≠ confirmed DAP provider.
// terms review and public provider eligibility belong in a later phase.

async function fetchOnboardingIntake(
  intakeId: string,
): Promise<DapPracticeOnboardingIntake | null> {
  const db = getSupabaseAdminClient()
  const { data } = await db
    .from('dap_practice_onboarding_intakes')
    .select('*')
    .eq('id', intakeId)
    .eq('vertical_key', 'dap')
    .maybeSingle()
  return data as DapPracticeOnboardingIntake | null
}

async function executeOnboardingAction(
  intake: DapPracticeOnboardingIntake,
  newStatus: DapPracticeOnboardingStatus,
  eventType: DapPracticeOnboardingEventType,
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  try {
    assertValidDapPracticeOnboardingTransition(intake.status, newStatus)
  } catch {
    return {
      ok: false,
      code: 'invalid_transition',
      message: `Cannot transition '${intake.status}' → '${newStatus}'`,
    }
  }

  const db = getSupabaseAdminClient()
  const previousStatus = intake.status

  const { data: updated, error: updateError } = await db
    .from('dap_practice_onboarding_intakes')
    .update({ status: newStatus })
    .eq('id', intake.id)
    .eq('vertical_key', 'dap')
    .select()
    .single()

  if (updateError || !updated) {
    return {
      ok: false,
      code: 'status_update_failed',
      message: updateError?.message ?? 'Status update failed',
    }
  }

  const { error: eventError } = await db
    .from('dap_practice_onboarding_events')
    .insert({
      intake_id:    intake.id,
      event_type:   eventType,
      actor_type:   'admin',
      event_note:   input.note ?? null,
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

  return { ok: true, intake: updated as DapPracticeOnboardingIntake }
}

export async function markOutreachNeeded(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }
  return executeOnboardingAction(intake, 'outreach_needed', 'onboarding.outreach_needed', input)
}

export async function markOutreachStarted(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }
  return executeOnboardingAction(intake, 'outreach_started', 'onboarding.outreach_started', input)
}

export async function recordPracticeResponded(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }
  return executeOnboardingAction(intake, 'practice_responded', 'onboarding.practice_responded', input)
}

export async function markPracticeInterested(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }
  return executeOnboardingAction(intake, 'interested', 'onboarding.practice_interested', input)
}

export async function markPracticeNotInterested(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }
  return executeOnboardingAction(intake, 'not_interested', 'onboarding.practice_not_interested', input)
}

export async function markTermsNeeded(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }
  return executeOnboardingAction(intake, 'terms_needed', 'onboarding.terms_needed', input)
}

export async function addOnboardingNote(
  input: DapPracticeOnboardingActionInput,
): Promise<DapPracticeOnboardingActionResult> {
  const intake = await fetchOnboardingIntake(input.intakeId)
  if (!intake) return { ok: false, code: 'intake_not_found', message: `Intake ${input.intakeId} not found` }

  const db = getSupabaseAdminClient()
  const { error: eventError } = await db
    .from('dap_practice_onboarding_events')
    .insert({
      intake_id:    intake.id,
      event_type:   'onboarding.note_added',
      actor_type:   'admin',
      event_note:   input.note ?? null,
      metadata_json: {
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, intake }
}
