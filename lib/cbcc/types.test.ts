// CBCC generic engine — types
//
// These tests are mostly compile-time guards expressed as runtime no-ops.
// The point is to fix the public surface of types.ts so future refactors
// can't silently widen or narrow it.

import { describe, it, expect } from 'vitest'
import type {
  CbccApprovalDecision,
  CbccApprovalResult,
  CbccEvidenceItem,
  CbccEvidenceType,
  CbccProject,
  CbccProjectAdapter,
  CbccProjectStatus,
  CbccStage,
  CbccStageDefinition,
  CbccStageId,
  CbccStageRequirement,
  CbccStageStatus,
} from './types'

describe('CbccStageStatus accepts each canonical value', () => {
  const statuses: CbccStageStatus[] = [
    'not_started',
    'locked',
    'in_progress',
    'awaiting_owner_approval',
    'approved',
    'rejected',
    'blocked',
  ]
  it('all 7 statuses round-trip through type', () => {
    expect(statuses.length).toBe(7)
    expect(new Set(statuses).size).toBe(7)
  })
})

describe('CbccProjectStatus accepts each canonical value', () => {
  const statuses: CbccProjectStatus[] = ['draft', 'active', 'paused', 'completed', 'archived']
  it('all 5 statuses round-trip through type', () => {
    expect(statuses.length).toBe(5)
    expect(new Set(statuses).size).toBe(5)
  })
})

describe('CbccEvidenceType covers ledger-portable kinds', () => {
  const types: CbccEvidenceType[] = [
    'file',
    'route',
    'git_commit',
    'git_branch',
    'test',
    'deployment',
    'external_url',
    'note',
  ]
  it('all 8 evidence kinds round-trip through type', () => {
    expect(types.length).toBe(8)
    expect(new Set(types).size).toBe(8)
  })
})

describe('Type structure compiles with minimal valid values', () => {
  it('CbccStageRequirement requires key + label', () => {
    const r: CbccStageRequirement = { key: 'k', label: 'L' }
    expect(r.key).toBe('k')
  })

  it('CbccStageDefinition shape', () => {
    const d: CbccStageDefinition = {
      id: 'stage-1' as CbccStageId,
      order: 1,
      title: 'Stage 1',
      description: 'desc',
      requirements: [],
      requiredApprovals: [],
    }
    expect(d.order).toBe(1)
  })

  it('CbccStage shape', () => {
    const s: CbccStage = {
      id: 'stage-1' as CbccStageId,
      order: 1,
      status: 'not_started',
    }
    expect(s.status).toBe('not_started')
  })

  it('CbccProject shape', () => {
    const p: CbccProject = {
      id: 'p1',
      slug: 'p1',
      name: 'P1',
      adapterKey: 'generic',
      status: 'draft',
      stages: [],
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    }
    expect(p.adapterKey).toBe('generic')
  })

  it('CbccEvidenceItem shape', () => {
    const e: CbccEvidenceItem = { type: 'note', value: 'hello' }
    expect(e.type).toBe('note')
  })

  it('CbccApprovalDecision shape', () => {
    const d: CbccApprovalDecision = {
      decidedBy: 'owner',
      decidedAt: '2026-05-01T00:00:00Z',
    }
    expect(d.decidedBy).toBe('owner')
  })

  it('CbccApprovalResult shape (failure form)', () => {
    const r: CbccApprovalResult = { ok: false, reason: 'because' }
    expect(r.ok).toBe(false)
  })

  it('CbccProjectAdapter is shaped with 5 required methods', () => {
    const a: CbccProjectAdapter = {
      key: 'k',
      getProjectDefinition: () => null,
      getStageDefinitions: () => [],
      getStageArtifact: () => null,
      validateStageArtifact: () => ({ valid: true }),
      getEvidenceForStage: () => [],
    }
    expect(a.key).toBe('k')
  })
})
