import type {
  DapPracticeOnboardingIntake,
  DapPracticeOnboardingEvent,
  CreateDapPracticeOnboardingInput,
  DapPracticeOnboardingResult,
} from '../dap/registry/dapPracticeOnboardingTypes'
import { getSupabaseAdminClient } from './supabaseClient'

// ─── createOnboardingIntakeFromApprovedRequest ────────────────────────────────
// Converts an approved DAP request into an internal practice onboarding intake.
//
// Rules enforced:
//   - request must exist with vertical_key = 'dap'
//   - request status must be 'approved'
//   - only one intake per request (duplicate blocked by unique constraint + pre-check)
//   - event inserted after successful intake creation (append-only)
//
// approved ≠ confirmed provider. This intake does not publish a dentist page,
// validate offer terms, unlock Join CTA, or create any patient-facing claim.

export async function createOnboardingIntakeFromApprovedRequest(
  input: CreateDapPracticeOnboardingInput,
): Promise<DapPracticeOnboardingResult> {
  const db = getSupabaseAdminClient()

  // Step 1: Verify request exists and is scoped to DAP
  const { data: request, error: reqError } = await db
    .from('dap_requests')
    .select('id, request_status, vertical_key, preferred_practice_name, preferred_practice_slug, city, zip')
    .eq('id', input.requestId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (reqError || !request) {
    return { ok: false, code: 'request_not_found', message: 'Request not found or not in DAP vertical' }
  }

  // Step 2: Require approved status
  if (request.request_status !== 'approved') {
    return {
      ok: false,
      code: 'request_not_approved',
      message: `Request status is '${request.request_status}' — only approved requests can create an onboarding intake`,
    }
  }

  // Step 3: Block duplicate intake for the same request
  const { data: existing } = await db
    .from('dap_practice_onboarding_intakes')
    .select('id')
    .eq('request_id', input.requestId)
    .maybeSingle()

  if (existing) {
    return {
      ok: false,
      code: 'intake_already_exists',
      message: `An onboarding intake already exists for request ${input.requestId}`,
    }
  }

  // Step 4: Insert intake (copies practice info from request at creation time)
  const { data: intake, error: intakeError } = await db
    .from('dap_practice_onboarding_intakes')
    .insert({
      request_id:    input.requestId,
      vertical_key:  'dap',
      client_key:    'dental_advantage_plan',
      status:        'intake_created',
      practice_name: request.preferred_practice_name ?? null,
      practice_slug: request.preferred_practice_slug ?? null,
      city:          request.city ?? null,
      zip:           request.zip ?? null,
      actor_id:      input.actorId ?? null,
      note:          input.note ?? null,
    })
    .select()
    .single()

  if (intakeError || !intake) {
    return { ok: false, code: 'intake_create_failed', message: intakeError?.message ?? 'Intake insert failed' }
  }

  // Step 5: Append creation event
  const { error: eventError } = await db
    .from('dap_practice_onboarding_events')
    .insert({
      intake_id:   intake.id,
      event_type:  'onboarding.intake_created',
      actor_type:  'admin',
      event_note:  input.note ?? null,
      metadata_json: {
        source_request_id: input.requestId,
        ...(input.actorId ? { actor_id: input.actorId } : {}),
        ...(input.note    ? { note: input.note }         : {}),
      },
    })

  if (eventError) {
    return { ok: false, code: 'event_insert_failed', message: eventError.message }
  }

  return { ok: true, intake: intake as DapPracticeOnboardingIntake }
}

// ─── getOnboardingIntakeById ──────────────────────────────────────────────────
// Returns a single onboarding intake by its own id, or null. Read-only.

export async function getOnboardingIntakeById(
  intakeId: string,
): Promise<DapPracticeOnboardingIntake | null> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_practice_onboarding_intakes')
    .select('*')
    .eq('id', intakeId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (error) throw new Error(`getOnboardingIntakeById failed: ${error.message}`)
  return data as DapPracticeOnboardingIntake | null
}

// ─── getOnboardingIntakeByRequestId ───────────────────────────────────────────
// Returns the onboarding intake for a given request id, or null if none exists.
// Read-only.

export async function getOnboardingIntakeByRequestId(
  requestId: string,
): Promise<DapPracticeOnboardingIntake | null> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_practice_onboarding_intakes')
    .select('*')
    .eq('request_id', requestId)
    .eq('vertical_key', 'dap')
    .maybeSingle()

  if (error) throw new Error(`getOnboardingIntakeByRequestId failed: ${error.message}`)
  return data as DapPracticeOnboardingIntake | null
}

// ─── listOnboardingIntakes ────────────────────────────────────────────────────
// Returns all DAP onboarding intakes, newest first. Read-only.

export async function listOnboardingIntakes(): Promise<DapPracticeOnboardingIntake[]> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_practice_onboarding_intakes')
    .select('*')
    .eq('vertical_key', 'dap')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listOnboardingIntakes failed: ${error.message}`)
  return (data ?? []) as DapPracticeOnboardingIntake[]
}

// ─── getOnboardingIntakeEvents ────────────────────────────────────────────────
// Returns all events for a given intake, chronological order. Read-only.

export async function getOnboardingIntakeEvents(
  intakeId: string,
): Promise<DapPracticeOnboardingEvent[]> {
  const db = getSupabaseAdminClient()

  const { data, error } = await db
    .from('dap_practice_onboarding_events')
    .select('*')
    .eq('intake_id', intakeId)
    .order('event_timestamp', { ascending: true })

  if (error) throw new Error(`getOnboardingIntakeEvents failed: ${error.message}`)
  return (data ?? []) as DapPracticeOnboardingEvent[]
}
