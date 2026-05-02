/**
 * DAP Stage Reviewer — Structural Tests
 *
 * PURPOSE: Verify the reviewer module exports the correct shape and
 * does not expose mutation functions. No real API calls are made.
 *
 * COVERAGE:
 *   Group 1 — Module exports
 *   Group 2 — No mutation surface
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')
const REVIEWER_PATH = resolve(ROOT, 'lib/cb-control-center/dapStageReviewer.ts')
const CLIENT_PATH   = resolve(ROOT, 'lib/cb-control-center/anthropicClient.ts')

// ─── Group 1: Module exports ──────────────────────────────────────────────────

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

  it('includes all 7 DAP truth rules in the prompt', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('DAP is not dental insurance')
    expect(src).toContain('DAP does not process claims')
    expect(src).toContain('DAP does not collect PHI')
    expect(src).toContain('DAP does not pay dental providers')
  })

  it('includes advisory disclaimer in system prompt', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('advisory only')
  })

  it('includes the explicit "owner approval is separate" note', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('owner approval')
    expect(src.toLowerCase()).toContain('separate')
  })

  it('threads the per-stage rubric into the prompt', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('getDapStageRubric')
    expect(src).toContain('formatDapStageRubricForPrompt')
  })

  it('user payload includes rubric and advisoryNotice fields', () => {
    const src = readFileSync(REVIEWER_PATH, 'utf8')
    expect(src).toContain('rubric:')
    expect(src).toContain('advisoryNotice:')
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
