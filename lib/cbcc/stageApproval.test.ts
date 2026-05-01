import { describe, it, expect } from 'vitest'
import {
  canApproveStage,
  canRejectStage,
  applyStageApproval,
  applyStageRejection,
  getApprovalState,
} from './stageApproval'
import type { CbccProject, CbccStage, CbccStageStatus } from './types'

const NOW = '2026-05-01T00:00:00Z'
const LATER = '2026-05-02T00:00:00Z'

function makeStage(id: string, order: number, status: CbccStageStatus = 'awaiting_owner_approval'): CbccStage {
  return { id, order, status }
}

function makeProject(stages: CbccStage[]): CbccProject {
  return {
    id: 'p',
    slug: 'p',
    name: 'P',
    adapterKey: 'generic',
    status: 'active',
    stages,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

const DEC = { decidedBy: 'owner@example.com', decidedAt: LATER }

describe('canApproveStage / canRejectStage', () => {
  it('approves a stage that is awaiting_owner_approval', () => {
    const p = makeProject([makeStage('s1', 1)])
    expect(canApproveStage(p, 's1').ok).toBe(true)
  })

  it('rejects a stage that is awaiting_owner_approval', () => {
    const p = makeProject([makeStage('s1', 1)])
    expect(canRejectStage(p, 's1').ok).toBe(true)
  })

  it('refuses approval when status is not awaiting_owner_approval', () => {
    for (const s of ['not_started', 'locked', 'in_progress', 'approved', 'rejected', 'blocked'] as CbccStageStatus[]) {
      const p = makeProject([makeStage('s1', 1, s)])
      const r = canApproveStage(p, 's1')
      expect(r.ok, `expected refusal for ${s}`).toBe(false)
      expect(r.reason).toMatch(/awaiting_owner_approval/)
    }
  })

  it('refuses for unknown stage id', () => {
    const p = makeProject([makeStage('s1', 1)])
    expect(canApproveStage(p, 'missing').ok).toBe(false)
    expect(canRejectStage(p, 'missing').ok).toBe(false)
  })
})

describe('applyStageApproval', () => {
  it('produces an updated project with the stage approved and decision attached', () => {
    const p = makeProject([makeStage('s1', 1)])
    const r = applyStageApproval(p, 's1', DEC)
    expect(r.ok).toBe(true)
    expect(r.stage?.status).toBe('approved')
    expect(r.stage?.approval).toEqual(DEC)
    expect(r.stage?.rejection).toBeUndefined()
    expect(r.project?.updatedAt).toBe(LATER)
  })

  it('does not mutate the input project', () => {
    const original = makeProject([makeStage('s1', 1)])
    const snapshot = JSON.stringify(original)
    applyStageApproval(original, 's1', DEC)
    expect(JSON.stringify(original)).toBe(snapshot)
  })

  it('refuses when status is wrong and leaves project unchanged', () => {
    const p = makeProject([makeStage('s1', 1, 'in_progress')])
    const r = applyStageApproval(p, 's1', DEC)
    expect(r.ok).toBe(false)
    expect(r.project).toBeUndefined()
  })

  it('refuses when decidedBy / decidedAt is missing', () => {
    const p = makeProject([makeStage('s1', 1)])
    expect(applyStageApproval(p, 's1', { decidedBy: '', decidedAt: LATER }).ok).toBe(false)
    expect(applyStageApproval(p, 's1', { decidedBy: 'x', decidedAt: '' }).ok).toBe(false)
  })
})

describe('applyStageRejection', () => {
  it('produces an updated project with the stage rejected and decision attached', () => {
    const p = makeProject([makeStage('s1', 1)])
    const r = applyStageRejection(p, 's1', DEC)
    expect(r.ok).toBe(true)
    expect(r.stage?.status).toBe('rejected')
    expect(r.stage?.rejection).toEqual(DEC)
    expect(r.stage?.approval).toBeUndefined()
  })

  it('does not mutate the input project', () => {
    const original = makeProject([makeStage('s1', 1)])
    const snapshot = JSON.stringify(original)
    applyStageRejection(original, 's1', DEC)
    expect(JSON.stringify(original)).toBe(snapshot)
  })

  it('clears any prior approval on rejection (sanity guard)', () => {
    const stage: CbccStage = {
      id: 's1',
      order: 1,
      status: 'awaiting_owner_approval',
      approval: { decidedBy: 'old', decidedAt: NOW },
    }
    const p = makeProject([stage])
    const r = applyStageRejection(p, 's1', DEC)
    expect(r.stage?.approval).toBeUndefined()
    expect(r.stage?.rejection).toEqual(DEC)
  })
})

describe('getApprovalState', () => {
  it('returns null for unknown stage', () => {
    const p = makeProject([makeStage('s1', 1)])
    expect(getApprovalState(p, 'missing')).toBeNull()
  })

  it('reflects approved state with decision', () => {
    const p = makeProject([makeStage('s1', 1)])
    const r = applyStageApproval(p, 's1', DEC)
    const state = getApprovalState(r.project!, 's1')!
    expect(state.approved).toBe(true)
    expect(state.rejected).toBe(false)
    expect(state.decision).toEqual(DEC)
  })

  it('reflects rejected state with decision', () => {
    const p = makeProject([makeStage('s1', 1)])
    const r = applyStageRejection(p, 's1', DEC)
    const state = getApprovalState(r.project!, 's1')!
    expect(state.rejected).toBe(true)
    expect(state.approved).toBe(false)
    expect(state.decision).toEqual(DEC)
  })

  it('reflects neutral state when no decision', () => {
    const p = makeProject([makeStage('s1', 1, 'not_started')])
    const state = getApprovalState(p, 's1')!
    expect(state.approved).toBe(false)
    expect(state.rejected).toBe(false)
    expect(state.decision).toBeUndefined()
  })
})
