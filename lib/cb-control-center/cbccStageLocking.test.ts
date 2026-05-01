import { describe, it, expect } from 'vitest'
import { computeStageVisibilities } from './cbccStageLocking'
import type { ProjectStage, CbccProject, CbccStageStatus } from './cbccProjectTypes'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeStages(overrides: Partial<Pick<ProjectStage, 'stageNumber' | 'approved' | 'stageStatus'>>[] = []): Pick<ProjectStage, 'stageNumber' | 'approved' | 'stageStatus'>[] {
  return Array.from({ length: 7 }, (_, i) => {
    const stageNumber = i + 1
    const override = overrides.find(o => o.stageNumber === stageNumber) ?? {}
    return {
      stageNumber,
      approved: false,
      stageStatus: 'locked' as const,
      ...override,
    }
  })
}

function makeProject(charterApproved: boolean): Pick<CbccProject, 'charterApproved'> {
  return { charterApproved }
}

// ─── Group 1: All 7 stages locked before charter approval ────────────────────

describe('Stage locking — Group 1: all stages locked before charter approval', () => {
  const project = makeProject(false)
  const stages = makeStages()
  const result = computeStageVisibilities(project, stages)

  for (let n = 1; n <= 7; n++) {
    it(`Stage ${n} is locked when charter is not approved`, () => {
      const vis = result.find(v => v.stageNumber === n)
      expect(vis).toBeDefined()
      expect(vis!.status).toBe('locked')
    })
  }

  it('all 7 stages return a visibility entry', () => {
    expect(result).toHaveLength(7)
  })

  it('all locked entries carry the charter-not-approved reason', () => {
    result.forEach(v => {
      expect(v.reason).toContain('Step 0 charter not yet approved')
    })
  })
})

// ─── Group 2: Stage 1 available after charter approval, 2–7 locked ──────────

describe('Stage locking — Group 2: Stage 1 available after charter approval, Stages 2–7 locked', () => {
  it('Stage 1 takes its DB stageStatus after charter approval', () => {
    const project = makeProject(true)
    const stages = makeStages([{ stageNumber: 1, stageStatus: 'available', approved: false }])
    const result = computeStageVisibilities(project, stages)
    const stage1 = result.find(v => v.stageNumber === 1)!
    expect(stage1.status).toBe('available')
  })

  it('Stages 2–7 remain locked when only charter is approved and no stages approved', () => {
    const project = makeProject(true)
    const stages = makeStages([{ stageNumber: 1, stageStatus: 'available', approved: false }])
    const result = computeStageVisibilities(project, stages)
    for (let n = 2; n <= 7; n++) {
      const vis = result.find(v => v.stageNumber === n)!
      expect(vis.status).toBe('locked')
    }
  })
})

// ─── Group 3: Sequential unlocking — approving stage k unlocks stage k+1 ────

describe('Stage locking — Group 3: sequential unlocking', () => {
  for (let k = 1; k <= 6; k++) {
    it(`approving stages 1..${k} unlocks stage ${k + 1}`, () => {
      const project = makeProject(true)
      // Stages 1..k are approved; stage k+1 is locked in DB but should unlock
      const overrides: Partial<Pick<ProjectStage, 'stageNumber' | 'approved' | 'stageStatus'>>[] = [
        ...Array.from({ length: k }, (_, i) => ({
          stageNumber: i + 1,
          approved: true,
          stageStatus: 'approved' as CbccStageStatus,
        })),
        { stageNumber: k + 1, approved: false, stageStatus: 'available' as CbccStageStatus },
      ]
      const stages = makeStages(overrides)
      const result = computeStageVisibilities(project, stages)
      const unlocked = result.find(v => v.stageNumber === k + 1)!
      expect(unlocked.status).toBe('available')
    })
  }

  it('stages beyond the approved chain remain locked', () => {
    const project = makeProject(true)
    // Only stage 1 is approved
    const stages = makeStages([
      { stageNumber: 1, approved: true, stageStatus: 'approved' as const },
      { stageNumber: 2, approved: false, stageStatus: 'available' as const },
    ])
    const result = computeStageVisibilities(project, stages)
    // Stage 2 should be available (stage 1 approved)
    expect(result.find(v => v.stageNumber === 2)!.status).toBe('available')
    // Stages 3–7 should be locked
    for (let n = 3; n <= 7; n++) {
      expect(result.find(v => v.stageNumber === n)!.status).toBe('locked')
    }
  })
})

