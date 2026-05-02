import { describe, it, expect } from 'vitest'
import {
  canApproveStage,
  canRejectStage,
  applyStageApproval,
  applyStageRejection,
  getApprovalState,
  canApproveStageWithEvidence,
} from './stageApproval'
import type {
  CbccEvidenceEntry,
  CbccEvidenceRequirement,
  CbccProject,
  CbccStage,
  CbccStageStatus,
} from './types'

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

// ─── Part 10: canApproveStageWithEvidence ────────────────────────────────────

function makeEntry(
  overrides: Partial<CbccEvidenceEntry> & Pick<CbccEvidenceEntry, 'id' | 'projectId' | 'stageId'>,
): CbccEvidenceEntry {
  return {
    type: 'file',
    status: 'valid',
    title: overrides.id,
    createdAt: NOW,
    ...overrides,
  } as CbccEvidenceEntry
}

const REQ_TRUTH: CbccEvidenceRequirement = {
  id: 'truth_schema',
  type: 'file',
  title: 'Truth Schema artifact',
  required: true,
}

describe('canApproveStageWithEvidence — evidence-gated approval (Part 10)', () => {
  it('returns ok when stage exists, is unlocked, and required evidence is present', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const evidence = [makeEntry({ id: 'truth_schema', projectId: 'p', stageId: 's2' })]
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(true)
    expect(result.missingEvidence).toHaveLength(0)
  })

  it('returns stage_not_found when stageId does not match any stage', () => {
    const p = makeProject([makeStage('s1', 1)])
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 'nope',
      evidence: [],
      requirements: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('stage_not_found')
  })

  it('returns stage_locked when predecessor is not approved', () => {
    const p = makeProject([
      makeStage('s1', 1, 'in_progress'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const evidence = [makeEntry({ id: 'truth_schema', projectId: 'p', stageId: 's2' })]
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('stage_locked')
      expect(result.lockReason).toMatch(/predecessor/i)
    }
  })

  it('returns missing_required_evidence and lists the missing requirement', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence: [],
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('missing_required_evidence')
      expect(result.missingEvidence.map(r => r.id)).toEqual(['truth_schema'])
    }
  })

  it('rejects evidence that belongs to another project', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const evidence = [makeEntry({ id: 'truth_schema', projectId: 'OTHER', stageId: 's2' })]
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing_required_evidence')
  })

  it('rejects evidence that belongs to another stage', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const evidence = [makeEntry({ id: 'truth_schema', projectId: 'p', stageId: 's1' })]
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing_required_evidence')
  })

  it('rejects evidence that is not status=valid', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const evidence = [
      makeEntry({ id: 'truth_schema', projectId: 'p', stageId: 's2', status: 'pending' }),
    ]
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing_required_evidence')
  })

  it('does not let an AI-review entry satisfy a non-AI-review requirement (id mismatch)', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    // AI review entry shaped as evidence — different id, so cannot satisfy
    // a 'truth_schema' requirement.
    const evidence = [
      makeEntry({
        id: 'opus_stage_review',
        projectId: 'p',
        stageId: 's2',
        type: 'note',
        title: 'Opus 4.7 Stage Review',
      }),
    ]
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: [REQ_TRUTH],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing_required_evidence')
  })

  it('treats non-required requirements as optional (does not block on missing optional evidence)', () => {
    const p = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const optional: CbccEvidenceRequirement = {
      id: 'optional_thing',
      type: 'note',
      title: 'optional note',
      required: false,
    }
    const result = canApproveStageWithEvidence({
      project: p,
      projectId: 'p',
      stageId: 's2',
      evidence: [],
      requirements: [optional],
    })
    expect(result.ok).toBe(true)
  })

  it('does not mutate inputs', () => {
    const stages = [
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ]
    const project = makeProject(stages)
    const evidence: CbccEvidenceEntry[] = [
      makeEntry({ id: 'truth_schema', projectId: 'p', stageId: 's2' }),
    ]
    const reqs: CbccEvidenceRequirement[] = [REQ_TRUTH]
    const projectSnap = JSON.stringify(project)
    const evidenceSnap = JSON.stringify(evidence)
    const reqsSnap = JSON.stringify(reqs)
    canApproveStageWithEvidence({
      project,
      projectId: 'p',
      stageId: 's2',
      evidence,
      requirements: reqs,
    })
    expect(JSON.stringify(project)).toBe(projectSnap)
    expect(JSON.stringify(evidence)).toBe(evidenceSnap)
    expect(JSON.stringify(reqs)).toBe(reqsSnap)
  })
})
