// CBCC adapter — DAP per-stage required-evidence + approval ledger tests
//
// Asserts:
//   1. DAP_STAGE_REQUIRED_EVIDENCE covers all 7 stages with stable ids
//   2. getDapStageEvidenceRequirements returns CbccEvidenceRequirement[]
//   3. buildDapApprovalEvidenceLedger emits entries only for stages whose
//      artifact is reviewable/approved (Stage 1 + Stage 3 today)
//   4. The emitted ids match the requirement ids (id-level matcher
//      satisfaction)
//   5. Entries are project-scoped to DAP_PROJECT_ID
//   6. The ledger is pure data — no mutation of inputs

import { describe, it, expect } from 'vitest'
import {
  DAP_STAGE_REQUIRED_EVIDENCE,
  getDapStageEvidenceRequirements,
  buildDapApprovalEvidenceLedger,
} from './dapEvidence'
import { DAP_PROJECT_ID } from './dapProject'
import { DAP_STAGE_DEFINITIONS } from './dapStages'
import { canApproveStageWithEvidence } from '../../stageApproval'
import { DAP_PROJECT } from './dapProject'

describe('DAP_STAGE_REQUIRED_EVIDENCE', () => {
  it('covers all 7 stages', () => {
    const keys = Object.keys(DAP_STAGE_REQUIRED_EVIDENCE).map(Number).sort((a, b) => a - b)
    expect(keys).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('every stage has at least one required evidence id', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      expect((DAP_STAGE_REQUIRED_EVIDENCE[n] ?? []).length).toBeGreaterThan(0)
    }
  })

  it('Stage 1 requires business_definition', () => {
    expect(DAP_STAGE_REQUIRED_EVIDENCE[1]).toContain('business_definition')
  })

  it('Stage 3 requires truth_schema', () => {
    expect(DAP_STAGE_REQUIRED_EVIDENCE[3]).toContain('truth_schema')
  })
})

describe('getDapStageEvidenceRequirements', () => {
  it('returns requirements for each stage 1–7', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      const reqs = getDapStageEvidenceRequirements(n)
      expect(reqs.length).toBeGreaterThan(0)
      for (const r of reqs) {
        expect(r.required).toBe(true)
        expect(r.id).toBeTruthy()
        expect(r.type).toBeTruthy()
      }
    }
  })

  it('returns empty for unknown stage numbers', () => {
    expect(getDapStageEvidenceRequirements(0)).toEqual([])
    expect(getDapStageEvidenceRequirements(8)).toEqual([])
  })
})

describe('buildDapApprovalEvidenceLedger', () => {
  it('emits at least one entry for Stage 1 (business_definition is approved)', () => {
    const ledger = buildDapApprovalEvidenceLedger()
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 1)!
    const stage1 = ledger.filter(e => e.stageId === def.id)
    expect(stage1.length).toBeGreaterThan(0)
    expect(stage1[0]!.id).toBe('business_definition')
    expect(stage1[0]!.status).toBe('valid')
    expect(stage1[0]!.projectId).toBe(DAP_PROJECT_ID)
  })

  it('emits at least one entry for Stage 3 (truth_schema is reviewable)', () => {
    const ledger = buildDapApprovalEvidenceLedger()
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 3)!
    const stage3 = ledger.filter(e => e.stageId === def.id)
    expect(stage3.length).toBeGreaterThan(0)
    expect(stage3[0]!.id).toBe('truth_schema')
    expect(stage3[0]!.status).toBe('valid')
  })

  it('emits NOTHING for Stage 2 (placeholder, not_started)', () => {
    const ledger = buildDapApprovalEvidenceLedger()
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 2)!
    expect(ledger.filter(e => e.stageId === def.id)).toHaveLength(0)
  })

  it('emits NOTHING for Stages 4, 5, 6, 7 (placeholders)', () => {
    const ledger = buildDapApprovalEvidenceLedger()
    for (const n of [4, 5, 6, 7]) {
      const def = DAP_STAGE_DEFINITIONS.find(d => d.order === n)!
      expect(ledger.filter(e => e.stageId === def.id)).toHaveLength(0)
    }
  })

  it('respects projectId override', () => {
    const ledger = buildDapApprovalEvidenceLedger({ projectId: 'custom-id' })
    for (const e of ledger) {
      expect(e.projectId).toBe('custom-id')
    }
  })
})

describe('integration: canApproveStageWithEvidence + DAP requirements + ledger', () => {
  it('Stage 1 can be approved (artifact exists, no predecessor)', () => {
    // Build a project where Stage 1 is awaiting and others are not_started.
    const project = {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s =>
        s.order === 1 ? { ...s, status: 'awaiting_owner_approval' as const } : s,
      ),
    }
    const result = canApproveStageWithEvidence({
      project,
      projectId: DAP_PROJECT_ID,
      stageId: 'definition',
      evidence: buildDapApprovalEvidenceLedger(),
      requirements: getDapStageEvidenceRequirements(1),
    })
    expect(result.ok).toBe(true)
  })

  it('Stage 2 cannot be approved (no artifact yet → no evidence)', () => {
    // Stage 1 approved so locking passes; Stage 2 should fail evidence gate.
    const project = {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s => {
        if (s.order === 1) return { ...s, status: 'approved' as const, approval: { decidedBy: 'Owner', decidedAt: '2026-04-30' } }
        if (s.order === 2) return { ...s, status: 'awaiting_owner_approval' as const }
        return s
      }),
    }
    const result = canApproveStageWithEvidence({
      project,
      projectId: DAP_PROJECT_ID,
      stageId: 'discovery',
      evidence: buildDapApprovalEvidenceLedger(),
      requirements: getDapStageEvidenceRequirements(2),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('missing_required_evidence')
      expect(result.missingEvidence.map(r => r.id)).toEqual(['discovery_asset_audit'])
    }
  })
})
