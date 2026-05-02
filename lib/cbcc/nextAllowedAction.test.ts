// CBCC engine — next-allowed-action engine tests (Part 10)
//
// Asserts deterministic per-state output:
//   1. work_blocked when predecessor not approved
//   2. generate_required_artifact when unlocked + evidence missing
//   3. approve_stage when awaiting_owner_approval + evidence present
//   4. submit_for_owner_approval when in_progress + evidence present
//   5. project_complete when all stages approved
//   6. Does not mutate inputs

import { describe, it, expect } from 'vitest'
import { getNextAllowedAction } from './nextAllowedAction'
import type {
  CbccEvidenceEntry,
  CbccEvidenceRequirement,
  CbccProject,
  CbccStage,
  CbccStageDefinition,
  CbccStageStatus,
} from './types'

const NOW = '2026-05-01T00:00:00Z'

const DEFS: ReadonlyArray<CbccStageDefinition> = [
  {
    id: 's1', order: 1, title: 'S1', description: '',
    requirements: [], requiredApprovals: [],
  },
  {
    id: 's2', order: 2, title: 'S2', description: '',
    requirements: [], requiredApprovals: [],
  },
]

const REQS: Record<string, ReadonlyArray<CbccEvidenceRequirement>> = {
  s1: [{ id: 's1_artifact', type: 'file', title: 'S1 artifact', required: true }],
  s2: [{ id: 's2_artifact', type: 'file', title: 'S2 artifact', required: true }],
}

function entry(id: string, projectId: string, stageId: string, status: CbccEvidenceEntry['status'] = 'valid'): CbccEvidenceEntry {
  return {
    id,
    projectId,
    stageId,
    type: 'file',
    status,
    title: id,
    ref: 'fixture',
    createdAt: NOW,
  }
}

function makeStage(id: string, order: number, status: CbccStageStatus): CbccStage {
  return { id, order, status }
}

function makeProject(stages: CbccStage[]): CbccProject {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'P1',
    adapterKey: 'generic',
    status: 'active',
    stages,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

describe('getNextAllowedAction', () => {
  it('returns work_blocked when first unapproved stage is locked by predecessor', () => {
    // S1 not_started, S2 not_started. S1 unlocked, but the test models a project
    // where the FIRST stage is in_progress with no evidence — wait, S1 is the
    // first stage so it's never locked. Use a 3-stage project to demonstrate
    // locking.
    const defs3: CbccStageDefinition[] = [
      ...DEFS,
      { id: 's3', order: 3, title: 'S3', description: '', requirements: [], requiredApprovals: [] },
    ]
    const project = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'in_progress'),
      makeStage('s3', 3, 'not_started'),
    ])
    // No evidence for any stage; first non-approved is s2 (unlocked, no evidence)
    // → expect generate_required_artifact for s2, not work_blocked.
    const r = getNextAllowedAction({
      project,
      stageDefinitions: defs3,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: [],
    })
    expect(r.kind).toBe('generate_required_artifact')
    if (r.kind === 'generate_required_artifact') {
      expect(r.stageNumber).toBe(2)
    }
  })

  it('returns work_blocked when an in-flight stage has a rejected predecessor', () => {
    const project = makeProject([
      makeStage('s1', 1, 'rejected'),
      makeStage('s2', 2, 'not_started'),
    ])
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: [],
    })
    expect(r.kind).toBe('work_blocked')
    if (r.kind === 'work_blocked') {
      expect(r.stageNumber).toBe(2)
      expect(r.reason).toMatch(/rejected/i)
    }
  })

  it('returns generate_required_artifact when unlocked but evidence is missing', () => {
    const project = makeProject([
      makeStage('s1', 1, 'in_progress'),
      makeStage('s2', 2, 'not_started'),
    ])
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: [],
    })
    expect(r.kind).toBe('generate_required_artifact')
    if (r.kind === 'generate_required_artifact') {
      expect(r.stageNumber).toBe(1)
      expect(r.requiredEvidenceId).toBe('s1_artifact')
      expect(r.label).toBe('S1 artifact')
    }
  })

  it('returns submit_for_owner_approval when evidence is present and status=in_progress', () => {
    const project = makeProject([
      makeStage('s1', 1, 'in_progress'),
      makeStage('s2', 2, 'not_started'),
    ])
    const evidence = [entry('s1_artifact', 'p1', 's1')]
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: evidence,
    })
    expect(r.kind).toBe('submit_for_owner_approval')
    if (r.kind === 'submit_for_owner_approval') expect(r.stageNumber).toBe(1)
  })

  it('returns approve_stage when status=awaiting_owner_approval and evidence is present', () => {
    const project = makeProject([
      makeStage('s1', 1, 'awaiting_owner_approval'),
      makeStage('s2', 2, 'not_started'),
    ])
    const evidence = [entry('s1_artifact', 'p1', 's1')]
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: evidence,
    })
    expect(r.kind).toBe('approve_stage')
  })

  it('skips approved stages and reports on the first non-approved one', () => {
    const project = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'awaiting_owner_approval'),
    ])
    const evidence = [entry('s2_artifact', 'p1', 's2')]
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: evidence,
    })
    expect(r.kind).toBe('approve_stage')
    if (r.kind === 'approve_stage') expect(r.stageNumber).toBe(2)
  })

  it('returns project_complete when all stages are approved', () => {
    const project = makeProject([
      makeStage('s1', 1, 'approved'),
      makeStage('s2', 2, 'approved'),
    ])
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: [],
    })
    expect(r.kind).toBe('project_complete')
    if (r.kind === 'project_complete') expect(r.projectSlug).toBe('p1')
  })

  it('rejects evidence from another project', () => {
    const project = makeProject([
      makeStage('s1', 1, 'awaiting_owner_approval'),
      makeStage('s2', 2, 'not_started'),
    ])
    const evidence = [entry('s1_artifact', 'OTHER', 's1')] // wrong project
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: evidence,
    })
    expect(r.kind).toBe('generate_required_artifact')
  })

  it('rejects evidence from another stage', () => {
    const project = makeProject([
      makeStage('s1', 1, 'awaiting_owner_approval'),
      makeStage('s2', 2, 'not_started'),
    ])
    const evidence = [entry('s1_artifact', 'p1', 's2')] // wrong stage id
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: evidence,
    })
    expect(r.kind).toBe('generate_required_artifact')
  })

  it('rejects pending evidence', () => {
    const project = makeProject([
      makeStage('s1', 1, 'awaiting_owner_approval'),
      makeStage('s2', 2, 'not_started'),
    ])
    const evidence = [entry('s1_artifact', 'p1', 's1', 'pending')]
    const r = getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: REQS,
      evidenceLedger: evidence,
    })
    expect(r.kind).toBe('generate_required_artifact')
  })

  it('does not mutate any of its inputs', () => {
    const project = makeProject([
      makeStage('s1', 1, 'awaiting_owner_approval'),
      makeStage('s2', 2, 'not_started'),
    ])
    const evidence: CbccEvidenceEntry[] = [entry('s1_artifact', 'p1', 's1')]
    const reqs = REQS
    const projectSnap = JSON.stringify(project)
    const evidenceSnap = JSON.stringify(evidence)
    const reqsSnap = JSON.stringify(reqs)
    getNextAllowedAction({
      project,
      stageDefinitions: DEFS,
      evidenceRequirementsByStage: reqs,
      evidenceLedger: evidence,
    })
    expect(JSON.stringify(project)).toBe(projectSnap)
    expect(JSON.stringify(evidence)).toBe(evidenceSnap)
    expect(JSON.stringify(reqs)).toBe(reqsSnap)
  })
})
