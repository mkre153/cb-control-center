import { describe, it, expect } from 'vitest'
import {
  buildStagePageModel,
  CbccStagePageModelMismatchError,
  type BuildCbccStagePageModelInput,
} from './stagePageModel'
import type {
  CbccAiReviewResult,
  CbccEvidenceEntry,
  CbccEvidenceRequirement,
  CbccStageDefinition,
  CbccStageStatus,
} from './types'

const NOW = '2026-05-01T00:00:00Z'
const PROJECT_ID = 'project-1'

function defs(...partials: Partial<CbccStageDefinition>[]): CbccStageDefinition[] {
  return partials.map((p, i) => ({
    id: `s-${i + 1}`,
    order: i + 1,
    title: `Stage ${i + 1}`,
    description: `Description ${i + 1}`,
    requirements: [],
    requiredApprovals: [],
    ...p,
  }))
}

function makeEvidence(over: Partial<CbccEvidenceEntry> = {}): CbccEvidenceEntry {
  return {
    id: 'e-1',
    projectId: PROJECT_ID,
    stageId: 's-2',
    type: 'file',
    status: 'valid',
    title: 'Some file',
    ref: 'src/foo.ts',
    createdAt: NOW,
    metadata: {},
    ...over,
  }
}

function makeInput(over: Partial<BuildCbccStagePageModelInput> = {}): BuildCbccStagePageModelInput {
  return {
    projectId: PROJECT_ID,
    stages: defs({}, {}, {}),
    currentStageId: 's-1',
    stageStatuses: { 's-1': 'not_started', 's-2': 'not_started', 's-3': 'not_started' },
    evidenceLedger: [],
    evidenceRequirements: [],
    ...over,
  }
}

describe('buildStagePageModel — basic shape and unlocked stage', () => {
  it('builds a model for an unlocked first stage', () => {
    const m = buildStagePageModel(makeInput())
    expect(m.projectId).toBe(PROJECT_ID)
    expect(m.stageId).toBe('s-1')
    expect(m.stageIndex).toBe(0)
    expect(m.stageTitle).toBe('Stage 1')
    expect(m.stageDescription).toBe('Description 1')
    expect(m.stageStatus).toBe('not_started')
    expect(m.lock.isLocked).toBe(false)
    expect(m.lock.reason).toBeUndefined()
  })

  it('throws when current stage id is not in stages', () => {
    expect(() => buildStagePageModel(makeInput({ currentStageId: 'missing' }))).toThrow(/not found/)
  })
})

describe('navigation', () => {
  it('marks the first stage with no previous and a next', () => {
    const m = buildStagePageModel(makeInput({ currentStageId: 's-1' }))
    expect(m.navigation.isFirstStage).toBe(true)
    expect(m.navigation.isLastStage).toBe(false)
    expect(m.navigation.previousStageId).toBeUndefined()
    expect(m.navigation.nextStageId).toBe('s-2')
  })

  it('marks the last stage with a previous and no next', () => {
    const m = buildStagePageModel(makeInput({ currentStageId: 's-3' }))
    expect(m.navigation.isFirstStage).toBe(false)
    expect(m.navigation.isLastStage).toBe(true)
    expect(m.navigation.previousStageId).toBe('s-2')
    expect(m.navigation.nextStageId).toBeUndefined()
  })

  it('returns previous and next stage ids for a middle stage', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'approved', 's-2': 'not_started', 's-3': 'not_started' },
    }))
    expect(m.navigation.previousStageId).toBe('s-1')
    expect(m.navigation.nextStageId).toBe('s-3')
    expect(m.navigation.isFirstStage).toBe(false)
    expect(m.navigation.isLastStage).toBe(false)
  })

  it('treats a single-stage project as both first and last', () => {
    const m = buildStagePageModel(makeInput({
      stages: defs({}),
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'not_started' },
    }))
    expect(m.navigation.isFirstStage).toBe(true)
    expect(m.navigation.isLastStage).toBe(true)
    expect(m.navigation.previousStageId).toBeUndefined()
    expect(m.navigation.nextStageId).toBeUndefined()
  })
})

