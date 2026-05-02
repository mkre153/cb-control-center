/**
 * Part 19 — Move Pure DAP Stage Rubrics Into the Adapter Zone.
 *
 * Part 19 is a single-file relocation plus a boundary-rule rephrasing:
 *   - `lib/cb-control-center/dapStageRubrics.ts` (and its co-located test)
 *     moved into `lib/cbcc/adapters/dap/`.
 *   - `lib/cb-control-center/dapStageReviewer.ts` updated to import the
 *     rubric from the adapter path.
 *   - `lib/cb-control-center/dapStagePart13.test.ts` Group 2 dropped its
 *     symbol-name bans on `dapStageRubrics` / `DapStageRubric` (which
 *     previously prevented the move). The architectural invariant —
 *     "the adapter zone may not depend on legacy `lib/cb-control-center/`
 *     code" — is preserved by the existing `cb-control-center` import
 *     ban in the same suite and is mirrored by `dapAdapter.test.ts`.
 *
 * This suite asserts the new shape and the strengthened boundary.
 *
 * Sections:
 *   A. Move outcome — rubric file + co-located test now live in the
 *      adapter zone; nothing is left behind in the legacy folder.
 *   B. Adapter rubric purity — no SDK / no IO / no Next/React markers,
 *      and the file is self-contained (only imports from within the
 *      adapter folder, if anything).
 *   C. Adapter zone is dependency-clean — no file under
 *      `lib/cbcc/adapters/dap/` imports `lib/cb-control-center/`.
 *   D. Engine purity preserved — no engine-root file references the
 *      rubric (path or symbol leakage), and the engine barrel does not
 *      re-export the rubric.
 *   E. Reviewer wiring updated — `dapStageReviewer.ts` imports the
 *      rubric from the adapter path; no references to the old legacy
 *      relative path.
 *   F. UI shape preserved — the route + panel are unchanged. The
 *      legacy `StageAiReview` shape and its consumers are intact.
 *   G. Part 13 boundary regex rephrasing recorded — the symbol-name
 *      bans are gone, the `cb-control-center` path ban is still there.
 *
 * No DOM. No network. No DB.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '..', '..')

const ADAPTER_DIR             = resolve(ROOT, 'lib/cbcc/adapters/dap')
const ENGINE_ROOT             = resolve(ROOT, 'lib/cbcc')
const ENGINE_INDEX_PATH       = resolve(ROOT, 'lib/cbcc/index.ts')

const RUBRIC_NEW              = resolve(ADAPTER_DIR, 'dapStageRubrics.ts')
const RUBRIC_NEW_TEST         = resolve(ADAPTER_DIR, 'dapStageRubrics.test.ts')
const RUBRIC_OLD              = resolve(ROOT, 'lib/cb-control-center/dapStageRubrics.ts')
const RUBRIC_OLD_TEST         = resolve(ROOT, 'lib/cb-control-center/dapStageRubrics.test.ts')

const REVIEWER_PATH           = resolve(ROOT, 'lib/cb-control-center/dapStageReviewer.ts')
const PROVIDER_PATH           = resolve(ROOT, 'lib/cb-control-center/cbccAnthropicAiReviewProvider.ts')
const LEGACY_MAPPER_PATH      = resolve(ROOT, 'lib/cb-control-center/dapStageAiReviewLegacy.ts')
const ROUTE_PATH              = resolve(ROOT, 'app/api/businesses/dental-advantage-plan/stages/review/route.ts')
const REVIEW_PANEL_PATH       = resolve(ROOT, 'components/cb-control-center/StageAiReviewPanel.tsx')
const PART13_PATH             = resolve(ROOT, 'lib/cb-control-center/dapStagePart13.test.ts')

function listAdapterImpls(): string[] {
  return readdirSync(ADAPTER_DIR)
    .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
    .map(n => resolve(ADAPTER_DIR, n))
}

function listEngineRootImpls(): string[] {
  return readdirSync(ENGINE_ROOT)
    .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
    .filter(n => {
      try { return statSync(resolve(ENGINE_ROOT, n)).isFile() } catch { return false }
    })
    .map(n => resolve(ENGINE_ROOT, n))
}

// ─── A. Move outcome ───────────────────────────────────────────────────────

describe('Part 19 — A. Move outcome', () => {
  it('rubric file is at the adapter location', () => {
    expect(existsSync(RUBRIC_NEW)).toBe(true)
  })

  it('rubric test is at the adapter location', () => {
    expect(existsSync(RUBRIC_NEW_TEST)).toBe(true)
  })

  it('no copy of the rubric remains at the legacy path', () => {
    expect(existsSync(RUBRIC_OLD)).toBe(false)
  })

  it('no copy of the rubric test remains at the legacy path', () => {
    expect(existsSync(RUBRIC_OLD_TEST)).toBe(false)
  })

  it('the moved rubric file still exports the same surface (data + helper + format)', () => {
    const src = readFileSync(RUBRIC_NEW, 'utf-8')
    expect(src).toMatch(/export interface DapStageRubric\b/)
    expect(src).toMatch(/export const DAP_STAGE_RUBRICS\b/)
    expect(src).toMatch(/export function getDapStageRubric\b/)
    expect(src).toMatch(/export function formatDapStageRubricForPrompt\b/)
  })
})

// ─── B. Adapter rubric purity ──────────────────────────────────────────────

describe('Part 19 — B. Adapter rubric file is pure', () => {
  const src = readFileSync(RUBRIC_NEW, 'utf-8')

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

  it('no import from the legacy cb-control-center folder', () => {
    expect(src).not.toMatch(/from ['"][^'"]*cb-control-center[^'"]*['"]/)
  })

  it('does not write approval/unlock/mutation surface', () => {
    expect(src).not.toMatch(/approveDapStage|dapStageApprovalStore|store\.approve|nextStageUnlocked\s*=/)
  })
})

// ─── C. Adapter zone is dependency-clean ───────────────────────────────────

describe('Part 19 — C. Adapter zone has no legacy-folder dependencies', () => {
  for (const file of listAdapterImpls()) {
    const name = file.split('/').pop()!
    const src = readFileSync(file, 'utf-8')

    it(`adapters/dap/${name} does not import from lib/cb-control-center`, () => {
      expect(src).not.toMatch(/from ['"][^'"]*cb-control-center[^'"]*['"]/)
    })
  }
})

// ─── D. Engine purity preserved ────────────────────────────────────────────

describe('Part 19 — D. Engine purity preserved', () => {
  it('no engine-root impl file imports the rubric (path or symbol)', () => {
    for (const file of listEngineRootImpls()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${file} must not import the rubric module`).not.toMatch(
        /from ['"][^'"]*dapStageRubrics[^'"]*['"]/,
      )
      expect(src, `${file} must not reference DapStageRubric symbol`).not.toMatch(
        /\bDapStageRubric\b/,
      )
    }
  })

  it('engine barrel does not re-export the rubric', () => {
    const src = readFileSync(ENGINE_INDEX_PATH, 'utf-8')
    expect(src).not.toMatch(/dapStageRubrics/)
    expect(src).not.toMatch(/\bDapStageRubric\b/)
    // and still does not reach into adapters/dap
    expect(src).not.toMatch(/adapters\/dap/)
  })

  it('DAP adapter local barrel does not re-export the rubric', () => {
    // Keeping rubric out of the adapter index keeps consumers explicit
    // about reaching for review-time data, and makes future migrations
    // (e.g. lazy-loading rubric prompt blocks) easier.
    const src = readFileSync(resolve(ADAPTER_DIR, 'index.ts'), 'utf-8')
    expect(src).not.toMatch(/dapStageRubrics/)
  })
})

// ─── E. Reviewer wiring updated ────────────────────────────────────────────

describe('Part 19 — E. Reviewer reaches into the adapter zone (Part 20 update)', () => {
  const src = readFileSync(REVIEWER_PATH, 'utf-8')

  it('reviewer reaches the adapter zone via a path-aliased import', () => {
    // Pre-Part-20 the reviewer imported the rubric directly. Part 20
    // moved the rubric consumption into the prompt builder, which
    // the reviewer now imports instead. Either form satisfies the
    // architectural rule "legacy → adapter is the safe direction."
    expect(src).toMatch(/from ['"]@\/lib\/cbcc\/adapters\/dap\/[^'"]+['"]/)
  })

  it('reviewer no longer references the old relative rubric path', () => {
    expect(src).not.toContain("from './dapStageRubrics'")
  })

  it('no legacy-folder file imports the rubric directly any more (Part 20)', () => {
    // Part 20 routed all rubric consumption through the adapter-zone
    // prompt builder, so no file in lib/cb-control-center/ should have
    // a direct dapStageRubrics import.
    const legacyDir = resolve(ROOT, 'lib/cb-control-center')
    const consumers: string[] = []
    for (const name of readdirSync(legacyDir)) {
      if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
      const fileSrc = readFileSync(resolve(legacyDir, name), 'utf-8')
      if (/from ['"][^'"]*dapStageRubrics[^'"]*['"]/.test(fileSrc)) consumers.push(name)
    }
    expect(consumers).toEqual([])
  })
})

// ─── F. UI shape preserved ─────────────────────────────────────────────────

describe('Part 19 — F. UI/route behavior unchanged', () => {
  it('route still calls runCbccAiReview and harvests the legacy result', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toMatch(/runCbccAiReview/)
    expect(src).toMatch(/consumeLastLegacy\s*\(\s*\)/)
  })

  it('StageAiReviewPanel still imports legacy types from the reviewer module', () => {
    const src = readFileSync(REVIEW_PANEL_PATH, 'utf-8')
    expect(src).toContain("from '@/lib/cb-control-center/dapStageReviewer'")
    expect(src).toMatch(/\bStageAiReview\b/)
    expect(src).toMatch(/\bStageAiChecklistResult\b/)
  })

  it('runtime provider + legacy mapper modules are unchanged in location and surface', () => {
    expect(existsSync(PROVIDER_PATH)).toBe(true)
    expect(existsSync(LEGACY_MAPPER_PATH)).toBe(true)
    const provSrc = readFileSync(PROVIDER_PATH, 'utf-8')
    const mapSrc  = readFileSync(LEGACY_MAPPER_PATH, 'utf-8')
    expect(provSrc).toContain("from './dapStageAiReviewLegacy'")
    expect(mapSrc).toContain("import type { StageAiReview } from './dapStageReviewer'")
  })
})

// ─── G. Part 13 boundary regex rephrasing recorded ─────────────────────────

describe('Part 19 — G. Part 13 boundary rule rephrased (symbol → path)', () => {
  const src = readFileSync(PART13_PATH, 'utf-8')

  it('symbol-name ban on dapStageRubrics has been removed from ADAPTER_FORBIDDEN', () => {
    // The previous form was a literal pattern entry whose label was
    // 'dapStageRubrics reference'. After Part 19 there is no such entry.
    expect(src).not.toMatch(/label:\s*['"]dapStageRubrics reference['"]/)
  })

  it('symbol-name ban on DapStageRubric has been removed from ADAPTER_FORBIDDEN', () => {
    expect(src).not.toMatch(/label:\s*['"]DapStageRubric reference['"]/)
  })

  it('cb-control-center import path ban is still present (the actual architectural invariant)', () => {
    expect(src).toMatch(/cb-control-center[\s\S]*label:\s*['"]cb-control-center import['"]/)
  })

  it('runtime-behavior symbol bans (reviewer, reviewStage, StageAiReview) remain', () => {
    expect(src).toMatch(/label:\s*['"]dapStageReviewer reference['"]/)
    expect(src).toMatch(/label:\s*['"]reviewStage reference['"]/)
    expect(src).toMatch(/label:\s*['"]StageAiReview reference['"]/)
  })
})
