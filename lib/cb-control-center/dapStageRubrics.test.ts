/**
 * DAP Stage Rubrics — Data integrity tests
 *
 * Asserts every stage has a rubric, and the formatter produces a non-empty
 * prompt block. Rubrics are advisory data only — these tests do not assert
 * any approval or persistence semantics.
 */

import { describe, it, expect } from 'vitest'
import {
  DAP_STAGE_RUBRICS,
  getDapStageRubric,
  formatDapStageRubricForPrompt,
} from './dapStageRubrics'

describe('Group 1 — DAP_STAGE_RUBRICS data integrity', () => {
  it('has exactly 7 rubrics', () => {
    expect(DAP_STAGE_RUBRICS).toHaveLength(7)
  })

  it('covers stage numbers 1 through 7 with no gaps or duplicates', () => {
    const numbers = DAP_STAGE_RUBRICS.map(r => r.stageNumber).sort((a, b) => a - b)
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('every rubric has a non-empty headline', () => {
    for (const r of DAP_STAGE_RUBRICS) {
      expect(r.headline.length).toBeGreaterThan(0)
    }
  })

  it('every rubric has at least 2 focus areas', () => {
    for (const r of DAP_STAGE_RUBRICS) {
      expect(r.focusAreas.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('every rubric has at least 2 red flags', () => {
    for (const r of DAP_STAGE_RUBRICS) {
      expect(r.redFlags.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('Group 2 — getDapStageRubric', () => {
  it('returns a rubric for each valid stage number', () => {
    for (let n = 1; n <= 7; n++) {
      const r = getDapStageRubric(n)
      expect(r).toBeDefined()
      expect(r!.stageNumber).toBe(n)
    }
  })

  it('returns undefined for unknown stage numbers', () => {
    expect(getDapStageRubric(0)).toBeUndefined()
    expect(getDapStageRubric(8)).toBeUndefined()
    expect(getDapStageRubric(-1)).toBeUndefined()
  })
})

describe('Group 3 — formatDapStageRubricForPrompt', () => {
  it('produces a string containing the headline, focus areas, and red flags', () => {
    const r = getDapStageRubric(3)!
    const out = formatDapStageRubricForPrompt(r)
    expect(out).toContain('STAGE 3 RUBRIC')
    expect(out).toContain(r.headline)
    expect(out).toContain('Focus areas')
    expect(out).toContain('Red flags')
    for (const f of r.focusAreas) expect(out).toContain(f)
    for (const f of r.redFlags) expect(out).toContain(f)
  })
})

describe('Group 4 — Stage 3 truth-schema coverage', () => {
  it('Stage 3 rubric mentions truth schema and forbidden phrases', () => {
    const r = getDapStageRubric(3)!
    const text = JSON.stringify(r).toLowerCase()
    expect(text).toContain('truth schema')
    expect(text).toContain('forbidden')
  })
})
