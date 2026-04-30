import type {
  TruthSection,
  EnrichedBlocker,
  PipelineStage,
  CurrentCommand,
  FieldStatus,
} from './types'
import {
  MOCK_BUSINESS_TRUTH_SCHEMA,
  MOCK_ENRICHED_BLOCKERS,
  MOCK_PIPELINE_STAGES,
  BLOCKER_RESOLUTION_PATCHES,
} from './mockData'

export type SimulationStateId =
  | 'no_provider_no_data'           // baseline — 0 confirmed providers, no offer terms
  | 'confirmed_provider_available'  // Olaes confirmed, offer terms not yet validated
  | 'offer_terms_validated'         // Olaes confirmed + offer terms confirmed → "Join plan" unlocked
  | 'no_confirmed_provider_nearby'  // Path 2 — patient searched, no confirmed result
  | 'specific_dentist_requested'    // Path 3 — patient named a specific practice
  | 'recruitment_request_logged'    // request recorded, outreach queued
  | 'pending_provider_confirmation' // DAP contacted practice, awaiting response

export interface SimulationSnapshot {
  id: SimulationStateId
  label: string
  stages: PipelineStage[]
  command: CurrentCommand
  schema: TruthSection[]
  blockers: EnrichedBlocker[]
  readiness: number
}

// Patch field status and value by field id — exported for live resolution
export function patchSchema(
  base: TruthSection[],
  patches: Record<string, { status: FieldStatus; value?: string }>
): TruthSection[] {
  return base.map(section => ({
    ...section,
    fields: section.fields.map(field => {
      const patch = patches[field.id]
      if (!patch) return field
      return {
        ...field,
        status: patch.status,
        value: patch.value !== undefined ? patch.value : field.value,
      }
    }),
  }))
}

// Exported for live readiness recomputation in SimulationShell
export function schemaReadiness(schema: TruthSection[]): number {
  const total = schema.reduce((n, s) => n + s.fields.length, 0)
  const confirmed = schema.reduce(
    (n, s) => n + s.fields.filter(f => f.status === 'confirmed').length,
    0
  )
  return total > 0 ? Math.round((confirmed / total) * 100) : 0
}

function resolveBlockers(base: EnrichedBlocker[], ...ids: string[]): EnrichedBlocker[] {
  return base.map(b =>
    ids.includes(b.id) ? { ...b, resolutionStatus: 'resolved' as const } : b
  )
}

function buildStages(overrides: Record<string, Partial<PipelineStage>>): PipelineStage[] {
  return MOCK_PIPELINE_STAGES.map(s => ({ ...s, ...(overrides[s.id] ?? {}) }))
}

// Helper: apply a named resolution patch (confirm or defer) from BLOCKER_RESOLUTION_PATCHES
function applyPatches(
  base: TruthSection[],
  ...resolutions: Array<[blockerId: string, type: 'confirm' | 'defer']>
): TruthSection[] {
  return resolutions.reduce((schema, [id, type]) => {
    const patches = BLOCKER_RESOLUTION_PATCHES[id]?.[type]
    return patches ? patchSchema(schema, patches) : schema
  }, base)
}

// ─── State 1: no_provider_no_data ─────────────────────────────────────────────
// Baseline — zero confirmed providers, all blockers open, offer terms unconfirmed.
// Patient would see: Path 2 for any search. Education page is the only safe content.

const s1Schema  = MOCK_BUSINESS_TRUTH_SCHEMA
const s1Blockers = MOCK_ENRICHED_BLOCKERS
const s1Stages  = buildStages({})

// ─── State 2: confirmed_provider_available ────────────────────────────────────
// Olaes confirmed (eb-001). Offer terms not yet validated (eb-002 open, eb-004 open).
// Patient would see: Path 1 for ZIP 91942, Path 2 elsewhere.
// Template A page for Olaes is eligible but shows "View plan details" only —
// "Join plan" CTA blocked until offer_terms_status = complete.

const s2Schema = applyPatches(s1Schema,
  ['eb-001', 'confirm'],
)
const s2Blockers = resolveBlockers(s1Blockers, 'eb-001')
const s2Stages = buildStages({
  'truth-schema': { status: 'in_progress', blockers: ['Offer terms not confirmed', 'Request flow not finalized', '"Join plan" CTA gate not defined', 'Declined routing not documented'] },
})

// ─── State 3: offer_terms_validated ──────────────────────────────────────────
// Offer terms confirmed from current brochure (eb-002). CTA gate defined (eb-004).
// "Join plan" CTA is now unlocked on confirmed provider pages.
// eb-003 (request flow) and eb-005 (declined routing) remain open.

const s3Schema = applyPatches(s2Schema,
  ['eb-002', 'confirm'],
  ['eb-004', 'confirm'],
)
const s3Blockers = resolveBlockers(s2Blockers, 'eb-002', 'eb-004')
const s3Stages = buildStages({
  'truth-schema': { status: 'in_progress', blockers: ['Request flow not finalized', 'Declined routing not documented'] },
})

