/**
 * Part 20 — Split DAP Stage Reviewer Into Pure Prompt Assembly vs Runtime
 * Execution.
 *
 * Part 20 extracted the pure prompt-construction concerns out of the legacy
 * `dapStageReviewer.ts` into a new adapter-zone module:
 *
 *   lib/cbcc/adapters/dap/dapStageReviewPrompt.ts
 *
 * The reviewer kept only the Anthropic transport (SDK call, response
 * parse, error fallback) and the legacy `StageAiReview` UI-compat type.
 *
 * This suite is the formal record of the split's invariants, mapped 1:1
 * to the directive's required tests.
 *
 * Sections:
 *   A. New adapter-zone prompt module exists and exports the right
 *      surface.
 *   B. Prompt module is pure — no SDK / no IO / no Next/React markers,
 *      no imports from lib/cb-control-center/, no runtime/API/provider
 *      modules.
 *   C. Prompt module imports rubric from the adapter-zone rubric file.
 *   D. Reviewer no longer owns extracted prompt content (truth rules
 *      constant, system prompt template, user payload assembly).
 *   E. Runtime boundary preserved — Anthropic SDK still lives in
 *      `lib/cb-control-center/`, never in the adapter zone.
 *   F. Earlier parts' boundary assumptions remain valid (Part 13, 17,
 *      18, 19).
 *   G. Route + Stage AI Review panel still receive the same legacy-
 *      compatible review shape.
 *
 * No DOM. No network. No DB.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'

import {
  DAP_TRUTH_RULES,
  buildDapStageReviewPromptPacket,
  type DapStageReviewPromptInput,
} from '@/lib/cbcc/adapters/dap/dapStageReviewPrompt'

const ROOT = resolve(__dirname, '..', '..')

const PROMPT_PATH       = resolve(ROOT, 'lib/cbcc/adapters/dap/dapStageReviewPrompt.ts')
const PROMPT_TEST_PATH  = resolve(ROOT, 'lib/cbcc/adapters/dap/dapStageReviewPrompt.test.ts')
const RUBRIC_PATH       = resolve(ROOT, 'lib/cbcc/adapters/dap/dapStageRubrics.ts')
const REVIEWER_PATH     = resolve(ROOT, 'lib/cb-control-center/dapStageReviewer.ts')
const PROVIDER_PATH     = resolve(ROOT, 'lib/cb-control-center/cbccAnthropicAiReviewProvider.ts')
const ROUTE_PATH        = resolve(ROOT, 'app/api/businesses/dental-advantage-plan/stages/review/route.ts')
const REVIEW_PANEL_PATH = resolve(ROOT, 'components/cb-control-center/StageAiReviewPanel.tsx')
const ADAPTER_DIR       = resolve(ROOT, 'lib/cbcc/adapters/dap')
const ENGINE_ROOT       = resolve(ROOT, 'lib/cbcc')

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function fakeInput(overrides: Partial<DapStageReviewPromptInput> = {}): DapStageReviewPromptInput {
  return {
    stageId: 's',
    stageNumber: 3,
    title: 't',
    status: 'awaiting_owner_approval',
    requirements: [],
    requiredApprovals: [],
    blockers: [],
    implementationEvidence: {},
    artifact: null,
    ...overrides,
  }
}

// ─── A. Module shape ───────────────────────────────────────────────────────

describe('Part 20 — A. Adapter-zone prompt module exists', () => {
  it('lib/cbcc/adapters/dap/dapStageReviewPrompt.ts exists', () => {
    expect(existsSync(PROMPT_PATH)).toBe(true)
  })

  it('co-located test file exists', () => {
    expect(existsSync(PROMPT_TEST_PATH)).toBe(true)
  })

  it('exports the truth-rules constant, the input type, and the builder', () => {
    expect(Array.isArray(DAP_TRUTH_RULES)).toBe(true)
    expect(DAP_TRUTH_RULES.length).toBe(7)
    expect(typeof buildDapStageReviewPromptPacket).toBe('function')
  })

  it('builder returns the (systemPrompt, userPrompt) pair the reviewer needs', () => {
    const packet = buildDapStageReviewPromptPacket(fakeInput())
    expect(typeof packet.systemPrompt).toBe('string')
    expect(typeof packet.userPrompt).toBe('string')
    expect(packet.systemPrompt.length).toBeGreaterThan(0)
    expect(() => JSON.parse(packet.userPrompt)).not.toThrow()
  })
})

// ─── B. Prompt module is pure ──────────────────────────────────────────────

describe('Part 20 — B. Adapter prompt module is pure', () => {
  const src = stripComments(readFileSync(PROMPT_PATH, 'utf-8'))

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

  it('no import from lib/cb-control-center/', () => {
    expect(src).not.toMatch(/from ['"][^'"]*cb-control-center[^'"]*['"]/)
  })

  it('no reference to runtime/API/provider modules', () => {
    expect(src).not.toMatch(/cbccAnthropicAiReviewProvider/)
    expect(src).not.toMatch(/dapStageAiReviewLegacy/)
    expect(src).not.toMatch(/dapStageReviewer/)
  })

  it('no approval/unlock/persistence surface', () => {
    expect(src).not.toMatch(/approveDapStage|dapStageApprovalStore|store\.approve|nextStageUnlocked\s*=/)
  })
})

// ─── C. Prompt module imports rubric from adapter zone ─────────────────────

describe('Part 20 — C. Prompt module pulls rubric from the adapter rubric module', () => {
  const src = readFileSync(PROMPT_PATH, 'utf-8')

  it('imports from the sibling adapter rubric file', () => {
    expect(src).toContain("from './dapStageRubrics'")
  })

  it('does not import from anywhere outside the adapter folder', () => {
    // All imports should resolve relative (.) — i.e. siblings — or to a
    // pure type from the engine root if needed (none currently). No
    // path-aliased reach into other zones.
    const matches = [...src.matchAll(/from ['"]([^'"]+)['"]/g)].map(m => m[1]!)
    for (const spec of matches) {
      expect(
        spec.startsWith('./') || spec.startsWith('../'),
        `prompt module pulls a non-relative import: ${spec}`,
      ).toBe(true)
    }
  })

  it('rubric file still exists at the adapter path (Part 19 invariant)', () => {
    expect(existsSync(RUBRIC_PATH)).toBe(true)
  })
})

// ─── D. Reviewer no longer owns extracted prompt content ───────────────────

describe('Part 20 — D. Reviewer no longer owns prompt content', () => {
  const src = readFileSync(REVIEWER_PATH, 'utf-8')

  it('does not redeclare DAP_TRUTH_RULES locally', () => {
    expect(src).not.toMatch(/^(?:export\s+)?const\s+DAP_TRUTH_RULES\b/m)
  })

  it('does not embed the system prompt template', () => {
    expect(src).not.toMatch(/You are a DAP build process auditor/)
    expect(src).not.toMatch(/ANTI-BYPASS RULE/)
  })

  it('does not assemble the user payload locally', () => {
    expect(src).not.toMatch(/advisoryNotice:/)
    expect(src).not.toMatch(/getDapStageRubric|formatDapStageRubricForPrompt/)
  })

  it('imports the prompt builder from the adapter zone', () => {
    expect(src).toContain("from '@/lib/cbcc/adapters/dap/dapStageReviewPrompt'")
    expect(src).toContain('buildDapStageReviewPromptPacket')
  })
})

// ─── E. Runtime boundary preserved ─────────────────────────────────────────

describe('Part 20 — E. Anthropic transport stays in lib/cb-control-center/', () => {
  it('reviewer still owns the SDK call site', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf-8')
    expect(src).toContain('getAnthropicClient')
    expect(src).toMatch(/messages\.create\s*\(/)
    expect(src).toContain('claude-opus-4-7')
  })

  it('runtime provider still wraps reviewStage from the legacy folder', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).toContain("from './dapStageReviewer'")
    expect(src).toContain('reviewStage')
  })

  it('no adapter-zone file imports the SDK', () => {
    for (const name of readdirSync(ADAPTER_DIR)) {
      if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
      const src = stripComments(readFileSync(resolve(ADAPTER_DIR, name), 'utf-8'))
      expect(src, `adapters/dap/${name} pulled the SDK`).not.toMatch(/@anthropic-ai\/sdk/)
      expect(src, `adapters/dap/${name} called getAnthropicClient`).not.toMatch(/getAnthropicClient/)
    }
  })

  it('engine root contains no DAP review symbols', () => {
    const files = readdirSync(ENGINE_ROOT)
      .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
      .filter(n => {
        try { return statSync(resolve(ENGINE_ROOT, n)).isFile() } catch { return false }
      })
    for (const name of files) {
      const src = readFileSync(resolve(ENGINE_ROOT, name), 'utf-8')
      expect(src, `${name} must not reference DAP review symbols`).not.toMatch(
        /\bStageAiReview\b|\bDapStageRubric\b|\breviewStage\b|buildDapStageReviewPromptPacket/,
      )
    }
  })
})

// ─── F. Earlier parts' assumptions remain valid ────────────────────────────

describe('Part 20 — F. Earlier parts still hold', () => {
  it('Part 13: legacy reviewer is still in lib/cb-control-center/', () => {
    expect(existsSync(REVIEWER_PATH)).toBe(true)
  })

  it('Part 17: route still flows through runCbccAiReview + consumeLastLegacy()', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toMatch(/runCbccAiReview/)
    expect(src).toMatch(/consumeLastLegacy\s*\(\s*\)/)
  })

  it('Part 18: provider still imports the legacy mapper', () => {
    const src = readFileSync(PROVIDER_PATH, 'utf-8')
    expect(src).toContain("from './dapStageAiReviewLegacy'")
  })

  it('Part 19: rubric file is in the adapter zone', () => {
    expect(existsSync(RUBRIC_PATH)).toBe(true)
    expect(existsSync(resolve(ROOT, 'lib/cb-control-center/dapStageRubrics.ts'))).toBe(false)
  })

  it('Part 19: DAP adapter local barrel does not re-export rubric or prompt', () => {
    // Keeping these out of the barrel keeps the engine barrel's
    // invariant ("no DAP review symbol leakage") intact transitively.
    const src = readFileSync(resolve(ADAPTER_DIR, 'index.ts'), 'utf-8')
    expect(src).not.toMatch(/dapStageRubrics/)
    expect(src).not.toMatch(/dapStageReviewPrompt/)
  })
})

// ─── G. Route + UI shape preserved ─────────────────────────────────────────

describe('Part 20 — G. Route + UI shape unchanged', () => {
  it('StageAiReviewPanel still imports legacy types from the reviewer module', () => {
    const src = readFileSync(REVIEW_PANEL_PATH, 'utf-8')
    expect(src).toContain("from '@/lib/cb-control-center/dapStageReviewer'")
    expect(src).toMatch(/\bStageAiReview\b/)
    expect(src).toMatch(/\bStageAiChecklistResult\b/)
  })

  it('reviewer continues to export the legacy UI types', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf-8')
    expect(src).toMatch(/export interface StageAiReview\b/)
    expect(src).toMatch(/export interface StageAiChecklistResult\b/)
  })

  it('reviewer still returns the legacy shape on success and on error fallback', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf-8')
    // Success path: parsed JSON cast to StageAiReview.
    expect(src).toMatch(/JSON\.parse\([^)]*\)\s+as\s+StageAiReview/)
    // Error fallback: returns a request_revision review with low confidence.
    expect(src).toMatch(/recommendation:\s*'request_revision'/)
    expect(src).toMatch(/confidence:\s*'low'/)
  })
})