describe('lock state', () => {
  it('marks stage 2 locked when stage 1 is not approved', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'not_started', 's-2': 'not_started', 's-3': 'not_started' },
    }))
    expect(m.lock.isLocked).toBe(true)
    expect(m.lock.reason).toMatch(/predecessor/)
  })

  it('marks stage 2 unlocked when stage 1 is approved', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'approved', 's-2': 'not_started', 's-3': 'not_started' },
    }))
    expect(m.lock.isLocked).toBe(false)
  })

  it('marks all stages locked when project is paused', () => {
    const m = buildStagePageModel(makeInput({
      projectStatus: 'paused',
      currentStageId: 's-1',
    }))
    expect(m.lock.isLocked).toBe(true)
    expect(m.lock.reason).toMatch(/paused/)
  })
})

describe('approval gating', () => {
  const reqs: CbccEvidenceRequirement[] = [
    { id: 'r-test', type: 'test', title: 'Tests passing', required: true },
  ]
  const validTestEvidence: CbccEvidenceEntry[] = [
    makeEvidence({ id: 'e-test', stageId: 's-1', type: 'test', status: 'valid', ref: 'tests/foo.test.ts' }),
  ]

  it('refuses approval when stage is locked', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'not_started', 's-2': 'awaiting_owner_approval', 's-3': 'not_started' },
      evidenceLedger: validTestEvidence.map(e => ({ ...e, stageId: 's-2' })),
      evidenceRequirements: reqs,
    }))
    expect(m.lock.isLocked).toBe(true)
    expect(m.approval.canApprove).toBe(false)
    expect(m.approval.isReadyForApproval).toBe(false)
    expect(m.availableActions).not.toContain('approve_stage')
  })

  it('refuses approval when required evidence is missing', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'awaiting_owner_approval', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: [],
      evidenceRequirements: reqs,
    }))
    expect(m.approval.canApprove).toBe(false)
    expect(m.approval.isReadyForApproval).toBe(false)
    expect(m.approval.reason).toMatch(/missing required evidence/i)
    expect(m.availableActions).not.toContain('approve_stage')
  })

  it('allows approval when required evidence is present and valid', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'awaiting_owner_approval', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: validTestEvidence,
      evidenceRequirements: reqs,
    }))
    expect(m.approval.canApprove).toBe(true)
    expect(m.approval.canReject).toBe(true)
    expect(m.approval.isReadyForApproval).toBe(true)
    expect(m.availableActions).toContain('approve_stage')
    expect(m.availableActions).toContain('reject_stage')
  })

  it('does not allow approval when stage is already approved', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'approved', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: validTestEvidence,
      evidenceRequirements: reqs,
    }))
    expect(m.approval.canApprove).toBe(false)
    expect(m.approval.canReject).toBe(false)
    expect(m.approval.isReadyForApproval).toBe(false)
    expect(m.approval.reason).toMatch(/already approved/i)
    expect(m.availableActions).not.toContain('approve_stage')
    // navigation to next still available
    expect(m.availableActions).toContain('view_next_stage')
  })

  it('does not allow approval when stage was rejected', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'rejected', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: validTestEvidence,
      evidenceRequirements: reqs,
    }))
    expect(m.approval.canApprove).toBe(false)
    expect(m.approval.canReject).toBe(false)
    expect(m.approval.reason).toMatch(/rejected/i)
  })
})