// ─── State 4: no_confirmed_provider_nearby ────────────────────────────────────
// Patient scenario: ZIP search returns no confirmed provider.
// Schema = baseline (s1) — demonstrating what the honest patient experience looks like
// when nothing is confirmed. Path 2 in action.

const s4Schema  = s1Schema
const s4Blockers = s1Blockers
const s4Stages  = buildStages({})

// ─── State 5: specific_dentist_requested ─────────────────────────────────────
// Patient scenario: patient named Pacific Dental Group. Request flow confirmed (eb-003).
// provider_status for the named practice becomes recruitment_requested.
// Schema builds on s3 (confirmed provider + offer terms) + eb-003 resolved.

const s5Schema = applyPatches(s3Schema,
  ['eb-003', 'confirm'],
)
const s5Blockers = resolveBlockers(s3Blockers, 'eb-003')
const s5Stages = buildStages({
  'truth-schema': { status: 'in_progress', blockers: ['Declined routing not documented'] },
})

// ─── State 6: recruitment_request_logged ─────────────────────────────────────
// Request has been recorded and outreach is queued.
// Schema same as s5 — no schema change from logging a request.
// Practice status is now recruitment_requested. Patient received confirmation.

const s6Schema  = s5Schema
const s6Blockers = s5Blockers
const s6Stages  = s5Stages

// ─── State 7: pending_provider_confirmation ───────────────────────────────────
// DAP has contacted Pacific Dental Group. provider_status = pending_confirmation.
// Patient still sees Path 2 — not Path 1.
// Schema same as s5/s6 — practice not yet confirmed.

const s7Schema  = s5Schema
const s7Blockers = s5Blockers
const s7Stages  = s5Stages

// ─── Simulation Snapshots ─────────────────────────────────────────────────────

