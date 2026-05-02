/**
 * DAP Stage Review Prompt — pure prompt assembly tests.
 *
 * These assertions live next to the prompt module and exercise the actual
 * builder rather than greping the source string. They include the
 * content-assertions previously asserted against `dapStageReviewer.ts`
 * (truth rules, advisory disclaimer, owner-approval-is-separate note,
 * rubric integration, advisoryNotice / rubric fields in the user payload)
 * — Part 20 moved those concerns to this module.
 */

import { describe, it, expect } from 'vitest'
import {
  DAP_TRUTH_RULES,
  buildDapStageReviewPromptPacket,
  type DapStageReviewPromptInput,
} from './dapStageReviewPrompt'

function fakeInput(overrides: Partial<DapStageReviewPromptInput> = {}): DapStageReviewPromptInput {
  return {
    stageId: 'stage-03-truth-schema',
    stageNumber: 3,
    title: 'Stage 3 — Truth Schema / Compliance / Claims Lock',
    status: 'awaiting_owner_approval',
    requirements: ['All 7 truth rules defined and locked'],
    requiredApprovals: ['All 7 truth rules accepted'],
    blockers: [],
    implementationEvidence: { branch: 'main' },
    artifact: { type: 'truth_schema' },
    ...overrides,
  }
}

// ─── Group 1: DAP_TRUTH_RULES integrity ─────────────────────────────────────

describe('DAP_TRUTH_RULES', () => {
  it('declares exactly 7 truth rules', () => {
    expect(DAP_TRUTH_RULES.length).toBe(7)
  })

  it('declares each canonical "DAP does not …" assertion', () => {
    expect(DAP_TRUTH_RULES).toContain('DAP is not dental insurance')
    expect(DAP_TRUTH_RULES).toContain('DAP does not process claims')
    expect(DAP_TRUTH_RULES).toContain('DAP does not collect PHI')
    expect(DAP_TRUTH_RULES).toContain('DAP does not set practice pricing')
    expect(DAP_TRUTH_RULES).toContain('DAP does not guarantee savings')
    expect(DAP_TRUTH_RULES).toContain('DAP does not guarantee universal availability')
    expect(DAP_TRUTH_RULES).toContain('DAP does not pay dental providers')
  })
})

// ─── Group 2: System prompt content ─────────────────────────────────────────

describe('buildDapStageReviewPromptPacket — system prompt', () => {
  it('threads every DAP truth rule into the prompt', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    for (const rule of DAP_TRUTH_RULES) {
      expect(systemPrompt).toContain(rule)
    }
  })

  it('includes the explicit advisory disclaimer', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    expect(systemPrompt.toLowerCase()).toContain('advisory only')
  })

  it('includes the explicit "owner approval is separate" note', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    expect(systemPrompt.toLowerCase()).toContain('owner approval')
    expect(systemPrompt.toLowerCase()).toContain('separate')
  })

  it('includes the anti-bypass rule', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    expect(systemPrompt).toMatch(/ANTI-BYPASS RULE/)
  })

  it('includes the JSON response shape contract', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    expect(systemPrompt).toContain('"recommendation"')
    expect(systemPrompt).toContain('"confidence"')
    expect(systemPrompt).toContain('"reasoning"')
    expect(systemPrompt).toContain('"checklistResults"')
  })

  it('threads the per-stage rubric block in when one is registered', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput({ stageNumber: 3 }))
    // Stage 3 has a registered rubric (truth-schema rubric).
    expect(systemPrompt).toMatch(/STAGE 3 RUBRIC/)
  })

  it('emits the no-rubric fallback string for unknown stage numbers', () => {
    const { systemPrompt } = buildDapStageReviewPromptPacket(fakeInput({ stageNumber: 99 }))
    expect(systemPrompt).toMatch(/No stage-specific rubric registered/)
  })
})

// ─── Group 3: User prompt JSON payload ──────────────────────────────────────

describe('buildDapStageReviewPromptPacket — user payload', () => {
  it('parses as JSON', () => {
    const { userPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    expect(() => JSON.parse(userPrompt)).not.toThrow()
  })

  it('includes advisoryNotice and rubric fields explicitly', () => {
    // Source-string substring guarantees the keys are emitted regardless
    // of value (mirrors the pre-Part-20 reviewer.test.ts assertion).
    const { userPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    expect(userPrompt).toContain('"advisoryNotice"')
    expect(userPrompt).toContain('"rubric"')
  })

  it('echoes the gate fields the reviewer feeds in', () => {
    const input = fakeInput({
      stageId: 'stage-04-positioning',
      stageNumber: 4,
      title: 'Stage 4 — Positioning',
      status: 'not_started',
      blockers: ['Stage 3 must be approved'],
    })
    const { userPrompt } = buildDapStageReviewPromptPacket(input)
    const parsed = JSON.parse(userPrompt) as Record<string, unknown>
    expect(parsed.stageId).toBe('stage-04-positioning')
    expect(parsed.stageNumber).toBe(4)
    expect(parsed.title).toBe('Stage 4 — Positioning')
    expect(parsed.status).toBe('not_started')
    expect(parsed.blockers).toEqual(['Stage 3 must be approved'])
  })

  it('declares the project slug exactly as the legacy reviewer did', () => {
    const { userPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    const parsed = JSON.parse(userPrompt) as Record<string, unknown>
    expect(parsed.projectSlug).toBe('dental-advantage-plan')
  })

  it('replaces a missing artifact with null (not undefined)', () => {
    const { userPrompt } = buildDapStageReviewPromptPacket(
      fakeInput({ artifact: undefined }),
    )
    const parsed = JSON.parse(userPrompt) as Record<string, unknown>
    expect(parsed).toHaveProperty('artifact')
    expect(parsed.artifact).toBeNull()
  })

  it('exposes all 7 truth rules in the structured payload', () => {
    const { userPrompt } = buildDapStageReviewPromptPacket(fakeInput())
    const parsed = JSON.parse(userPrompt) as { truthRules: string[] }
    expect(parsed.truthRules).toEqual(DAP_TRUTH_RULES)
  })

  it('exposes the stage-specific rubric in the structured payload when one exists', () => {
    const { userPrompt } = buildDapStageReviewPromptPacket(fakeInput({ stageNumber: 3 }))
    const parsed = JSON.parse(userPrompt) as { rubric: { stageNumber: number } | null }
    expect(parsed.rubric).not.toBeNull()
    expect(parsed.rubric!.stageNumber).toBe(3)
  })

  it('emits rubric=null when no rubric is registered for the stage', () => {
    const { userPrompt } = buildDapStageReviewPromptPacket(fakeInput({ stageNumber: 99 }))
    const parsed = JSON.parse(userPrompt) as { rubric: unknown }
    expect(parsed.rubric).toBeNull()
  })
})

// ─── Group 4: Determinism ───────────────────────────────────────────────────

describe('buildDapStageReviewPromptPacket — pure function', () => {
  it('is deterministic for identical input', () => {
    const input = fakeInput()
    const a = buildDapStageReviewPromptPacket(input)
    const b = buildDapStageReviewPromptPacket(input)
    expect(a.systemPrompt).toBe(b.systemPrompt)
    expect(a.userPrompt).toBe(b.userPrompt)
  })
})
