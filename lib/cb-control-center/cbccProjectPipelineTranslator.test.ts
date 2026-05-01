import { describe, it, expect } from 'vitest'
import {
  mapEngineStatusToV2,
  translateDapProjectForPipeline,
  translateEngineProjectToV2,
  TRANSLATOR_DAP_PROJECT_ID,
} from './cbccProjectPipelineTranslator'
import { DAP_PROJECT, DAP_PROJECT_SLUG } from '@/lib/cbcc/adapters/dap'
import { computeStageVisibilities } from './cbccStageLocking'

describe('mapEngineStatusToV2', () => {
  it('maps engine statuses to the 5-state v2 enum', () => {
    expect(mapEngineStatusToV2('approved')).toBe('approved')
    expect(mapEngineStatusToV2('awaiting_owner_approval')).toBe('awaiting_approval')
    expect(mapEngineStatusToV2('in_progress')).toBe('in_progress')
    expect(mapEngineStatusToV2('not_started')).toBe('available')
    expect(mapEngineStatusToV2('locked')).toBe('locked')
    expect(mapEngineStatusToV2('rejected')).toBe('locked')
    expect(mapEngineStatusToV2('blocked')).toBe('locked')
  })
})

describe('translateDapProjectForPipeline — v2-shaped project', () => {
  const { project, stages } = translateDapProjectForPipeline()

  it('exports the canonical DAP project id', () => {
    expect(TRANSLATOR_DAP_PROJECT_ID).toBe(DAP_PROJECT.id)
  })

  it('preserves engine project identity in the v2 project shape', () => {
    expect(project.id).toBe(DAP_PROJECT.id)
    expect(project.slug).toBe(DAP_PROJECT_SLUG)
    expect(project.name).toBe(DAP_PROJECT.name)
  })

  it('marks charterApproved=true because Stage 1 is engine-approved', () => {
    expect(project.charterApproved).toBe(true)
    expect(project.charterApprovedAt).toBeTruthy()
    expect(project.projectStatus).toBe('in_progress')
  })

  it('synthesizes a non-null charterJson so Step 0 renders as approved', () => {
    expect(project.charterJson).not.toBeNull()
    expect(project.charterJson?.whatThisIs).toBeTruthy()
  })
})

describe('translateDapProjectForPipeline — v2-shaped stage rows', () => {
  const { stages } = translateDapProjectForPipeline()

  it('returns exactly 7 stage rows', () => {
    expect(stages.length).toBe(7)
    expect(stages.map(s => s.stageNumber)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('Stage 1 row reflects engine approval', () => {
    const s1 = stages.find(s => s.stageNumber === 1)!
    expect(s1.approved).toBe(true)
    expect(s1.stageStatus).toBe('approved')
    expect(s1.approvedAt).toBeTruthy()
    expect(s1.approvedBy).toBeTruthy()
  })

  it('Stages 2–7 are not approved', () => {
    for (const n of [2, 3, 4, 5, 6, 7]) {
      const s = stages.find(x => x.stageNumber === n)!
      expect(s.approved).toBe(false)
      expect(s.approvedAt).toBeNull()
    }
  })

  it('every row carries the canonical engine stageKey', () => {
    const expected = ['definition', 'discovery', 'truth-schema', 'positioning', 'content-strategy', 'architecture', 'build-launch']
    for (let i = 0; i < 7; i++) {
      expect(stages[i].stageKey).toBe(expected[i])
    }
  })
})

describe('translateDapProjectForPipeline — feeds v2 visibility computation correctly', () => {
  it('with charter approved: Stage 1 approved, Stage 2 available, Stages 3–7 locked', () => {
    const { project, stages } = translateDapProjectForPipeline()
    const visibilities = computeStageVisibilities(project, stages)

    expect(visibilities.find(v => v.stageNumber === 1)?.status).toBe('approved')
    expect(visibilities.find(v => v.stageNumber === 2)?.status).toBe('available')
    for (const n of [3, 4, 5, 6, 7]) {
      expect(visibilities.find(v => v.stageNumber === n)?.status).toBe('locked')
    }
  })
})

describe('translateEngineProjectToV2 — generic regression', () => {
  it('handles a project where Stage 1 is not yet approved (charterApproved=false)', () => {
    const draft = {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s =>
        s.order === 1 ? { ...s, status: 'not_started' as const, approval: undefined } : s,
      ),
    }
    const { project, stages } = translateEngineProjectToV2(draft)
    expect(project.charterApproved).toBe(false)
    expect(project.projectStatus).toBe('step_0_charter_ready')
    const s1 = stages.find(s => s.stageNumber === 1)!
    expect(s1.approved).toBe(false)
    expect(s1.stageStatus).toBe('available')
  })
})