describe('blockers', () => {
  it('includes a blocking lock blocker when locked', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'not_started', 's-2': 'not_started', 's-3': 'not_started' },
    }))
    const lockBlockers = m.blockers.filter(b => b.code === 'stage_locked')
    expect(lockBlockers).toHaveLength(1)
    expect(lockBlockers[0].severity).toBe('blocking')
  })

  it('includes a blocker per missing required evidence requirement', () => {
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r-test',   type: 'test',       title: 'Tests passing', required: true },
      { id: 'r-commit', type: 'git_commit', title: 'Commit hash',   required: true },
    ]
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'awaiting_owner_approval', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceRequirements: reqs,
    }))
    const missing = m.blockers.filter(b => b.code.startsWith('missing_evidence:'))
    expect(missing.map(b => b.code).sort()).toEqual([
      'missing_evidence:r-commit',
      'missing_evidence:r-test',
    ])
    for (const b of missing) expect(b.severity).toBe('blocking')
  })

  it('surfaces invalid evidence as a warning blocker (not blocking)', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'in_progress', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: [makeEvidence({ stageId: 's-1', status: 'invalid' })],
      evidenceRequirements: [],
    }))
    const warn = m.blockers.find(b => b.code === 'invalid_evidence_present')
    expect(warn).toBeDefined()
    expect(warn?.severity).toBe('warning')
  })

  it('includes no blockers for a clean stage with all required evidence', () => {
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r-test', type: 'test', title: 'Tests passing', required: true },
    ]
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'awaiting_owner_approval', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: [makeEvidence({ id: 'e-test', stageId: 's-1', type: 'test', status: 'valid', ref: 'a' })],
      evidenceRequirements: reqs,
    }))
    expect(m.blockers).toEqual([])
  })
})

describe('evidence summary + validation present in model', () => {
  it('exposes a stage-scoped summary', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'in_progress', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: [
        makeEvidence({ id: 'a', stageId: 's-1', type: 'test', status: 'valid' }),
        makeEvidence({ id: 'b', stageId: 's-1', type: 'file', status: 'pending' }),
        makeEvidence({ id: 'c', stageId: 's-2', type: 'file', status: 'valid' }),
      ],
    }))
    expect(m.evidence.summary.total).toBe(2)
    expect(m.evidence.summary.valid).toBe(1)
    expect(m.evidence.summary.pending).toBe(1)
    expect(m.evidence.summary.byType.test).toBe(1)
    expect(m.evidence.summary.byType.file).toBe(1)
  })

  it('exposes the requirements unchanged', () => {
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r1', type: 'test', title: 'Tests', required: true },
    ]
    const m = buildStagePageModel(makeInput({ evidenceRequirements: reqs }))
    expect(m.evidence.requirements).toEqual(reqs)
  })

  it('exposes a validation result reflecting missing requirements', () => {
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r1', type: 'test', title: 'Tests', required: true },
    ]
    const m = buildStagePageModel(makeInput({ evidenceRequirements: reqs }))
    expect(m.evidence.validation.ok).toBe(false)
    expect(m.evidence.validation.errors).toContain('Tests')
  })

  it('exposes ok=true validation when no requirements', () => {
    const m = buildStagePageModel(makeInput())
    expect(m.evidence.validation.ok).toBe(true)
  })
})

describe('AI review placeholder', () => {
  it('returns status=not_requested when no aiReviewResult is supplied', () => {
    const m = buildStagePageModel(makeInput())
    expect(m.aiReview).toEqual({ status: 'not_requested' })
  })

  it('placeholder is present even on locked stages', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'not_started', 's-2': 'not_started', 's-3': 'not_started' },
    }))
    expect(m.aiReview.status).toBe('not_requested')
  })
})

// ─── AI review surfacing (Part 4C) ───────────────────────────────────────────

function makeAiResult(over: Partial<CbccAiReviewResult> = {}): CbccAiReviewResult {
  return {
    projectId: PROJECT_ID,
    stageId: 's-1',
    decision: 'pass_with_concerns',
    summary: 'AI says: looks good but two open risks.',
    recommendation: { action: 'address_risks', rationale: 'risks open' },
    risks: [{ id: 'risk-1', severity: 'medium', message: 'Coverage gap' }],
    reviewedAt: NOW,
    ...over,
  }
}

