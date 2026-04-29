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
} from './mockData'

export type SimulationStateId =
  | 'current_blocked'
  | 'pricing_resolved'
  | 'business_truth_locked'
  | 'storybrand_complete'
  | 'ai_strategy_complete'
  | 'core_30_ready'

export interface SimulationSnapshot {
  id: SimulationStateId
  label: string
  stages: PipelineStage[]
  command: CurrentCommand
  schema: TruthSection[]
  blockers: EnrichedBlocker[]
  readiness: number
}

// Utility: patch field status and value by field id
function patchSchema(
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

// Utility: mark enriched blockers as resolved by id
function resolveBlockers(base: EnrichedBlocker[], ...ids: string[]): EnrichedBlocker[] {
  return base.map(b =>
    ids.includes(b.id) ? { ...b, resolutionStatus: 'resolved' as const } : b
  )
}

// Utility: compute readiness from schema
function schemaReadiness(schema: TruthSection[]): number {
  const total = schema.reduce((n, s) => n + s.fields.length, 0)
  const confirmed = schema.reduce(
    (n, s) => n + s.fields.filter(f => f.status === 'confirmed').length,
    0
  )
  return total > 0 ? Math.round((confirmed / total) * 100) : 0
}

// Utility: build stage array from base with per-stage overrides
function buildStages(overrides: Record<string, Partial<PipelineStage>>): PipelineStage[] {
  return MOCK_PIPELINE_STAGES.map(s => ({ ...s, ...(overrides[s.id] ?? {}) }))
}

// ─── State 1: current_blocked ─────────────────────────────────────────────────
// Mirrors the v0.2 baseline. No changes from mock data.

const s1Schema = MOCK_BUSINESS_TRUTH_SCHEMA
const s1Blockers = MOCK_ENRICHED_BLOCKERS
const s1Stages = buildStages({}) // same as MOCK_PIPELINE_STAGES

// ─── State 2: pricing_resolved ───────────────────────────────────────────────
// Pricing & Savings Logic fields confirmed. BT JSON in progress, not yet locked.
// Blocked fields move to needs_confirmation. Decision Logic still incomplete.

const s2Schema = patchSchema(MOCK_BUSINESS_TRUTH_SCHEMA, {
  'ps-individual':      { status: 'confirmed', value: '$49/year individual' },
  'ps-family':          { status: 'confirmed', value: '$89/year family (up to 4 members)' },
  'ps-savings-example': { status: 'confirmed', value: 'Save ~$200 on a standard crown vs. paying full price' },
  'ps-discount-rate':   { status: 'confirmed', value: '20–40% off standard rates at participating practices' },
  'ps-billing-model':   { status: 'confirmed', value: 'Annual membership, paid upfront' },
  'tp-savings-proof':   { status: 'needs_confirmation' },
  'dl-comparison':      { status: 'needs_confirmation' },
})
const s2Blockers = resolveBlockers(s1Blockers, 'eb-001')
const s2Stages = buildStages({
  'business-truth-json': { status: 'in_progress', locked: false },
})

// ─── State 3: business_truth_locked ──────────────────────────────────────────
// All gate-critical fields confirmed. Optional/secondary fields remain NC.
// BT JSON complete. StoryBrand unlocked and active.

const s3Schema = patchSchema(s2Schema, {
  'co-activation':  { status: 'confirmed', value: 'Sign up at dentaladvantageplan.vercel.app — plan is active immediately at participating offices' },
  'pa-count':       { status: 'confirmed', value: '14 participating practices' },
  'pa-locations':   { status: 'confirmed', value: 'Central Texas — Austin, Round Rock, Cedar Park' },
  'pa-source':      { status: 'confirmed', value: 'Practice partner database maintained by DAP operations team' },
  'tp-savings-proof':{ status: 'confirmed', value: 'Avg patient saves $180 on a crown (confirmed across 3 partner practice examples)' },
  'dl-comparison':  { status: 'confirmed', value: 'Membership pays off after 1–2 visits; insurance premiums require 6–12 months to break even' },
  'dl-objection':   { status: 'confirmed', value: "Is this worth it if I only go to the dentist once a year?" },
  'dl-urgency':     { status: 'confirmed', value: 'Upcoming appointment scheduled without coverage' },
  'co-exclusions':  { status: 'needs_confirmation' },
  'tp-testimonials':{ status: 'needs_confirmation' },
})
const s3Blockers = resolveBlockers(s1Blockers, 'eb-001', 'eb-002', 'eb-003')
const s3Stages = buildStages({
  'business-truth-json': { status: 'complete', locked: false },
  'storybrand-diagnosis':{ status: 'in_progress', locked: false, blockers: [] },
})

// ─── State 4: storybrand_complete ────────────────────────────────────────────

const s4Schema = s3Schema
const s4Blockers = s3Blockers
const s4Stages = buildStages({
  'business-truth-json':  { status: 'complete', locked: false },
  'storybrand-diagnosis': {
    status: 'complete',
    locked: false,
    blockers: [],
    artifacts: ['storybrand_diagnosis.json', 'positioning_brief.md'],
    artifactCount: 2,
    lastUpdated: 'Today 10:04 AM',
  },
  'ai-search-strategy':   { status: 'in_progress', locked: false, blockers: [] },
})

// ─── State 5: ai_strategy_complete ───────────────────────────────────────────

const s5Schema = s3Schema
const s5Blockers = s3Blockers
const s5Stages = buildStages({
  'business-truth-json':  { status: 'complete', locked: false },
  'storybrand-diagnosis': {
    status: 'complete',
    locked: false,
    blockers: [],
    artifacts: ['storybrand_diagnosis.json', 'positioning_brief.md'],
    artifactCount: 2,
    lastUpdated: 'Today 10:04 AM',
  },
  'ai-search-strategy': {
    status: 'complete',
    locked: false,
    blockers: [],
    artifacts: ['query_map.json', 'entity_gap_analysis.json', 'ai_search_strategy.md'],
    artifactCount: 3,
    lastUpdated: 'Today 10:31 AM',
  },
  'core-30-pages': { status: 'in_progress', locked: false, blockers: [] },
})

// ─── State 6: core_30_ready ──────────────────────────────────────────────────

const s6Schema = s3Schema
const s6Blockers = s3Blockers
const s6Stages = buildStages({
  'business-truth-json':  { status: 'complete', locked: false },
  'storybrand-diagnosis': {
    status: 'complete',
    locked: false,
    blockers: [],
    artifacts: ['storybrand_diagnosis.json', 'positioning_brief.md'],
    artifactCount: 2,
    lastUpdated: 'Today 10:04 AM',
  },
  'ai-search-strategy': {
    status: 'complete',
    locked: false,
    blockers: [],
    artifacts: ['query_map.json', 'entity_gap_analysis.json', 'ai_search_strategy.md'],
    artifactCount: 3,
    lastUpdated: 'Today 10:31 AM',
  },
  'core-30-pages': {
    status: 'complete',
    locked: false,
    blockers: [],
    artifacts: ['core_30_briefs.json', 'page_inputs_batch_01.md'],
    artifactCount: 2,
    lastUpdated: 'Today 11:14 AM',
  },
  'qa-approval': { status: 'in_progress', locked: false, blockers: [] },
})

// ─── Simulation Snapshots ─────────────────────────────────────────────────────

export const SIMULATION_STATES: Record<SimulationStateId, SimulationSnapshot> = {
  current_blocked: {
    id: 'current_blocked',
    label: 'Current (Blocked)',
    stages: s1Stages,
    command: {
      stage: 'Business Truth JSON',
      status: 'blocked',
      primaryBlocker: 'Pricing & Savings Logic is not confirmed.',
      whyItMatters:
        'Business Truth JSON cannot be finalized until pricing, savings logic, and decision fields are confirmed. Downstream stages remain locked.',
      wrongNextMove: 'Do not generate Core 30 or AI-search pages from crawl copy alone.',
      correctNextAction:
        'Resolve the Pricing blocker. Confirm all Pricing & Savings Logic fields in the Business Truth JSON tab.',
      stageLocked: false,
    },
    schema: s1Schema,
    blockers: s1Blockers,
    readiness: schemaReadiness(s1Schema),
  },

  pricing_resolved: {
    id: 'pricing_resolved',
    label: 'Pricing Resolved',
    stages: s2Stages,
    command: {
      stage: 'Business Truth JSON',
      status: 'in_progress',
      primaryBlocker: 'Decision Logic needs final confirmation before Business Truth JSON can be locked.',
      whyItMatters:
        'Pricing is resolved but Business Truth JSON is not yet locked. Strategy and pages remain blocked until the record is finalized.',
      wrongNextMove: 'Do not advance to StoryBrand Diagnosis with an unfinalized Business Truth JSON.',
      correctNextAction:
        'Confirm Decision Logic fields (objection, urgency, comparison) and lock Business Truth JSON.',
      stageLocked: false,
    },
    schema: s2Schema,
    blockers: s2Blockers,
    readiness: schemaReadiness(s2Schema),
  },

  business_truth_locked: {
    id: 'business_truth_locked',
    label: 'Business Truth Locked',
    stages: s3Stages,
    command: {
      stage: 'StoryBrand Diagnosis',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'Business Truth JSON is locked. The StoryBrand Diagnosis can now build positioning from confirmed facts.',
      wrongNextMove: 'Do not skip StoryBrand Diagnosis — AI Search Strategy depends on its positioning output.',
      correctNextAction:
        'Build StoryBrand Diagnosis from locked Business Truth JSON. Define the hero, guide, plan, and call to action.',
      stageLocked: false,
    },
    schema: s3Schema,
    blockers: s3Blockers,
    readiness: schemaReadiness(s3Schema),
  },

  storybrand_complete: {
    id: 'storybrand_complete',
    label: 'StoryBrand Complete',
    stages: s4Stages,
    command: {
      stage: 'AI Search Strategy',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'StoryBrand Diagnosis is complete. AI Search Strategy can now build the query map and entity gap analysis.',
      wrongNextMove:
        'Do not generate Core 30 page briefs before the AI Search Strategy is complete — briefs depend on the query map.',
      correctNextAction:
        'Build query map, entity gap analysis, and AI-search strategy from StoryBrand positioning.',
      stageLocked: false,
    },
    schema: s4Schema,
    blockers: s4Blockers,
    readiness: 80,
  },

  ai_strategy_complete: {
    id: 'ai_strategy_complete',
    label: 'AI Strategy Complete',
    stages: s5Stages,
    command: {
      stage: 'Core 30 Pages',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'AI Search Strategy is complete. Core 30 page briefs can now be prepared from Business Truth and the query map.',
      wrongNextMove:
        'Do not send pages to QA before all Core 30 briefs are complete and reviewed.',
      correctNextAction:
        'Prepare Core 30 page briefs using Business Truth JSON and AI Search Strategy outputs.',
      stageLocked: false,
    },
    schema: s5Schema,
    blockers: s5Blockers,
    readiness: 88,
  },

  core_30_ready: {
    id: 'core_30_ready',
    label: 'Core 30 Ready for QA',
    stages: s6Stages,
    command: {
      stage: 'QA / Approval',
      status: 'in_progress',
      primaryBlocker: '',
      whyItMatters:
        'Core 30 pages are generated and ready for review. QA must approve all assets before publishing.',
      wrongNextMove: 'Do not publish before QA approval. Publishing unreviewed pages undermines the trust layer.',
      correctNextAction:
        'Review all generated page assets in the QA tab. Approve or flag each page before advancing to Publish.',
      stageLocked: false,
    },
    schema: s6Schema,
    blockers: s6Blockers,
    readiness: 96,
  },
}

export const SIMULATION_STATE_ORDER: SimulationStateId[] = [
  'current_blocked',
  'pricing_resolved',
  'business_truth_locked',
  'storybrand_complete',
  'ai_strategy_complete',
  'core_30_ready',
]
