/**
 * Part 18 — Decompose Legacy DAP Reviewer Without Moving It Blindly.
 *
 * Part 18 is an inspection + minimal-extraction part:
 *   - the only code change is moving `legacyReviewToEngineRaw` and
 *     `LegacyToEngineMappingOptions` out of
 *     `cbccAnthropicAiReviewProvider.ts` into a new sibling file
 *     `dapStageAiReviewLegacy.ts`,
 *   - everything else is verified to still hold.
 *
 * This suite is the formal record of that responsibility map and the
 * boundaries Part 18 promises not to weaken.
 *
 * Sections:
 *   A. Responsibility map — the inspection result asserted against source.
 *   B. New legacy mapper module is pure (no SDK / no IO / no Next/React).
 *   C. Provider file is now thinner: imports the mapper, no longer defines
 *      it locally.
 *   D. Round-trip preservation — legacy → raw → normalize still works.
 *   E. Engine purity preserved (no DAP review symbol leakage, no provider
 *      reference, no SDK).
 *   F. Adapter purity preserved (no reference to provider/mapper, no SDK).
 *   G. Advisory-only invariant — route + provider + mapper own no
 *      approval/unlock/persist surface.
 *   H. UI shape preserved — `StageAiReview` types still importable from
 *      the legacy reviewer module so `StageAiReviewPanel` is unaffected.
 *
 * No DOM. No network. No DB.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

import { legacyReviewToEngineRaw } from './dapStageAiReviewLegacy'
import {
  createDapAnthropicAiReviewProvider,
  type DapAnthropicAiReviewProvider,
} from './cbccAnthropicAiReviewProvider'
import type { StageAiReview } from './dapStageReviewer'
import type { DapStageGate } from './dapStageGates'
import { runCbccAiReview } from '@/lib/cbcc/aiReviewProvider'
import { buildCbccAiReviewPromptPacket, normalizeCbccAiReviewResult } from '@/lib/cbcc/aiReview'
import { DAP_PROJECT_ID, DAP_STAGE_DEFINITIONS } from '@/lib/cbcc/adapters/dap'

const ROOT = resolve(__dirname, '..', '..')

const LEGACY_MAPPER_PATH    = resolve(ROOT, 'lib/cb-control-center/dapStageAiReviewLegacy.ts')
const PROVIDER_PATH         = resolve(ROOT, 'lib/cb-control-center/cbccAnthropicAiReviewProvider.ts')
const REVIEWER_PATH         = resolve(ROOT, 'lib/cb-control-center/dapStageReviewer.ts')
// Part 19: rubric file moved into the adapter zone.
const RUBRICS_PATH          = resolve(ROOT, 'lib/cbcc/adapters/dap/dapStageRubrics.ts')
const ROUTE_PATH            = resolve(ROOT, 'app/api/businesses/dental-advantage-plan/stages/review/route.ts')
const REVIEW_PANEL_PATH     = resolve(ROOT, 'components/cb-control-center/StageAiReviewPanel.tsx')
const ENGINE_AI_PATH        = resolve(ROOT, 'lib/cbcc/aiReview.ts')
const ENGINE_PORT_PATH      = resolve(ROOT, 'lib/cbcc/aiReviewProvider.ts')
const ENGINE_INDEX_PATH     = resolve(ROOT, 'lib/cbcc/index.ts')
const ADAPTER_DIR           = resolve(ROOT, 'lib/cbcc/adapters/dap')

function fakeStageGate(stageNumber: number): DapStageGate {
  return {
    stageId: `fake-${stageNumber}`,
    stageNumber,
    slug: `${stageNumber}-fake`,
    title: `Fake Stage ${stageNumber}`,
    description: 'fake',
    whyItMatters: 'fake',
    filesExpected: [],
    status: 'awaiting_owner_approval',
    directiveIssued: true,
    directive: 'fake directive',
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [],
    implementationEvidence: {},
    requiredApprovals: [],
    blockers: [],
  }
}

function fakeLegacy(overrides: Partial<StageAiReview> = {}): StageAiReview {
  return {
    recommendation: 'approve',
    confidence: 'high',
    reasoning: 'all clear',
    checklistResults: [],
    ...overrides,
  } as StageAiReview
}

// ─── A. Responsibility map ─────────────────────────────────────────────────

describe('Part 18 — A. Responsibility map (inspection asserted against source)', () => {
  it('legacy reviewer continues to own the SDK call site (cannot move yet)', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf-8')
    expect(src).toContain('getAnthropicClient')
    expect(src).toMatch(/messages\.create\s*\(/)
    // Part 19: rubric is imported from the adapter zone now, not the
    // legacy folder. The reviewer is one of the few cross-boundary
    // importers we explicitly allow (legacy → adapter is one-way safe).
    expect(src).toContain("from '@/lib/cbcc/adapters/dap/dapStageRubrics'")
  })

  it('legacy reviewer continues to own the legacy types StageAiReview / StageAiChecklistResult', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf-8')
    expect(src).toMatch(/export interface StageAiReview\b/)
    expect(src).toMatch(/export interface StageAiChecklistResult\b/)
  })

  it('legacy rubrics continues to own pure DAP rubric data + format helper', () => {
    const src = readFileSync(RUBRICS_PATH, 'utf-8')
    expect(src).toMatch(/export const DAP_STAGE_RUBRICS\b/)
    expect(src).toMatch(/export function getDapStageRubric\b/)
    expect(src).toMatch(/export function formatDapStageRubricForPrompt\b/)
    // pure data — no IO / SDK
    expect(src).not.toMatch(/@anthropic-ai\/sdk|getAnthropicClient/)
    expect(src).not.toMatch(/from ['"]fs['"]|from ['"]node:fs['"]/)
    expect(src).not.toMatch(/\bfetch\s*\(/)
  })

  it('Part 18 extraction: legacy mapper is its own module', () => {
    expect(existsSync(LEGACY_MAPPER_PATH)).toBe(true)
    const src = readFileSync(LEGACY_MAPPER_PATH, 'utf-8')
    expect(src).toMatch(/export function legacyReviewToEngineRaw\b/)
    expect(src).toMatch(/export interface LegacyToEngineMappingOptions\b/)
  })

  it('provider file is now Anthropic-boundary + harvest only', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    // Provider still owns the factory + interface
    expect(src).toMatch(/export function createDapAnthropicAiReviewProvider\b/)
    expect(src).toMatch(/export interface DapAnthropicAiReviewProvider\b/)
    // The mapping is no longer defined here — just imported.
    expect(src).not.toMatch(/^export function legacyReviewToEngineRaw\b/m)
    expect(src).toContain("from './dapStageAiReviewLegacy'")
  })
})

// ─── B. New legacy mapper module is pure ───────────────────────────────────

describe('Part 18 — B. dapStageAiReviewLegacy.ts is pure', () => {
  const src = readFileSync(LEGACY_MAPPER_PATH, 'utf-8')

  it('no Anthropic SDK / Anthropic client', () => {
    expect(src).not.toMatch(/@anthropic-ai\/sdk/)
    expect(src).not.toMatch(/getAnthropicClient/)
  })

  it('no Supabase / persistence', () => {
    expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
    expect(src).not.toMatch(/getSupabaseAdminClient\s*\(/)
  })

  it('no Next.js / React runtime imports', () => {
    expect(src).not.toMatch(/from ['"]next\//)
    expect(src).not.toMatch(/from ['"]react['"]/)
    expect(src).not.toMatch(/['"]use server['"]|['"]use client['"]/)
  })

  it('no filesystem / network IO', () => {
    expect(src).not.toMatch(/from ['"]fs['"]|from ['"]node:fs['"]/)
    expect(src).not.toMatch(/\bfetch\s*\(/)
  })

  it('no engine import — the mapper produces engine-shaped raw, but is independent of the engine', () => {
    // The engine normalizes the raw output; the mapper does not need to
    // import normalize itself. Verifies the mapper stays a pure shape
    // converter rather than transitively pulling in the engine surface.
    expect(src).not.toMatch(/from ['"]@\/lib\/cbcc/)
  })

  it('only legacy-shape import is the StageAiReview type from dapStageReviewer', () => {
    expect(src).toContain("import type { StageAiReview } from './dapStageReviewer'")
  })

  it('does not write approval/unlock/mutation surface', () => {
    expect(src).not.toMatch(/approveDapStage|dapStageApprovalStore|store\.approve|nextStageUnlocked\s*=/)
  })
})

// ─── C. Provider file is now thinner ───────────────────────────────────────

describe('Part 18 — C. Provider thinned to transport + harvest', () => {
  const src = readFileSync(PROVIDER_PATH, 'utf-8')

  it('imports the legacy mapper rather than defining it locally', () => {
    expect(src).toContain("from './dapStageAiReviewLegacy'")
    expect(src).toMatch(/legacyReviewToEngineRaw/)
  })

  it('still implements the engine port interface', () => {
    expect(src).toContain("from '@/lib/cbcc/aiReviewProvider'")
    expect(src).toMatch(/CbccAiReviewProvider/)
  })

  it('still single-shot harvester via consumeLastLegacy()', () => {
    expect(src).toMatch(/consumeLastLegacy\s*\(\s*\)\s*:\s*StageAiReview/)
    expect(src).toMatch(/lastLegacy\s*=\s*null/)
  })

  it('does not re-declare the mapper or the mapping options', () => {
    expect(src).not.toMatch(/^export function legacyReviewToEngineRaw\b/m)
    expect(src).not.toMatch(/^export interface LegacyToEngineMappingOptions\b/m)
  })
})

// ─── D. Round-trip preservation ────────────────────────────────────────────

describe('Part 18 — D. Round-trip behavior preserved', () => {
  it('legacyReviewToEngineRaw + normalize still produces a typed engine result', () => {
    const raw = legacyReviewToEngineRaw(fakeLegacy({ recommendation: 'approve' }))
    const normalized = normalizeCbccAiReviewResult(raw, {
      projectId: DAP_PROJECT_ID,
      stageId: 'definition',
      reviewedAt: '2026-05-01T00:00:00Z',
    })
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) return
    expect(normalized.result.decision).toBe('pass')
    expect(normalized.result.recommendation.action).toBe('proceed_to_owner_review')
  })

  it('createDapAnthropicAiReviewProvider still drives runCbccAiReview end-to-end', async () => {
    const stageDef = DAP_STAGE_DEFINITIONS.find(d => d.order === 4)!
    const packet = buildCbccAiReviewPromptPacket({
      projectId: DAP_PROJECT_ID,
      stageId: stageDef.id,
      stageTitle: stageDef.title,
      evidenceLedger: [],
      evidenceRequirements: [],
      guardrails: [],
    })

    const legacy = fakeLegacy({
      recommendation: 'request_revision',
      confidence: 'medium',
      reasoning: 'needs more detail',
      checklistResults: [{ criterion: 'X', passed: false, note: 'thin' }],
    })

    const provider: DapAnthropicAiReviewProvider = createDapAnthropicAiReviewProvider(
      fakeStageGate(4),
      { reviewStageFn: async () => legacy },
    )

    const result = await runCbccAiReview({ packet, provider })
    expect(result.decision).toBe('pass_with_concerns')
    expect(result.recommendation.action).toBe('address_risks')
    expect(result.risks).toHaveLength(1)
    expect(result.risks[0]!.message).toBe('X — thin')

    // UI compat is preserved.
    const harvested = provider.consumeLastLegacy()
    expect(harvested).toEqual(legacy)
  })
})

// ─── E. Engine purity preserved ────────────────────────────────────────────

describe('Part 18 — E. Engine purity preserved', () => {
  it('engine contract has no DAP review symbol leakage', () => {
    const src = readFileSync(ENGINE_AI_PATH, 'utf-8')
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider|dapStageAiReviewLegacy/)
    expect(src).not.toMatch(/dapStageReviewer|dapStageRubrics/)
    expect(src).not.toMatch(/\bStageAiReview\b|\bDapStageRubric\b|\breviewStage\b/)
  })

  it('engine port has no DAP review symbol leakage', () => {
    const src = readFileSync(ENGINE_PORT_PATH, 'utf-8')
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider|dapStageAiReviewLegacy/)
    expect(src).not.toMatch(/dapStageReviewer|dapStageRubrics/)
    expect(src).not.toMatch(/\bStageAiReview\b|\bDapStageRubric\b|\breviewStage\b/)
  })

  it('engine barrel does not export the new mapper module', () => {
    const src = readFileSync(ENGINE_INDEX_PATH, 'utf-8')
    expect(src).not.toMatch(/dapStageAiReviewLegacy/)
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider/)
  })
})

// ─── F. Adapter purity preserved ───────────────────────────────────────────

describe('Part 18 — F. Adapter purity preserved', () => {
  for (const name of readdirSync(ADAPTER_DIR)) {
    if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
    const src = readFileSync(resolve(ADAPTER_DIR, name), 'utf-8')

    it(`adapters/dap/${name} does not reference the new mapper module`, () => {
      expect(src).not.toMatch(/dapStageAiReviewLegacy/)
    })

    it(`adapters/dap/${name} does not reference the runtime provider module`, () => {
      expect(src).not.toMatch(/cbccAnthropicAiReviewProvider/)
    })

    it(`adapters/dap/${name} does not import lib/cb-control-center`, () => {
      expect(src).not.toMatch(/cb-control-center/)
    })

    it(`adapters/dap/${name} has no SDK / IO / runtime markers`, () => {
      expect(src).not.toMatch(/@anthropic-ai\/sdk/)
      expect(src).not.toMatch(/getAnthropicClient/)
      expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
      expect(src).not.toMatch(/from ['"]next\//)
      expect(src).not.toMatch(/from ['"]react['"]/)
      expect(src).not.toMatch(/['"]use server['"]|['"]use client['"]/)
    })
  }
})

// ─── G. Advisory-only invariant ────────────────────────────────────────────

describe('Part 18 — G. Advisory-only invariant preserved', () => {
  it('legacy mapper module does not import the approval store or supabase', () => {
    const src = readFileSync(LEGACY_MAPPER_PATH, 'utf-8')
    expect(src).not.toMatch(/dapStageApprovalStore|approveDapStage/)
    expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
  })

  it('provider module does not import the approval store or supabase', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).not.toMatch(/dapStageApprovalStore|approveDapStage/)
    expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
  })

  it('route exposes only POST and reaches no approval action', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toMatch(/export async function POST/)
    expect(src).not.toMatch(/export async function (PUT|DELETE|PATCH)/)
    expect(src).not.toMatch(/approveDapStage|dapStageActions|cbccProjectActions/)
    expect(src).not.toMatch(/nextStageUnlocked\s*=/)
  })

  it('mapper output never sets an approval/unlock field, regardless of legacy input', () => {
    const samples: StageAiReview[] = [
      fakeLegacy({ recommendation: 'approve', confidence: 'high' }),
      fakeLegacy({ recommendation: 'disapprove', confidence: 'high' }),
      fakeLegacy({ recommendation: 'request_revision', confidence: 'low' }),
    ]
    for (const s of samples) {
      const raw = legacyReviewToEngineRaw(s) as Record<string, unknown>
      // None of these forbidden field names should ever appear in the output.
      for (const banned of ['approved', 'approve', 'unlock', 'nextStageUnlocked', 'persisted']) {
        expect(raw, `mapper must not emit "${banned}"`).not.toHaveProperty(banned)
      }
    }
  })
})

// ─── H. UI shape preserved ─────────────────────────────────────────────────

describe('Part 18 — H. UI shape preserved (StageAiReviewPanel unaffected)', () => {
  it('StageAiReviewPanel imports legacy types from dapStageReviewer (unchanged)', () => {
    const src = readFileSync(REVIEW_PANEL_PATH, 'utf-8')
    expect(src).toContain("from '@/lib/cb-control-center/dapStageReviewer'")
    expect(src).toMatch(/\bStageAiReview\b/)
    expect(src).toMatch(/\bStageAiChecklistResult\b/)
  })

  it('legacy types continue to live in dapStageReviewer.ts (no quiet relocation)', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf-8')
    expect(src).toMatch(/^export interface StageAiReview\b/m)
    expect(src).toMatch(/^export interface StageAiChecklistResult\b/m)
  })

  it('panel still renders the four legacy fields (recommendation, confidence, reasoning, checklistResults)', () => {
    const src = readFileSync(REVIEW_PANEL_PATH, 'utf-8')
    expect(src).toMatch(/review\.recommendation/)
    expect(src).toMatch(/review\.confidence/)
    expect(src).toMatch(/review\.reasoning/)
    expect(src).toMatch(/review\.checklistResults/)
  })
})
