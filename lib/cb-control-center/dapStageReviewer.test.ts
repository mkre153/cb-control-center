/**
 * DAP Stage Reviewer — Structural Tests (runtime-only after Part 20).
 *
 * PURPOSE: Verify the reviewer module exports the correct shape and
 * does not expose mutation functions. No real API calls are made.
 *
 * Part 20: prompt-content assertions (truth rules, advisory disclaimer,
 * owner-approval-is-separate, rubric threading, advisoryNotice / rubric
 * fields) moved to
 * `lib/cbcc/adapters/dap/dapStageReviewPrompt.test.ts` because the prompt
 * is built there. Runtime concerns (SDK model name, function export, no
 * mutation surface, anthropicClient lazy singleton) stay here.
 *
 * COVERAGE:
 *   Group 1 — Module exports + runtime wiring
 *   Group 2 — No mutation surface
 *   Group 3 — Adapter-zone prompt boundary (Part 20 wiring check)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')
const REVIEWER_PATH = resolve(ROOT, 'lib/cb-control-center/dapStageReviewer.ts')
const CLIENT_PATH   = resolve(ROOT, 'lib/cb-control-center/anthropicClient.ts')

// ─── Group 1: Module exports + runtime wiring ───────────────────────────────

describe('Group 1 — dapStageReviewer module exports', () => {
  it('dapStageReviewer.ts exists', () => {
    expect(existsSync(REVIEWER_PATH)).toBe(true)
  })

  it('exports reviewStage function', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*reviewStage|export.*reviewStage/)
  })

  it('exports StageAiReview interface', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('StageAiReview')
  })

  it('StageAiReview has recommendation field', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('recommendation')
    expect(src).toContain("'approve'")
    expect(src).toContain("'disapprove'")
    expect(src).toContain("'request_revision'")
  })

  it('StageAiReview has confidence field', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('confidence')
    expect(src).toContain("'high'")
    expect(src).toContain("'medium'")
    expect(src).toContain("'low'")
  })

  it('StageAiReview has reasoning field', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('reasoning')
  })

  it('StageAiReview has checklistResults field', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('checklistResults')
  })

  it('uses claude-opus-4-7 model', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('claude-opus-4-7')
  })
})

// ─── Group 2: No mutation surface ────────────────────────────────────────────

describe('Group 2 — Reviewer is read-only', () => {
  it('reviewer does not import supabase (no DB writes)', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).not.toContain('supabase')
    expect(src).not.toContain('getSupabaseAdminClient')
  })

  it('reviewer does not export any mutation functions', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).not.toMatch(/^export.*function.*(update|approve|reject|delete|create|set|mark)/im)
  })

  it('anthropicClient.ts exists', () => {
    expect(existsSync(CLIENT_PATH)).toBe(true)
  })

  it('anthropicClient uses lazy singleton pattern', () => {
    const src = readFileSync(CLIENT_PATH, 'utf8')
    expect(src).toContain('getAnthropicClient')
    expect(src).toContain('ANTHROPIC_API_KEY')
  })

  it('anthropicClient does not expose the API key at import time', () => {
    const src = readFileSync(CLIENT_PATH, 'utf8')
    // Key must be read inside the function, not at module level
    expect(src).not.toMatch(/^const.*ANTHROPIC_API_KEY/m)
  })
})

// ─── Group 3: Adapter-zone prompt boundary (Part 20) ────────────────────────

describe('Group 3 — Reviewer delegates prompt assembly to the adapter (Part 20)', () => {
  const src = readFileSync(REVIEWER_PATH, 'utf8')

  it('imports the prompt builder from the adapter prompt module', () => {
    expect(src).toContain("from '@/lib/cbcc/adapters/dap/dapStageReviewPrompt'")
    expect(src).toContain('buildDapStageReviewPromptPacket')
  })

  it('does not redeclare DAP_TRUTH_RULES locally', () => {
    expect(src).not.toMatch(/^(?:export\s+)?const\s+DAP_TRUTH_RULES\b/m)
  })

  it('does not assemble the system prompt string locally', () => {
    // The pre-Part-20 file embedded the system prompt as a template
    // literal inline. After the split, no auditor / advisory text should
    // remain in the runtime layer — those strings live in the adapter.
    expect(src).not.toMatch(/You are a DAP build process auditor/)
    expect(src).not.toMatch(/ANTI-BYPASS RULE/)
  })

  it('does not assemble the user payload locally', () => {
    expect(src).not.toMatch(/advisoryNotice:/)
    expect(src).not.toMatch(/getDapStageRubric|formatDapStageRubricForPrompt/)
  })
})