describe('aiReviewResult surfacing', () => {
  it('copies decision, summary, recommendation, risks, reviewedAt to the placeholder', () => {
    const result = makeAiResult({ model: 'opus-4-7', promptVersion: 'v1' })
    const m = buildStagePageModel(makeInput({ aiReviewResult: result }))
    expect(m.aiReview.status).toBe('available')
    expect(m.aiReview.summary).toBe(result.summary)
    expect(m.aiReview.decision).toBe('pass_with_concerns')
    expect(m.aiReview.recommendation).toEqual(result.recommendation)
    expect(m.aiReview.risks).toEqual(result.risks)
    expect(m.aiReview.reviewedAt).toBe(NOW)
    expect(m.aiReview.model).toBe('opus-4-7')
    expect(m.aiReview.promptVersion).toBe('v1')
  })

  it('throws CbccStagePageModelMismatchError when projectId mismatches', () => {
    expect(() => buildStagePageModel(makeInput({
      aiReviewResult: makeAiResult({ projectId: 'OTHER' }),
    }))).toThrow(CbccStagePageModelMismatchError)
  })

  it('throws CbccStagePageModelMismatchError when stageId mismatches', () => {
    expect(() => buildStagePageModel(makeInput({
      currentStageId: 's-1',
      aiReviewResult: makeAiResult({ stageId: 's-2' }),
    }))).toThrow(CbccStagePageModelMismatchError)
  })

  // ── Critical invariant: AI review never alters deterministic state ─────

  it('does NOT make missing required evidence approvable', () => {
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r-test', type: 'test', title: 'Tests passing', required: true },
    ]
    const result = makeAiResult({ decision: 'pass' })
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'awaiting_owner_approval', 's-2': 'not_started', 's-3': 'not_started' },
      evidenceLedger: [],
      evidenceRequirements: reqs,
      aiReviewResult: result,
    }))
    expect(m.approval.canApprove).toBe(false)
    expect(m.approval.isReadyForApproval).toBe(false)
    expect(m.availableActions).not.toContain('approve_stage')
    // The blockers must still cite the missing evidence — AI cannot dissolve it.
    expect(m.blockers.some(b => b.code.startsWith('missing_evidence:'))).toBe(true)
  })

  it('does NOT unlock a locked stage', () => {
    const result = makeAiResult({ stageId: 's-2', decision: 'pass' })
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'not_started', 's-2': 'not_started', 's-3': 'not_started' },
      aiReviewResult: result,
    }))
    expect(m.lock.isLocked).toBe(true)
    expect(m.approval.canApprove).toBe(false)
    expect(m.availableActions).not.toContain('approve_stage')
    // Lock blocker remains.
    expect(m.blockers.some(b => b.code === 'stage_locked')).toBe(true)
  })

  it('does NOT make an already-approved stage approvable again', () => {
    const result = makeAiResult({ decision: 'pass' })
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-1',
      stageStatuses: { 's-1': 'approved', 's-2': 'not_started', 's-3': 'not_started' },
      aiReviewResult: result,
    }))
    expect(m.approval.canApprove).toBe(false)
    expect(m.approval.reason).toMatch(/already approved/i)
    expect(m.availableActions).not.toContain('approve_stage')
  })

  it('does NOT add AI risks to the deterministic blockers list', () => {
    // AI risks live on m.aiReview.risks; m.blockers stays free of them so
    // that approval gates never depend on AI output.
    const result = makeAiResult({
      risks: [
        { id: 'r-critical', severity: 'critical', message: 'Catastrophe' },
      ],
    })
    const m = buildStagePageModel(makeInput({ aiReviewResult: result }))
    expect(m.aiReview.risks).toEqual(result.risks)
    expect(m.blockers).toEqual([]) // no derived blockers
  })

  it('AI review is dropped from the model when the input is undefined', () => {
    const m = buildStagePageModel(makeInput()) // no aiReviewResult
    expect(m.aiReview).toEqual({ status: 'not_requested' })
  })
})