// ─── Group 4: Out-of-order DB approval state → still locked ──────────────────

describe('Stage locking — Group 4: out-of-order DB approval states are ignored', () => {
  it('stage 3 approved in DB but stage 2 not approved → stage 4 is still locked', () => {
    const project = makeProject(true)
    const stages = makeStages([
      { stageNumber: 1, approved: true,  stageStatus: 'approved' as const },
      { stageNumber: 2, approved: false, stageStatus: 'locked' as const },
      { stageNumber: 3, approved: true,  stageStatus: 'approved' as const }, // corrupt DB state
    ])
    const result = computeStageVisibilities(project, stages)
    // Stage 3 must be locked despite DB approved=true (stage 2 not approved)
    expect(result.find(v => v.stageNumber === 3)!.status).toBe('locked')
    // Stage 4 must be locked
    expect(result.find(v => v.stageNumber === 4)!.status).toBe('locked')
  })

  it('stage 5 and 6 approved in DB but chain broken at stage 2 → all locked from 2 onward', () => {
    const project = makeProject(true)
    const stages = makeStages([
      { stageNumber: 1, approved: true,  stageStatus: 'approved' as const },
      { stageNumber: 2, approved: false, stageStatus: 'locked' as const },
      { stageNumber: 5, approved: true,  stageStatus: 'approved' as const },
      { stageNumber: 6, approved: true,  stageStatus: 'approved' as const },
    ])
    const result = computeStageVisibilities(project, stages)
    for (let n = 2; n <= 7; n++) {
      expect(result.find(v => v.stageNumber === n)!.status).toBe('locked')
    }
  })

  it('all stages approved in DB but charter not approved → all locked', () => {
    const project = makeProject(false)
    const stages = makeStages(
      Array.from({ length: 7 }, (_, i) => ({
        stageNumber: i + 1,
        approved: true,
        stageStatus: 'approved' as const,
      }))
    )
    const result = computeStageVisibilities(project, stages)
    result.forEach(v => expect(v.status).toBe('locked'))
  })
})

// ─── Group 5: Named acceptance criteria ──────────────────────────────────────

describe('Stage locking — Group 5: acceptance criteria', () => {
  it('Stage 1 cannot start before Step 0 charter is approved', () => {
    const project = makeProject(false)
    const stages = makeStages([{ stageNumber: 1, stageStatus: 'available', approved: false }])
    const result = computeStageVisibilities(project, stages)
    // Even though DB says stage 1 is 'available', locking logic overrides it
    expect(result.find(v => v.stageNumber === 1)!.status).toBe('locked')
  })

  it('later stages remain locked until prior stage is approved', () => {
    const project = makeProject(true)
    // Stages 1–3 approved, stage 4 available in DB, stages 5–7 locked
    const stages = makeStages([
      { stageNumber: 1, approved: true,  stageStatus: 'approved' as const },
      { stageNumber: 2, approved: true,  stageStatus: 'approved' as const },
      { stageNumber: 3, approved: false, stageStatus: 'awaiting_approval' as const },
      { stageNumber: 4, approved: false, stageStatus: 'available' as const },
    ])
    const result = computeStageVisibilities(project, stages)
    // Stage 3 awaiting_approval — stage 4 should be locked (stage 3 not yet approved)
    expect(result.find(v => v.stageNumber === 3)!.status).toBe('awaiting_approval')
    expect(result.find(v => v.stageNumber === 4)!.status).toBe('locked')
    for (let n = 5; n <= 7; n++) {
      expect(result.find(v => v.stageNumber === n)!.status).toBe('locked')
    }
  })
})
