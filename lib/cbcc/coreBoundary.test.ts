// Core boundary tests — Part 4C
//
// These tests defend the generic CBCC engine boundary at the source level.
// They scan implementation files in lib/cbcc/ for forbidden imports, forbidden
// export names, and vertical-specific language. Test files are deliberately
// excluded from the vertical-language scan because test descriptions
// reasonably mention forbidden words to assert their absence.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'

const ROOT = __dirname

function listImplFiles(): string[] {
  return readdirSync(ROOT)
    .filter(name => name.endsWith('.ts'))
    .filter(name => !name.endsWith('.test.ts'))
    .map(name => resolve(ROOT, name))
}

function listAllSourceFiles(): string[] {
  return readdirSync(ROOT)
    .filter(name => name.endsWith('.ts'))
    .map(name => resolve(ROOT, name))
}

function read(file: string): string {
  return readFileSync(file, 'utf-8')
}

// Strip /* ... */ block comments and `//` line comments so prose like
// "this module does not import supabase" doesn't trip the runtime-dependency
// scans below. Source code without comments is what we actually care about.
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

// ─── 1. Forbidden runtime dependencies ───────────────────────────────────────
//
// These never belong inside the generic engine:
//   - real AI SDKs (Anthropic, OpenAI)
//   - any direct AI client constructor or fetch() call
//   - Supabase
//   - Next.js framework imports
//   - React
//   - Server/client directives

