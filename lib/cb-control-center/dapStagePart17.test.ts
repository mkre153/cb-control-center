/**
 * Part 17 — AI Review Provider-Port Migration acceptance suite.
 *
 * Coverage:
 *   A. Runtime provider module shape and boundary
 *   B. Legacy → engine raw mapping (pure function, exhaustive cases)
 *   C. Provider conforms to the engine port and round-trips through
 *      runCbccAiReview without touching real Anthropic or persistence
 *   D. Route flows through the engine port (imports runCbccAiReview, builds
 *      the packet, asks provider for legacy harvest, returns legacy shape)
 *   E. Engine purity preserved — no SDK, no DAP review symbol leakage,
 *      no approval-store coupling
 *   F. AI review remains advisory — provider cannot persist or unlock,
 *      and the route emits no mutation surface
 *
 * No DOM. No network. No DB. Filesystem + in-process imports + a stubbed
 * reviewStage so the engine port is exercised end-to-end deterministically.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

import {
  legacyReviewToEngineRaw,
  createDapAnthropicAiReviewProvider,
  type DapAnthropicAiReviewProvider,
} from './cbccAnthropicAiReviewProvider'
import type { StageAiReview } from './dapStageReviewer'
import type { DapStageGate } from './dapStageGates'
import { runCbccAiReview } from '@/lib/cbcc/aiReviewProvider'
import { buildCbccAiReviewPromptPacket } from '@/lib/cbcc/aiReview'
import { DAP_PROJECT_ID, DAP_STAGE_DEFINITIONS } from '@/lib/cbcc/adapters/dap'

const ROOT = resolve(__dirname, '..', '..')
const ROUTE_PATH = resolve(ROOT, 'app/api/businesses/dental-advantage-plan/stages/review/route.ts')
const PROVIDER_PATH = resolve(ROOT, 'lib/cb-control-center/cbccAnthropicAiReviewProvider.ts')
const ENGINE_AI_PATH = resolve(ROOT, 'lib/cbcc/aiReview.ts')
const ENGINE_AI_PROVIDER_PATH = resolve(ROOT, 'lib/cbcc/aiReviewProvider.ts')
const ENGINE_INDEX_PATH = resolve(ROOT, 'lib/cbcc/index.ts')
const ADAPTER_DIR = resolve(ROOT, 'lib/cbcc/adapters/dap')

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

function fakeLegacyReview(overrides: Partial<StageAiReview> = {}): StageAiReview {
  return {
    recommendation: 'request_revision',
    confidence: 'medium',
    reasoning: 'baseline reasoning text',
    checklistResults: [],
    ...overrides,
  } as StageAiReview
}

// ─── A. Runtime provider module shape and boundary ──────────────────────────

describe('Part 17 — A. Runtime provider module shape', () => {
  it('lib/cb-control-center/cbccAnthropicAiReviewProvider.ts exists', () => {
    expect(existsSync(PROVIDER_PATH)).toBe(true)
  })

  it('module exports the factory and the mapping function', () => {
    expect(typeof legacyReviewToEngineRaw).toBe('function')
    expect(typeof createDapAnthropicAiReviewProvider).toBe('function')
  })

  it('module imports the engine port (CbccAiReviewProvider) — not the legacy reviewer alone', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).toContain("from '@/lib/cbcc/aiReviewProvider'")
  })

  it('module is allowed to import the legacy reviewer (provider is the boundary)', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).toContain("from './dapStageReviewer'")
  })

  it('engine port (lib/cbcc/aiReviewProvider.ts) does not import the runtime provider', () => {
    const src = readFileSync(ENGINE_AI_PROVIDER_PATH, 'utf-8')
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider/)
    expect(src).not.toMatch(/cb-control-center/)
  })

  it('engine contract (lib/cbcc/aiReview.ts) does not import the runtime provider', () => {
    const src = readFileSync(ENGINE_AI_PATH, 'utf-8')
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider/)
    expect(src).not.toMatch(/cb-control-center/)
  })

  it('engine barrel does not export the runtime provider', () => {
    const src = readFileSync(ENGINE_INDEX_PATH, 'utf-8')
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider/)
  })

  it('lib/cbcc/adapters/dap/ does not reference the runtime provider', () => {
    for (const name of readdirSync(ADAPTER_DIR)) {
      if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
      const src = readFileSync(resolve(ADAPTER_DIR, name), 'utf-8')
      expect(src, `adapters/dap/${name} must not reference the runtime provider`)
        .not.toMatch(/cbccAnthropicAiReviewProvider/)
    }
  })
})

// ─── B. Legacy → engine raw mapping ──────────────────────────────────────────

describe('Part 17 — B. legacyReviewToEngineRaw mapping', () => {
  it('approve → decision pass + action proceed_to_owner_review', () => {
    const raw = legacyReviewToEngineRaw(
      fakeLegacyReview({ recommendation: 'approve', confidence: 'high', reasoning: 'looks good' }),
    ) as Record<string, unknown>
    expect(raw.decision).toBe('pass')
    const rec = raw.recommendation as Record<string, unknown>
    expect(rec.action).toBe('proceed_to_owner_review')
    expect(rec.rationale).toBe('looks good')
    expect(raw.summary).toBe('looks good')
  })

  it('disapprove → decision fail + action revise_artifact', () => {
    const raw = legacyReviewToEngineRaw(
      fakeLegacyReview({ recommendation: 'disapprove', confidence: 'high', reasoning: 'wrong' }),
    ) as Record<string, unknown>
    expect(raw.decision).toBe('fail')
    expect((raw.recommendation as Record<string, unknown>).action).toBe('revise_artifact')
  })

  it('request_revision → decision pass_with_concerns + action address_risks', () => {
    const raw = legacyReviewToEngineRaw(
      fakeLegacyReview({ recommendation: 'request_revision', confidence: 'low' }),
    ) as Record<string, unknown>
    expect(raw.decision).toBe('pass_with_concerns')
    expect((raw.recommendation as Record<string, unknown>).action).toBe('address_risks')
  })

  it('failed checklist items become engine risks; passed items are ignored', () => {
    const raw = legacyReviewToEngineRaw(
      fakeLegacyReview({
        confidence: 'high',
        checklistResults: [
          { criterion: 'A', passed: true },
          { criterion: 'B', passed: false, note: 'missing detail' },
          { criterion: 'C', passed: false },
        ],
      }),
    ) as Record<string, unknown>
    const risks = raw.risks as Array<Record<string, unknown>>
    expect(risks).toHaveLength(2)
    expect(risks[0]!.severity).toBe('high')
    expect(risks[0]!.message).toBe('B — missing detail')
    expect(risks[1]!.message).toBe('C')
  })

  it('confidence maps 1:1 to risk severity (low/medium/high)', () => {
    for (const c of ['low', 'medium', 'high'] as const) {
      const raw = legacyReviewToEngineRaw(
        fakeLegacyReview({
          confidence: c,
          checklistResults: [{ criterion: 'X', passed: false }],
        }),
      ) as Record<string, unknown>
      const risks = raw.risks as Array<Record<string, unknown>>
      expect(risks[0]!.severity).toBe(c)
    }
  })

  it('empty reasoning falls back to a synthetic, non-empty summary + rationale', () => {
    const raw = legacyReviewToEngineRaw(
      fakeLegacyReview({ recommendation: 'approve', confidence: 'high', reasoning: '' }),
    ) as Record<string, unknown>
    expect(typeof raw.summary).toBe('string')
    expect((raw.summary as string).length).toBeGreaterThan(0)
    const rec = raw.recommendation as Record<string, unknown>
    expect(typeof rec.rationale).toBe('string')
    expect((rec.rationale as string).length).toBeGreaterThan(0)
  })

  it('options.model overrides default model identifier', () => {
    const raw = legacyReviewToEngineRaw(fakeLegacyReview(), { model: 'test-model' })
    expect((raw as Record<string, unknown>).model).toBe('test-model')
  })
})

// ─── C. Provider conforms to engine port + round-trips ──────────────────────

describe('Part 17 — C. Provider round-trips through runCbccAiReview', () => {
  it('createDapAnthropicAiReviewProvider returns an object satisfying CbccAiReviewProvider', () => {
    const provider = createDapAnthropicAiReviewProvider(fakeStageGate(3), {
      reviewStageFn: async () => fakeLegacyReview(),
    })
    expect(typeof provider.review).toBe('function')
    expect(typeof provider.consumeLastLegacy).toBe('function')
  })

  it('runCbccAiReview produces a typed CbccAiReviewResult and provider yields the legacy snapshot', async () => {
    const stageDef = DAP_STAGE_DEFINITIONS.find(d => d.order === 3)!
    const packet = buildCbccAiReviewPromptPacket({
      projectId: DAP_PROJECT_ID,
      stageId: stageDef.id,
      stageTitle: stageDef.title,
      stageDescription: stageDef.description,
      stagePurpose: stageDef.purpose,
      evidenceLedger: [],
      evidenceRequirements: [],
      guardrails: ['Advisory only'],
    })

    const legacy: StageAiReview = fakeLegacyReview({
      recommendation: 'approve',
      confidence: 'high',
      reasoning: 'all checks pass',
      checklistResults: [],
    })
    const provider: DapAnthropicAiReviewProvider = createDapAnthropicAiReviewProvider(
      fakeStageGate(3),
      { reviewStageFn: async () => legacy },
    )

    const result = await runCbccAiReview({ packet, provider })
    expect(result.decision).toBe('pass')
    expect(result.recommendation.action).toBe('proceed_to_owner_review')
    expect(result.summary).toBe('all checks pass')
    expect(result.projectId).toBe(DAP_PROJECT_ID)
    expect(result.stageId).toBe(stageDef.id)

    // The provider keeps the original legacy snapshot for UI compat.
    const harvested = provider.consumeLastLegacy()
    expect(harvested).toEqual(legacy)
    // consume is one-shot — second read clears the slot.
    expect(provider.consumeLastLegacy()).toBeNull()
  })

  it('provider wraps reviewStage exactly once per review() call', async () => {
    let calls = 0
    const provider = createDapAnthropicAiReviewProvider(fakeStageGate(2), {
      reviewStageFn: async () => {
        calls++
        return fakeLegacyReview()
      },
    })
    const stageDef = DAP_STAGE_DEFINITIONS.find(d => d.order === 2)!
    const packet = buildCbccAiReviewPromptPacket({
      projectId: DAP_PROJECT_ID,
      stageId: stageDef.id,
      stageTitle: stageDef.title,
      evidenceLedger: [],
      evidenceRequirements: [],
      guardrails: [],
    })
    await runCbccAiReview({ packet, provider })
    expect(calls).toBe(1)
  })

  it('provider does not invent a stage from the packet — it uses the gate it was constructed with', async () => {
    let receivedGate: DapStageGate | undefined
    const gate = fakeStageGate(5)
    const provider = createDapAnthropicAiReviewProvider(gate, {
      reviewStageFn: async (g) => {
        receivedGate = g
        return fakeLegacyReview()
      },
    })
    const stageDef = DAP_STAGE_DEFINITIONS.find(d => d.order === 1)! // mismatch on purpose
    const packet = buildCbccAiReviewPromptPacket({
      projectId: DAP_PROJECT_ID,
      stageId: stageDef.id,
      stageTitle: stageDef.title,
      evidenceLedger: [],
      evidenceRequirements: [],
      guardrails: [],
    })
    await runCbccAiReview({ packet, provider })
    expect(receivedGate?.stageNumber).toBe(5)
  })
})

// ─── D. Route flows through the engine port ─────────────────────────────────

describe('Part 17 — D. Route flows through the engine port', () => {
  const src = readFileSync(ROUTE_PATH, 'utf-8')

  it('imports runCbccAiReview from the engine port', () => {
    expect(src).toContain("from '@/lib/cbcc/aiReviewProvider'")
    expect(src).toMatch(/runCbccAiReview/)
  })

  it('imports buildCbccAiReviewPromptPacket from the engine contract', () => {
    expect(src).toContain("from '@/lib/cbcc/aiReview'")
    expect(src).toMatch(/buildCbccAiReviewPromptPacket/)
  })

  it('imports the runtime provider factory', () => {
    expect(src).toContain("from '@/lib/cb-control-center/cbccAnthropicAiReviewProvider'")
    expect(src).toMatch(/createDapAnthropicAiReviewProvider/)
  })

  it('does not call reviewStage directly any more', () => {
    expect(src).not.toMatch(/\breviewStage\s*\(/)
  })

  it('uses the engine adapter to map stageNumber → engine stage id', () => {
    expect(src).toContain("from '@/lib/cbcc/adapters/dap'")
    expect(src).toMatch(/DAP_STAGE_DEFINITIONS/)
  })

  it('returns the legacy StageAiReview shape via consumeLastLegacy() (UI compat)', () => {
    expect(src).toMatch(/consumeLastLegacy\s*\(\s*\)/)
  })

  it('still does no persistence and no approval mutation', () => {
    expect(src).not.toMatch(/supabase|getSupabaseAdminClient/)
    expect(src).not.toMatch(/approveDapStage|dapStageActions|cbccProjectActions/)
  })
})

// ─── E. Engine purity preserved ─────────────────────────────────────────────

describe('Part 17 — E. Engine purity preserved', () => {
  it('engine contract has no SDK, no Supabase, no Next/React markers', () => {
    const src = readFileSync(ENGINE_AI_PATH, 'utf-8')
    expect(src).not.toMatch(/@anthropic-ai\/sdk/)
    expect(src).not.toMatch(/getAnthropicClient/)
    expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
    expect(src).not.toMatch(/getSupabaseAdminClient\s*\(/)
    expect(src).not.toMatch(/from ['"]next\//)
    expect(src).not.toMatch(/from ['"]react['"]/)
    expect(src).not.toMatch(/['"]use server['"]|['"]use client['"]/)
  })

  it('engine port has no SDK, no Supabase, no Next/React markers', () => {
    const src = readFileSync(ENGINE_AI_PROVIDER_PATH, 'utf-8')
    expect(src).not.toMatch(/@anthropic-ai\/sdk/)
    expect(src).not.toMatch(/getAnthropicClient/)
    expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
    expect(src).not.toMatch(/getSupabaseAdminClient\s*\(/)
    expect(src).not.toMatch(/from ['"]next\//)
    expect(src).not.toMatch(/from ['"]react['"]/)
    expect(src).not.toMatch(/['"]use server['"]|['"]use client['"]/)
  })

  it('engine surface has no DAP review symbol leakage', () => {
    const src = readFileSync(ENGINE_INDEX_PATH, 'utf-8')
    expect(src).not.toMatch(/dapStageReviewer|dapStageRubrics|cbccAnthropicAiReviewProvider/)
    expect(src).not.toMatch(/\bStageAiReview\b|\bDapStageRubric\b|\breviewStage\b/)
  })
})

// ─── F. Advisory-only invariant preserved ───────────────────────────────────

describe('Part 17 — F. AI review remains advisory', () => {
  it('runtime provider does not import the approval store', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).not.toMatch(/dapStageApprovalStore|approveDapStage/)
  })

  it('runtime provider does not import supabase or persistence', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).not.toMatch(/supabase|getSupabaseAdminClient/)
  })

  it('route returns advisory JSON only — no approval/unlock surface', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).not.toMatch(/approveDapStage|store\.approve|nextStageUnlocked\s*=/)
    expect(src).not.toMatch(/export async function (PUT|DELETE|PATCH)/)
  })
})