describe('purpose + requiredArtifact pass through from definition', () => {
  it('surfaces purpose when defined', () => {
    const m = buildStagePageModel(makeInput({
      stages: defs({ purpose: 'Establish baseline.' }, {}, {}),
    }))
    expect(m.purpose).toBe('Establish baseline.')
  })

  it('surfaces artifact when defined', () => {
    const artifact = { title: 'Spec', description: 'Written spec.', required: true }
    const m = buildStagePageModel(makeInput({
      stages: defs({ artifact }, {}, {}),
    }))
    expect(m.requiredArtifact).toEqual(artifact)
  })

  it('returns undefined when not defined', () => {
    const m = buildStagePageModel(makeInput())
    expect(m.purpose).toBeUndefined()
    expect(m.requiredArtifact).toBeUndefined()
  })
})

describe('available actions', () => {
  it('omits approve/reject/submit/review when locked', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'not_started', 's-2': 'awaiting_owner_approval', 's-3': 'not_started' },
    }))
    expect(m.availableActions).not.toContain('approve_stage')
    expect(m.availableActions).not.toContain('reject_stage')
    expect(m.availableActions).not.toContain('submit_evidence')
    expect(m.availableActions).not.toContain('request_ai_review')
  })

  it('includes view_previous_stage and view_next_stage based on neighbors', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-2',
      stageStatuses: { 's-1': 'approved', 's-2': 'not_started', 's-3': 'not_started' },
    }))
    expect(m.availableActions).toContain('view_previous_stage')
    expect(m.availableActions).toContain('view_next_stage')
  })

  it('omits view_previous_stage on the first stage', () => {
    const m = buildStagePageModel(makeInput({ currentStageId: 's-1' }))
    expect(m.availableActions).not.toContain('view_previous_stage')
  })

  it('omits view_next_stage on the last stage', () => {
    const m = buildStagePageModel(makeInput({
      currentStageId: 's-3',
      stageStatuses: { 's-1': 'approved', 's-2': 'approved', 's-3': 'not_started' },
    }))
    expect(m.availableActions).not.toContain('view_next_stage')
  })
})

describe('stage page model source contains no vertical-specific language', () => {
  const FORBIDDEN: ReadonlyArray<RegExp> = [
    /\bDAP\b/,
    /\bdental\b/i,
    /\binsurance\b/i,
    /\bpatient(s)?\b/i,
    /\bpractice(s)?\b/i,
    /\bmembership(s)?\b/i,
  ]

  async function read(rel: string) {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    return readFileSync(resolve(__dirname, rel), 'utf-8')
  }

  for (const file of ['stagePageModel.ts', 'stagePageModel.test.ts']) {
    it(`lib/cbcc/${file} is generic`, async () => {
      const src = await read(file)
      for (const re of FORBIDDEN) {
        expect(src, `${file} matched ${re}`).not.toMatch(re)
      }
    })
  }
})

// Compile-time existence check: covers the directive's "default AI review
// placeholder" expectation by ensuring the field is part of the model's
// public surface for any well-formed input.
describe('CbccStagePageModel surface — required fields present', () => {
  const REQUIRED_KEYS: ReadonlyArray<keyof ReturnType<typeof buildStagePageModel>> = [
    'projectId',
    'stageId',
    'stageIndex',
    'stageTitle',
    'stageDescription',
    'stageStatus',
    'lock',
    'navigation',
    'evidence',
    'blockers',
    'approval',
    'availableActions',
    'aiReview',
  ]

  it('every required key is present in the returned model', () => {
    const m = buildStagePageModel(makeInput()) as unknown as Record<string, unknown>
    for (const k of REQUIRED_KEYS) {
      expect(m, `missing key: ${String(k)}`).toHaveProperty(k as string)
    }
  })
})