export const SIMULATION_STATES: Record<SimulationStateId, SimulationSnapshot> = {
  no_provider_no_data: {
    id: 'no_provider_no_data',
    label: 'Baseline — No Provider Confirmed',
    stages: s1Stages,
    command: {
      stage: 'Truth Schema',
      status: 'blocked',
      primaryBlocker: '5 open blockers. No confirmed providers, no validated offer terms, no request flow, no CTA gate defined, no declined routing documented.',
      whyItMatters:
        'DAP has zero confirmed providers in the system. Any search by any patient returns Path 2. The only publishable content is the Education / Decision page. Publishing provider pages, savings copy, or "Join plan" CTAs in this state makes false claims.',
      wrongNextMove: 'Do not generate provider pages, savings copy, city/ZIP pages, or any content implying DAP availability. Do not show "dentists near you" or "DAP available" language.',
      correctNextAction:
        'Resolve the 5 open blockers in sequence: confirm provider participation (eb-001), validate offer terms (eb-002), define the "Join plan" CTA gate (eb-004), finalize the request flow (eb-003), and document declined routing (eb-005).',
      stageLocked: false,
    },
    schema: s1Schema,
    blockers: s1Blockers,
    readiness: schemaReadiness(s1Schema),
  },

  confirmed_provider_available: {
    id: 'confirmed_provider_available',
    label: 'Provider Confirmed (Offer Pending)',
    stages: s2Stages,
    command: {
      stage: 'Truth Schema',
      status: 'in_progress',
      primaryBlocker: 'Offer terms not yet validated (eb-002). "Join plan" CTA gate not defined (eb-004). "View plan details" CTA is the maximum allowed on confirmed provider pages.',
      whyItMatters:
        'Irene Olaes DDS is now confirmed. Template A page is eligible. Patients searching near ZIP 91942 see Path 1. However, "Join plan" CTA requires a second, independent gate: offer_terms_status = complete. Without that, only "View plan details" is allowed — even on a confirmed provider page.',
      wrongNextMove: 'Do not add a "Join plan" CTA to the Olaes page before offer terms are validated. Provider confirmation and offer term validation are separate gates.',
      correctNextAction:
        'Validate offer terms from the current practice-approved brochure (eb-002). Then document the two-gate CTA rule (eb-004) to unlock "Join plan".',
      stageLocked: false,
    },
    schema: s2Schema,
    blockers: s2Blockers,
    readiness: schemaReadiness(s2Schema),
  },

  offer_terms_validated: {
    id: 'offer_terms_validated',
    label: 'Offer Terms Validated — "Join Plan" Unlocked',
    stages: s3Stages,
    command: {
      stage: 'Truth Schema',
      status: 'in_progress',
      primaryBlocker: 'Request flow (eb-003) and declined routing (eb-005) still open. City / ZIP pages blocked.',
      whyItMatters:
        'Offer terms confirmed from current brochure. Two-gate CTA rule is now documented. "Join plan" CTA is now eligible on the Olaes confirmed provider page. City / ZIP pages and the full demand-capture flow are still blocked — request flow (eb-003) is not yet finalized.',
      wrongNextMove: 'Do not publish city/ZIP pages or activate the /request-dap flow. The request flow consent language and follow-up expectation are still unconfirmed.',
      correctNextAction:
        'Finalize the patient request flow (eb-003): confirm the /request-dap flow design, consent language, and follow-up expectation. Then document declined practice routing (eb-005).',
      stageLocked: false,
    },
    schema: s3Schema,
    blockers: s3Blockers,
    readiness: schemaReadiness(s3Schema),
  },

  no_confirmed_provider_nearby: {
    id: 'no_confirmed_provider_nearby',
    label: 'Patient Scenario — Path 2 (No Confirmed Nearby)',
    stages: s4Stages,
    command: {
      stage: 'Patient Search',
      status: 'blocked',
      primaryBlocker: 'ZIP 92101 search returned 0 confirmed DAP providers.',
      whyItMatters:
        'This is Path 2 in action. The patient searched a ZIP with no confirmed providers. The honest response is: "We do not yet have a confirmed DAP dentist in your area." Showing unconfirmed practices as if they offer DAP — or showing practices with pending/recruitment_requested status as results — would make a false claim. Demand capture is the only correct next step.',
      wrongNextMove: 'Do not show unconfirmed practices as search results. Do not show practices with recruitment_requested or pending_confirmation status as available DAP providers. Never show a declined practice or its declined status to the patient.',
      correctNextAction:
        'Show the honest no-result message. Offer demand capture: patient names their preferred dentist or area. Store the demand signal for recruitment prioritization.',
      stageLocked: false,
    },
    schema: s4Schema,
    blockers: s4Blockers,
    readiness: schemaReadiness(s4Schema),
  },

  specific_dentist_requested: {
    id: 'specific_dentist_requested',
    label: 'Patient Scenario — Path 3 (Specific Dentist Named)',
    stages: s5Stages,
    command: {
      stage: 'Patient Request',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'Patient named "Pacific Dental Group, San Diego CA 92101." This triggers Path 3 — the practice-specific request flow. provider_status for Pacific Dental Group will be set to recruitment_requested. The request flow is confirmed (eb-003 resolved), so consent language and follow-up expectations are defined. The patient has not been promised anything — only that DAP will contact the practice on their behalf.',
      wrongNextMove: 'Do not tell the patient that Pacific Dental Group will join, is interested, or is "coming soon." Do not send the patient pricing or plan details for this practice.',
      correctNextAction:
        'Accept the request. Set provider_status = recruitment_requested for Pacific Dental Group. Send patient confirmation with honest expectation: "We will contact this practice and notify you if they join."',
      stageLocked: false,
    },
    schema: s5Schema,
    blockers: s5Blockers,
    readiness: schemaReadiness(s5Schema),
  },

  recruitment_request_logged: {
    id: 'recruitment_request_logged',
    label: 'Request Logged — Outreach Queued',
    stages: s6Stages,
    command: {
      stage: 'Provider Recruitment',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'The request for Pacific Dental Group is now logged. provider_status = recruitment_requested. The practice\'s Template B page is active — demand-capture and request flow only, no plan availability claims. Patient received confirmation. DAP outreach is queued. From the patient\'s perspective, their area still shows Path 2 — Pacific Dental Group is not a confirmed provider.',
      wrongNextMove: 'Do not show Pacific Dental Group as a confirmed provider. Do not add "DAP coming soon" or "enrollment pending" language to their page. Template B remains the correct template.',
      correctNextAction:
        'Contact Pacific Dental Group within 48 hours. Explain the DAP program and enrollment process. Record outcome — either advance to pending_confirmation or document a decline.',
      stageLocked: false,
    },
    schema: s6Schema,
    blockers: s6Blockers,
    readiness: schemaReadiness(s6Schema),
  },

  pending_provider_confirmation: {
    id: 'pending_provider_confirmation',
    label: 'Practice Contacted — Awaiting Response',
    stages: s7Stages,
    command: {
      stage: 'Provider Recruitment',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'DAP has made contact with Pacific Dental Group. provider_status = pending_confirmation. This is an internal status change only — the patient still sees Path 2. pending_confirmation does not change what the patient experiences. The practice page still uses Template B. No patient-facing indication that confirmation is imminent.',
      wrongNextMove: 'Do not change Pacific Dental Group\'s patient-facing page to reflect the pending status. Do not tell patients "this dentist may be joining soon." Do not advance the practice to Template A or Path 1 until confirmation is documented.',
      correctNextAction:
        'Follow up with Pacific Dental Group in 5 business days. If confirmed: document signed agreement, set provider_status = confirmed_dap_provider, update to Template A. If declined: set provider_status = declined (internal only), patient continues to see Path 2.',
      stageLocked: false,
    },
    schema: s7Schema,
    blockers: s7Blockers,
    readiness: schemaReadiness(s7Schema),
  },
}

export const SIMULATION_STATE_ORDER: SimulationStateId[] = [
  'no_provider_no_data',
  'confirmed_provider_available',
  'offer_terms_validated',
  'no_confirmed_provider_nearby',
  'specific_dentist_requested',
  'recruitment_request_logged',
  'pending_provider_confirmation',
]