const FORBIDDEN_DEPS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /@anthropic-ai\/sdk/,                 label: '@anthropic-ai/sdk' },
  { pattern: /from ['"]openai['"]/i,               label: 'openai' },
  { pattern: /\bgetAnthropicClient\b/,             label: 'getAnthropicClient' },
  { pattern: /\bfetch\s*\(/,                       label: 'fetch(' },
  { pattern: /\bsupabase\b/i,                      label: 'supabase' },
  { pattern: /from ['"]next\//,                    label: 'next/' },
  { pattern: /from ['"]react['"]/,                 label: 'react' },
  { pattern: /['"]use server['"]/,                 label: "'use server'" },
  { pattern: /['"]use client['"]/,                 label: "'use client'" },
]

describe('Core boundary — implementation files contain no forbidden dependencies', () => {
  for (const file of listImplFiles()) {
    const name = basename(file)
    const src = stripComments(read(file))
    for (const { pattern, label } of FORBIDDEN_DEPS) {
      it(`lib/cbcc/${name} does not contain "${label}"`, () => {
        expect(src, `${name} matched ${label}`).not.toMatch(pattern)
      })
    }
  }
})

// ─── 2. Forbidden mutation-authority export names ────────────────────────────
//
// The engine never exports anything that suggests it can mutate stage state
// or persist things. Pure helpers and read models only.
//
// Note: substring match is intentional — both `approveStage` and
// `applyStageApproval` would be problematic if they wrote anything. The
// existing approval primitives are pure (return new objects), so they pass:
// `applyStageApproval` does not contain `approveStage` literally.

const FORBIDDEN_EXPORT_SUBSTRINGS: ReadonlyArray<string> = [
  'approveStage',
  'unlockStage',
  'persist',
  'commit',
  'updateStage',
  // Standalone "write" — checked separately to avoid false positives like
  // "writeFile" in test helpers (none of which we ship from lib/cbcc).
]

async function listEngineExports(): Promise<ReadonlyArray<string>> {
  // Dynamically import the public barrel; collect every exported name.
  const mod = await import('./index')
  return Object.keys(mod)
}

describe('Core boundary — public exports contain no mutation-authority names', () => {
  it('public barrel exports something (sanity)', async () => {
    const names = await listEngineExports()
    expect(names.length).toBeGreaterThan(0)
  })

  it('no exported name contains a forbidden mutation substring', async () => {
    const names = await listEngineExports()
    for (const name of names) {
      for (const forbidden of FORBIDDEN_EXPORT_SUBSTRINGS) {
        expect(name, `forbidden mutation-style export: ${name}`).not.toContain(forbidden)
      }
    }
  })

  // Standalone `write` check — match as a word boundary to allow legitimate
  // identifiers that happen to contain the substring (none today, but
  // future-proofs the rule against false positives).
  it('no exported name is a write/persist verb on its own', async () => {
    const names = await listEngineExports()
    const verbRe = /^(write|persist|commit)/i
    for (const name of names) {
      expect(name, `forbidden write-style export: ${name}`).not.toMatch(verbRe)
    }
  })
})

// ─── 3. Forbidden vertical-specific language in implementation files ─────────
//
// We intentionally exclude `provider` from the vertical word list because the
// engine ships a generic AI provider abstraction (CbccAiReviewProvider). The
// 6 remaining words are healthcare-specific; they alone reliably catch any
// vertical leakage because "provider" never appears in a healthcare context
// without one of them.

const FORBIDDEN_VERTICAL_PATTERNS: ReadonlyArray<{ re: RegExp; label: string }> = [
  { re: /\bdap\b/i,           label: 'dap' },
  { re: /\bdental\b/i,        label: 'dental' },
  { re: /\binsurance\b/i,     label: 'insurance' },
  { re: /\bpatient(s)?\b/i,   label: 'patient' },
  { re: /\bpractice(s)?\b/i,  label: 'practice' },
  { re: /\bmembership(s)?\b/i, label: 'membership' },
]

describe('Core boundary — implementation files are free of vertical language', () => {
  for (const file of listImplFiles()) {
    const name = basename(file)
    // Strip comments here too — the goal is "no vertical leakage in code",
    // and a doc comment that says "no DAP-specific logic" is fine.
    const src = stripComments(read(file))
    for (const { re, label } of FORBIDDEN_VERTICAL_PATTERNS) {
      it(`lib/cbcc/${name} does not contain "${label}"`, () => {
        expect(src, `${name} matched ${re}`).not.toMatch(re)
      })
    }
  }
})

// ─── 4. Test files do not import a real AI SDK / Supabase / Next either ──────
//
// Source-content scans are weaker for tests (descriptions may mention
// forbidden words), but tests must not actually pull in restricted runtimes.
// We only check import statements here.

describe('Core boundary — test files do not import restricted runtimes', () => {
  for (const file of listAllSourceFiles().filter(f => f.endsWith('.test.ts'))) {
    const name = basename(file)
    const src = read(file)
    const RESTRICTED_IMPORTS: ReadonlyArray<{ re: RegExp; label: string }> = [
      { re: /from ['"]@anthropic-ai\/sdk['"]/, label: '@anthropic-ai/sdk import' },
      { re: /from ['"]openai['"]/i,            label: 'openai import' },
      { re: /from ['"]@supabase/i,             label: '@supabase import' },
      { re: /from ['"]next\//,                 label: 'next/ import' },
      { re: /from ['"]react['"]/,              label: 'react import' },
    ]
    for (const { re, label } of RESTRICTED_IMPORTS) {
      it(`lib/cbcc/${name} does not import ${label}`, () => {
        expect(src, `${name} matched ${re}`).not.toMatch(re)
      })
    }
  }
})

// ─── 5. The public barrel re-exports the expected modules ────────────────────

describe('Core boundary — public barrel surface', () => {
  it('exports core engine primitives that downstream code depends on', async () => {
    const names = await listEngineExports()
    // Spot-check a few signature exports from each module so an accidental
    // delete would be caught here. This is not an allowlist of every export
    // — just the load-bearing ones.
    const REQUIRED = [
      // stageLocking
      'isStageLocked',
      'getStageLockReason',
      'getNextStage',
      'canUnlockStage',
      // stageApproval
      'applyStageApproval',
      'applyStageRejection',
      'getApprovalState',
      // evidenceLedger
      'createEvidenceEntry',
      'appendEvidence',
      'validateStageEvidence',
      'hasRequiredEvidence',
      // stagePageModel
      'buildStagePageModel',
      'CbccStagePageModelMismatchError',
      // aiReview
      'buildCbccAiReviewPromptPacket',
      'normalizeCbccAiReviewResult',
      'CBCC_AI_REVIEW_NOT_REQUESTED',
      // aiReviewProvider
      'runCbccAiReview',
      'CbccAiReviewProviderError',
      'CbccAiReviewNormalizationError',
      // adapters
      'EMPTY_ADAPTER_REGISTRY',
      'registerAdapter',
      'isProjectAdapter',
      // projectRegistry
      'registerProject',
      'getRegisteredProject',
    ]
    for (const name of REQUIRED) {
      expect(names, `missing required export: ${name}`).toContain(name)
    }
  })
})
