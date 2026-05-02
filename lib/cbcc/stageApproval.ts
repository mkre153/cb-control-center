// CBCC generic engine — stage approval primitives
//
// Pure functions for approving or rejecting a stage. They produce updated
// project/stage objects but do not persist anything. Persistence is wired
// later (Part 2+).
//
// Rules enforced here:
//   - A stage can only be approved if its current status is awaiting_owner_approval.
//   - Rejection is allowed from awaiting_owner_approval as well.
//   - Approval optionally cascades to the next stage's status, flipping it
//     from `locked`/`not_started` to `not_started` (no auto-unlock side effect
//     beyond what stageLocking already computes from approval state).
//   - Decision metadata (decidedBy, decidedAt) must be present.

import type {
  CbccApprovalDecision,
  CbccApprovalResult,
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccProject,
  CbccStage,
  CbccStageId,
} from './types'
import { getStageLockReason, type LockingOptions } from './stageLocking'

function findStage(project: CbccProject, stageId: CbccStageId): CbccStage | null {
  return project.stages.find(s => s.id === stageId) ?? null
}

function replaceStage(
  project: CbccProject,
  next: CbccStage,
  now: string,
): CbccProject {
  return {
    ...project,
    stages: project.stages.map(s => (s.id === next.id ? next : s)),
    updatedAt: now,
  }
}

function validateDecision(
  decision: Pick<CbccApprovalDecision, 'decidedBy' | 'decidedAt'>,
): string | null {
  if (!decision.decidedBy || !decision.decidedBy.trim()) return 'decidedBy is required'
  if (!decision.decidedAt || !decision.decidedAt.trim()) return 'decidedAt is required'
  return null
}

// ─── Predicates ───────────────────────────────────────────────────────────────

export function canApproveStage(project: CbccProject, stageId: CbccStageId): CbccApprovalResult {
  const stage = findStage(project, stageId)
  if (!stage) return { ok: false, reason: `stage "${stageId}" not found in project` }
  if (stage.status !== 'awaiting_owner_approval') {
    return { ok: false, reason: `stage status must be awaiting_owner_approval, got ${stage.status}` }
  }
  return { ok: true, project, stage }
}

export function canRejectStage(project: CbccProject, stageId: CbccStageId): CbccApprovalResult {
  const stage = findStage(project, stageId)
  if (!stage) return { ok: false, reason: `stage "${stageId}" not found in project` }
  if (stage.status !== 'awaiting_owner_approval') {
    return { ok: false, reason: `stage status must be awaiting_owner_approval, got ${stage.status}` }
  }
  return { ok: true, project, stage }
}

// ─── Pure transitions ─────────────────────────────────────────────────────────

export function applyStageApproval(
  project: CbccProject,
  stageId: CbccStageId,
  decision: CbccApprovalDecision,
): CbccApprovalResult {
  const decisionError = validateDecision(decision)
  if (decisionError) return { ok: false, reason: decisionError }

  const guard = canApproveStage(project, stageId)
  if (!guard.ok) return guard

  const stage = guard.stage!
  const approved: CbccStage = {
    ...stage,
    status: 'approved',
    approval: { ...decision },
    rejection: undefined,
  }

  const updatedProject = replaceStage(project, approved, decision.decidedAt)
  return { ok: true, project: updatedProject, stage: approved }
}

export function applyStageRejection(
  project: CbccProject,
  stageId: CbccStageId,
  decision: CbccApprovalDecision,
): CbccApprovalResult {
  const decisionError = validateDecision(decision)
  if (decisionError) return { ok: false, reason: decisionError }

  const guard = canRejectStage(project, stageId)
  if (!guard.ok) return guard

  const stage = guard.stage!
  const rejected: CbccStage = {
    ...stage,
    status: 'rejected',
    rejection: { ...decision },
    approval: undefined,
  }

  const updatedProject = replaceStage(project, rejected, decision.decidedAt)
  return { ok: true, project: updatedProject, stage: rejected }
}

// ─── Inspection ───────────────────────────────────────────────────────────────

export interface ApprovalState {
  stageId: CbccStageId
  status: CbccStage['status']
  approved: boolean
  rejected: boolean
  decision?: CbccApprovalDecision
}

export function getApprovalState(
  project: CbccProject,
  stageId: CbccStageId,
): ApprovalState | null {
  const stage = findStage(project, stageId)
  if (!stage) return null
  return {
    stageId: stage.id,
    status: stage.status,
    approved: stage.status === 'approved',
    rejected: stage.status === 'rejected',
    decision: stage.approval ?? stage.rejection,
  }
}

// ─── Evidence-gated approval check (Part 10) ──────────────────────────────────
//
// Pure predicate that combines stage-existence + locking (predecessor approval)
// + required-evidence presence. Matching is by *requirement.id ↔ evidence.id*,
// scoped to the same project and stage. This is intentionally stricter than
// the generic type-matched validation in evidenceLedger.ts:
//
//   - An AI review entry with id 'opus_stage_review' cannot satisfy a
//     requirement with id 'truth_schema' even if both have type 'note' or
//     type 'file'.
//   - Cross-project evidence is filtered out before matching.
//   - Cross-stage evidence is filtered out before matching.
//   - Only entries with status='valid' satisfy a requirement.
//
// Adapters supply the requirement set per stage; the engine never invents
// requirements of its own.

export interface CbccStageApprovalCheckInput {
  project: CbccProject
  projectId: string
  stageId: CbccStageId
  evidence: CbccEvidenceLedger
  requirements: ReadonlyArray<CbccEvidenceRequirement>
  options?: LockingOptions
}

export type CbccStageApprovalCheckReason =
  | 'stage_not_found'
  | 'stage_locked'
  | 'missing_required_evidence'

export type CbccStageApprovalCheckResult =
  | {
      ok: true
      missingEvidence: readonly []
    }
  | {
      ok: false
      reason: CbccStageApprovalCheckReason
      lockReason?: string
      missingEvidence: ReadonlyArray<CbccEvidenceRequirement>
    }

export function canApproveStageWithEvidence(
  input: CbccStageApprovalCheckInput,
): CbccStageApprovalCheckResult {
  const stage = findStage(input.project, input.stageId)
  if (!stage) {
    return { ok: false, reason: 'stage_not_found', missingEvidence: [] }
  }

  const lock = getStageLockReason(input.project, input.stageId, input.options)
  if (lock.locked) {
    return {
      ok: false,
      reason: 'stage_locked',
      lockReason: lock.reason,
      missingEvidence: [],
    }
  }

  const scoped = input.evidence.filter(
    e => e.projectId === input.projectId && e.stageId === input.stageId,
  )
  const missingEvidence = input.requirements
    .filter(r => r.required)
    .filter(r => !scoped.some(e => e.id === r.id && e.status === 'valid'))

  if (missingEvidence.length > 0) {
    return {
      ok: false,
      reason: 'missing_required_evidence',
      missingEvidence,
    }
  }

  return { ok: true, missingEvidence: [] }
}
