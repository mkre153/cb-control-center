/**
 * Part 13 — Adapter purity boundary acceptance suite.
 *
 * Original Part 13 plan was to relocate `dapStageReviewer.ts` and
 * `dapStageRubrics.ts` from `lib/cb-control-center/` into
 * `lib/cbcc/adapters/dap/`. The move was attempted, then reverted, because
 * `lib/cbcc/adapters/dap/` is already protected by stricter pre-existing
 * boundary tests:
 *
 *   - `lib/cbcc/adapters/dap/dapAdapter.test.ts`
 *       forbids `@anthropic-ai/sdk`, `getAnthropicClient`, `fetch(`,
 *       `supabase`, `from "next/"`, `from "react"`, `'use server'`,
 *       `'use client'` in any `adapters/dap/*.ts` file.
 *   - `lib/cb-control-center/dapStagePart7.test.ts`
 *       forbids any `adapters/dap/*.ts` file from importing
 *       `lib/cb-control-center/...`.
 *
 * Part 19 update: `dapStageRubrics.ts` IS now moved to
 * `lib/cbcc/adapters/dap/`. It was always pure data + a pure formatter,
 * so it satisfies adapter purity on its own. The change required by Part
 * 19 was rephrasing this file's Group 2 boundary regex from "ban the
 * symbol names `dapStageRubrics` / `DapStageRubric`" to "ban depending on
 * the legacy `lib/cb-control-center/` directory." The architectural
 * invariant being protected — the adapter zone may not depend on legacy
 * runtime code — is preserved and arguably strengthened: the rule is
 * stated as a dependency boundary instead of a name-shape coincidence.
 *
 * The reviewer module is still at `lib/cb-control-center/` because it
 * structurally violates adapter purity (calls `getAnthropicClient`,
 * imports `DapStageGate` from the legacy folder). Moving it into
 * `adapters/dap/` would require breaking those rules or co-relocating
 * its dependencies (out of scope for Part 19; deferred to a Part-N
 * decomposition of the reviewer into "pure prompt assembly" vs.
 * "Anthropic execution").
 *
 * This file therefore documents and asserts:
 *
 *   1. The DAP reviewer stays in `lib/cb-control-center/`; the rubric
 *      is now in `lib/cbcc/adapters/dap/` (Part 19 move).
 *   2. `lib/cbcc/adapters/dap/` remains pure: no SDK calls, no IO, no
 *      cross-imports from `lib/cb-control-center/`, no Next.js / React
 *      runtime markers, no reviewer-runtime symbols.
 *   3. The legacy reviewer surface is still wired to its current
 *      importers (only the rubric import path changed).
 *
 * No DOM, no network, no DB. Pure filesystem + source-content checks.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '..', '..')

// Legacy reviewer path. The reviewer module is still in
// `lib/cb-control-center/` because it structurally violates adapter purity
// (Anthropic SDK dependency); a future Part may decompose it.
const LEGACY_REVIEWER = resolve(ROOT, 'lib/cb-control-center/dapStageReviewer.ts')

// Pre-Part-19 location, kept as a constant only so the "no copy left
// behind" assertion below is explicit.
const LEGACY_RUBRICS_OLD = resolve(ROOT, 'lib/cb-control-center/dapStageRubrics.ts')

// Part 19 destination — the rubric data + format helper now live inside
// the DAP adapter purity zone.
const ADAPTER_RUBRICS = resolve(ROOT, 'lib/cbcc/adapters/dap/dapStageRubrics.ts')

// Pure-zone roots.
const ENGINE_ROOT  = resolve(ROOT, 'lib/cbcc')
const ADAPTER_ROOT = resolve(ROOT, 'lib/cbcc/adapters/dap')

// Importers that point at the legacy reviewer.
const ROUTE_FILE      = resolve(ROOT, 'app/api/businesses/dental-advantage-plan/stages/review/route.ts')
const ROUTE_TEST_FILE = resolve(ROOT, 'app/api/businesses/dental-advantage-plan/stages/review/route.test.ts')
const REVIEW_PANEL    = resolve(ROOT, 'components/cb-control-center/StageAiReviewPanel.tsx')

function listAdapterImplFiles(): string[] {
  return readdirSync(ADAPTER_ROOT)
    .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map(name => resolve(ADAPTER_ROOT, name))
}

function listEngineRootImplFiles(): string[] {
  return readdirSync(ENGINE_ROOT)
    .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .filter(name => {
      // Only top-level files; skip subdirectories (adapters/, etc.).
      try {
        return statSync(resolve(ENGINE_ROOT, name)).isFile()
      } catch {
        return false
      }
    })
    .map(name => resolve(ENGINE_ROOT, name))
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

// ─── Group 1: reviewer stays in legacy folder; rubric moved to adapter ──────

describe('Part 13 — Group 1: reviewer stays in legacy folder; rubric moved to adapter (Part 19)', () => {
  it('lib/cb-control-center/dapStageReviewer.ts still exists', () => {
    expect(existsSync(LEGACY_REVIEWER)).toBe(true)
  })

  it('Part 19: rubric file moved into the adapter zone', () => {
    expect(existsSync(ADAPTER_RUBRICS)).toBe(true)
  })

  it('Part 19: no copy of the rubric remains at the old legacy path', () => {
    expect(existsSync(LEGACY_RUBRICS_OLD)).toBe(false)
  })

  it('legacy reviewer is structurally why it cannot move yet — it imports getAnthropicClient', () => {
    const src = readFileSync(LEGACY_REVIEWER, 'utf-8')
    expect(src).toContain('getAnthropicClient')
  })

  it('legacy reviewer imports DapStageGate from cb-control-center (carry-forward dependency)', () => {
    const src = readFileSync(LEGACY_REVIEWER, 'utf-8')
    expect(src).toContain("from './dapStageGates'")
  })

  it('legacy reviewer now imports the rubric from the adapter zone (Part 19)', () => {
    const src = readFileSync(LEGACY_REVIEWER, 'utf-8')
    expect(src).toContain("from '@/lib/cbcc/adapters/dap/dapStageRubrics'")
    expect(src).not.toContain("from './dapStageRubrics'")
  })

  it('legacy reviewer is still read-only (no supabase / approval-store coupling)', () => {
    const src = readFileSync(LEGACY_REVIEWER, 'utf-8')
    expect(src).not.toMatch(/supabase|getSupabaseAdminClient/)
    expect(src).not.toMatch(/dapStageApprovalStore|approveDapStage|store\.approve/)
  })
})

// ─── Group 2: adapter folder remains pure ────────────────────────────────────
//
// Mirrors and re-asserts the purity rules from `dapAdapter.test.ts` and
// `dapStagePart7.test.ts` so the architectural intent is co-located with
// the Part 13 narrative. If this group ever fails, a future part has either
// drifted the adapter folder away from its purity contract or quietly
// added a forbidden dependency.
//
// Part 19 rephrasing: the previous symbol-name bans on `dapStageRubrics` /
// `DapStageRubric` were removed because they were a coincidence of the
// rubric file living outside the adapter — they prevented a pure-data file
// from moving to its correct architectural home. The architectural rule
// the suite actually wants to protect is "the adapter zone may not depend
// on legacy `lib/cb-control-center/` runtime code." That rule is enforced
// here by a path-based ban (`cb-control-center` import) plus the runtime
// markers below, and is mirrored by `dapAdapter.test.ts`.
//
// Symbol-name bans are kept ONLY for tokens that uniquely name runtime
// behavior the adapter must never carry: `dapStageReviewer`, `reviewStage`,
// and `StageAiReview` (legacy UI shape that comes back from the Anthropic
// transport). Pure data type names like `DapStageRubric` are no longer
// banned — type names are not a runtime risk.

const ADAPTER_FORBIDDEN: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /@anthropic-ai\/sdk/,                  label: '@anthropic-ai/sdk' },
  { pattern: /\bgetAnthropicClient\b/,              label: 'getAnthropicClient' },
  { pattern: /\bfetch\s*\(/,                        label: 'fetch(' },
  { pattern: /\bsupabase\b/i,                       label: 'supabase' },
  { pattern: /from ['"]next\//,                     label: 'next/ import' },
  { pattern: /from ['"]react['"]/,                  label: 'react import' },
  { pattern: /['"]use server['"]/,                  label: "'use server'" },
  { pattern: /['"]use client['"]/,                  label: "'use client'" },
  // The architectural invariant: adapter may not depend on the legacy
  // app-layer folder. This single path ban is what protects the boundary;
  // the symbol-name bans below are kept only for runtime-behavior tokens
  // that have no legitimate place in an adapter.
  { pattern: /cb-control-center/,                   label: 'cb-control-center import' },
  { pattern: /dapStageReviewer/,                    label: 'dapStageReviewer reference' },
  { pattern: /\bStageAiReview\b/,                   label: 'StageAiReview reference' },
  { pattern: /\breviewStage\b/,                     label: 'reviewStage reference' },
]

describe('Part 13 — Group 2: lib/cbcc/adapters/dap/ remains pure', () => {
  for (const file of listAdapterImplFiles()) {
    const name = file.split('/').pop()!
    const src = stripComments(readFileSync(file, 'utf-8'))
    for (const { pattern, label } of ADAPTER_FORBIDDEN) {
      it(`adapters/dap/${name} does not contain ${label}`, () => {
        expect(src, `${name} matched ${label}`).not.toMatch(pattern)
      })
    }
  }
})

// ─── Group 3: generic engine root has no DAP review surface ────────────────

describe('Part 13 — Group 3: generic engine root stays vertical-neutral', () => {
  it('no engine-root .ts file imports dapStageReviewer or dapStageRubrics', () => {
    for (const file of listEngineRootImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${file} must not import DAP reviewer/rubric`).not.toMatch(
        /dapStageReviewer|dapStageRubrics/,
      )
    }
  })

  it('no engine-root .ts file references DAP-specific review symbols', () => {
    for (const file of listEngineRootImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${file} must not reference DAP review symbols`).not.toMatch(
        /reviewStage|DapStageRubric|StageAiReview/,
      )
    }
  })

  it('lib/cbcc/index.ts barrel does not export DAP reviewer/rubric or symbols', () => {
    const src = readFileSync(resolve(ENGINE_ROOT, 'index.ts'), 'utf-8')
    expect(src).not.toMatch(/dapStageReviewer|dapStageRubrics/)
    expect(src).not.toMatch(/reviewStage|DapStageRubric|StageAiReview|StageAiChecklistResult/)
    expect(src).not.toMatch(/adapters\/dap/)
  })
})

// ─── Group 4: importers still wire to the legacy reviewer ──────────────────

describe('Part 13 — Group 4: importers still wire to the legacy reviewer', () => {
  it('API route imports the reviewer from lib/cb-control-center', () => {
    const src = readFileSync(ROUTE_FILE, 'utf-8')
    expect(src).toContain("from '@/lib/cb-control-center/dapStageReviewer'")
  })

  it('API route test mocks + imports the reviewer from lib/cb-control-center', () => {
    const src = readFileSync(ROUTE_TEST_FILE, 'utf-8')
    expect(src).toContain("vi.mock('@/lib/cb-control-center/dapStageReviewer'")
    expect(src).toContain("from '@/lib/cb-control-center/dapStageReviewer'")
  })

  it('StageAiReviewPanel imports the reviewer types from lib/cb-control-center', () => {
    const src = readFileSync(REVIEW_PANEL, 'utf-8')
    expect(src).toContain("from '@/lib/cb-control-center/dapStageReviewer'")
  })

  it('no importer points at lib/cbcc/adapters/dap/dapStageReviewer (premature relocation)', () => {
    for (const file of [ROUTE_FILE, ROUTE_TEST_FILE, REVIEW_PANEL]) {
      const src = readFileSync(file, 'utf-8')
      expect(src).not.toContain('@/lib/cbcc/adapters/dap/dapStageReviewer')
    }
  })
})
