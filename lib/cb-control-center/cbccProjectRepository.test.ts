/**
 * CBCC v2 — cbccProjectRepository pure helpers
 *
 * Group 1 — computeMissingStages
 * Group 2 — computeDriftCorrections
 */

import { describe, it, expect } from 'vitest'
import { CBCC_STAGE_DEFINITIONS } from './cbccStageDefinitions'
import {
  computeMissingStages,
  computeDriftCorrections,
} from './cbccProjectRepository'

describe('Group 1 — computeMissingStages', () => {
  it('returns all 7 numbers when nothing exists', () => {
    expect(computeMissingStages([], CBCC_STAGE_DEFINITIONS)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('returns [] when all 7 exist (idempotent)', () => {
    expect(computeMissingStages([1, 2, 3, 4, 5, 6, 7], CBCC_STAGE_DEFINITIONS)).toEqual([])
  })

  it('returns only the missing numbers', () => {
    expect(computeMissingStages([1, 2, 4, 7], CBCC_STAGE_DEFINITIONS)).toEqual([3, 5, 6])
  })

  it('ignores duplicates in existingNumbers', () => {
    expect(computeMissingStages([1, 1, 1, 2, 3], CBCC_STAGE_DEFINITIONS)).toEqual([4, 5, 6, 7])
  })

  it('returns [] when given an out-of-range existingNumbers superset', () => {
    expect(computeMissingStages([1, 2, 3, 4, 5, 6, 7, 99], CBCC_STAGE_DEFINITIONS)).toEqual([])
  })
})

describe('Group 2 — computeDriftCorrections', () => {
  it('returns [] when all rows match canonical keys + titles', () => {
    const existing = CBCC_STAGE_DEFINITIONS.map(d => ({
      stageNumber: d.number,
      stageKey: d.key,
      stageTitle: d.title,
    }))
    expect(computeDriftCorrections(existing, CBCC_STAGE_DEFINITIONS)).toEqual([])
  })

  it('detects a drifted stage_key', () => {
    const existing = [
      { stageNumber: 1, stageKey: 'business-definition', stageTitle: CBCC_STAGE_DEFINITIONS[0].title },
    ]
    const corrections = computeDriftCorrections(existing, CBCC_STAGE_DEFINITIONS)
    expect(corrections).toEqual([
      {
        stageNumber: 1,
        field: 'stage_key',
        before: 'business-definition',
        after: 'definition',
      },
    ])
  })

  it('detects a drifted stage_title', () => {
    const existing = [
      { stageNumber: 3, stageKey: 'truth-schema', stageTitle: 'Stage 3: Old Title' },
    ]
    const corrections = computeDriftCorrections(existing, CBCC_STAGE_DEFINITIONS)
    expect(corrections).toEqual([
      {
        stageNumber: 3,
        field: 'stage_title',
        before: 'Stage 3: Old Title',
        after: CBCC_STAGE_DEFINITIONS[2].title,
      },
    ])
  })

  it('reports both fields when both have drifted', () => {
    const existing = [
      { stageNumber: 5, stageKey: 'seo-aeo-content', stageTitle: 'Old SEO Title' },
    ]
    const corrections = computeDriftCorrections(existing, CBCC_STAGE_DEFINITIONS)
    expect(corrections).toHaveLength(2)
    expect(corrections.find(c => c.field === 'stage_key')).toBeTruthy()
    expect(corrections.find(c => c.field === 'stage_title')).toBeTruthy()
  })

  it('ignores rows whose stageNumber has no canonical definition', () => {
    const existing = [
      { stageNumber: 99, stageKey: 'orphan', stageTitle: 'Orphan' },
    ]
    expect(computeDriftCorrections(existing, CBCC_STAGE_DEFINITIONS)).toEqual([])
  })

  it('reports drift for multiple rows independently', () => {
    const existing = [
      { stageNumber: 1, stageKey: 'business-definition', stageTitle: CBCC_STAGE_DEFINITIONS[0].title },
      { stageNumber: 7, stageKey: 'build-qa-launch', stageTitle: CBCC_STAGE_DEFINITIONS[6].title },
    ]
    const corrections = computeDriftCorrections(existing, CBCC_STAGE_DEFINITIONS)
    expect(corrections.length).toBe(2)
    expect(corrections[0].stageNumber).toBe(1)
    expect(corrections[1].stageNumber).toBe(7)
  })
})
