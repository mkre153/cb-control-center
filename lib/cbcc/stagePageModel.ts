// CBCC generic engine — stage page model
//
// Pure model builder for a stage detail page. Composes the locking helpers
// (Part 1) and evidence ledger helpers (Part 2). Returns one CbccStagePageModel.
// No UI, no DB, no Supabase, no AI calls — Part 3 is data only.
//
// Approval policy summary:
//   - canApprove iff !locked AND status not in {approved, rejected}
//                 AND all required evidence is satisfied by valid entries
//   - canReject  iff !locked AND status not in {approved, rejected}
//                 AND all required evidence is satisfied by valid entries
//   - isReadyForApproval iff canApprove (sugar — the gate the page renders)
//
// Action availability mirrors the predicates: locked stages have no
// approve/reject/submit/review actions; navigation actions appear when
// neighboring stages exist.

import type {
  CbccAiReviewResult,
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccProject,
  CbccProjectStatus,
  CbccStage,
  CbccStageDefinition,
  CbccStageId,
  CbccStagePageAction,
  CbccStagePageAiReviewPlaceholder,
  CbccStagePageBlocker,
  CbccStagePageModel,
  CbccStagePageNavigation,
  CbccStageStatus,
} from './types'
import { getStageLockReason } from './stageLocking'
import {
  getMissingEvidenceRequirements,
  hasRequiredEvidence,
  summarizeEvidenceForStage,
  validateStageEvidence,
} from './evidenceLedger'

export interface BuildCbccStagePageModelInput {
  projectId: string
  stages: ReadonlyArray<CbccStageDefinition>
  currentStageId: CbccStageId
  stageStatuses: Readonly<Record<string, CbccStageStatus>>
  evidenceLedger: CbccEvidenceLedger
  evidenceRequirements: ReadonlyArray<CbccEvidenceRequirement>
  // Optional: the surrounding project's lifecycle status. Defaults to
  // 'active'. Affects locking (paused projects lock everything).
  projectStatus?: CbccProjectStatus
  // Optional: a normalized AI review result to surface as display-only data
  // on the page model. AI review NEVER affects approval/locking/blockers —
  // see ARCHITECTURE.md. The result must match (projectId, currentStageId);
  // mismatches throw a CbccStagePageModelMismatchError so callers detect
  // the bug early instead of silently rendering stale data.
  aiReviewResult?: CbccAiReviewResult
}

// Thrown when an AI review result is supplied with identity that does not
// match the page being built. This is a programmer error, not a runtime
// condition — it indicates the caller wired the wrong review to the wrong
// page. We throw rather than ignore because deterministic safety > silent
// drift.
export class CbccStagePageModelMismatchError extends Error {
  readonly expected: { projectId: string; stageId: CbccStageId }
  readonly received: { projectId: string; stageId: CbccStageId | number }
  constructor(
    expected: { projectId: string; stageId: CbccStageId },
    received: { projectId: string; stageId: CbccStageId | number },
  ) {
    super(
      `aiReviewResult identity mismatch: expected (${expected.projectId}, ${expected.stageId}), got (${received.projectId}, ${received.stageId})`,
    )
    this.name = 'CbccStagePageModelMismatchError'
    this.expected = expected
    this.received = received
  }
}

const DEFAULT_PROJECT_STATUS: CbccProjectStatus = 'active'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function sortByOrder(
  stages: ReadonlyArray<CbccStageDefinition>,
): ReadonlyArray<CbccStageDefinition> {
  return [...stages].sort((a, b) => a.order - b.order)
}

function statusOf(
  input: BuildCbccStagePageModelInput,
  stageId: CbccStageId,
): CbccStageStatus {
  return input.stageStatuses[stageId] ?? 'not_started'
}

function synthesizeProject(input: BuildCbccStagePageModelInput): CbccProject {
  const stages: CbccStage[] = input.stages.map(def => ({
    id: def.id,
    order: def.order,
    status: statusOf(input, def.id),
  }))
  const epoch = '1970-01-01T00:00:00.000Z'
  return {
    id: input.projectId,
    slug: input.projectId,
    name: input.projectId,
    adapterKey: 'engine',
    status: input.projectStatus ?? DEFAULT_PROJECT_STATUS,
    stages,
    createdAt: epoch,
    updatedAt: epoch,
  }
}

function buildNavigation(
  ordered: ReadonlyArray<CbccStageDefinition>,
  currentStageId: CbccStageId,
): CbccStagePageNavigation {
  const idx = ordered.findIndex(s => s.id === currentStageId)
  const isFirstStage = idx === 0
  const isLastStage = idx === ordered.length - 1
  return {
    previousStageId: isFirstStage ? undefined : ordered[idx - 1].id,
    nextStageId: isLastStage ? undefined : ordered[idx + 1].id,
    isFirstStage,
    isLastStage,
  }
}

function buildBlockers(args: {
  isLocked: boolean
  lockReason?: string
  missingRequired: ReadonlyArray<CbccEvidenceRequirement>
  invalidEvidenceCount: number
}): ReadonlyArray<CbccStagePageBlocker> {
  const blockers: CbccStagePageBlocker[] = []

  if (args.isLocked) {
    blockers.push({
      code: 'stage_locked',
      message: args.lockReason ?? 'Stage is locked',
      severity: 'blocking',
    })
  }

  for (const r of args.missingRequired) {
    blockers.push({
      code: `missing_evidence:${r.id}`,
      message: `Missing required evidence: ${r.title}`,
      severity: 'blocking',
    })
  }

  if (args.invalidEvidenceCount > 0) {
    blockers.push({
      code: 'invalid_evidence_present',
      message: `${args.invalidEvidenceCount} evidence ${args.invalidEvidenceCount === 1 ? 'entry is' : 'entries are'} marked invalid`,
      severity: 'warning',
    })
  }

  return blockers
}

function buildAvailableActions(args: {
  isLocked: boolean
  hasPrev: boolean
  hasNext: boolean
  status: CbccStageStatus
  canApprove: boolean
  canReject: boolean
}): ReadonlyArray<CbccStagePageAction> {
  const actions: CbccStagePageAction[] = []

  if (args.hasPrev) actions.push('view_previous_stage')
  if (args.hasNext) actions.push('view_next_stage')

  const isTerminal = args.status === 'approved' || args.status === 'rejected'

  if (!args.isLocked && !isTerminal) {
    actions.push('submit_evidence')
    actions.push('request_ai_review')
  }

  if (args.canApprove) actions.push('approve_stage')
  if (args.canReject) actions.push('reject_stage')

  // unlock_previous_stage is offered when a prior stage exists and the
  // current stage is not yet approved (caller may want to revise upstream).
  if (args.hasPrev && args.status !== 'approved') {
    actions.push('unlock_previous_stage')
  }

  return actions
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildStagePageModel(
  input: BuildCbccStagePageModelInput,
): CbccStagePageModel {
  const ordered = sortByOrder(input.stages)
  const idx = ordered.findIndex(s => s.id === input.currentStageId)
  if (idx < 0) {
    throw new Error(`buildStagePageModel: stage "${input.currentStageId}" not found in input.stages`)
  }
  const def = ordered[idx]
  const status = statusOf(input, def.id)

  // Locking
  const project = synthesizeProject(input)
  const lock = getStageLockReason(project, def.id)
  const isLocked = lock.locked

  // Evidence
  const requirements = input.evidenceRequirements
  const summary = summarizeEvidenceForStage(input.evidenceLedger, input.projectId, def.id)
  const validation = validateStageEvidence({
    projectId: input.projectId,
    stageId: def.id,
    evidence: input.evidenceLedger,
    requirements,
  })
  const allRequiredValid = hasRequiredEvidence(validation.validEvidence, requirements)
  const missingRequired = getMissingEvidenceRequirements(validation.validEvidence, requirements)
  const isTerminal = status === 'approved' || status === 'rejected'

  // Approval policy (see header comment)
  const canApprove = !isLocked && !isTerminal && allRequiredValid
  const canReject = !isLocked && !isTerminal && allRequiredValid
  const isReadyForApproval = canApprove

  let approvalReason: string | undefined
  if (status === 'approved') approvalReason = 'stage already approved'
  else if (status === 'rejected') approvalReason = 'stage was rejected'
  else if (isLocked) approvalReason = lock.reason
  else if (!allRequiredValid) approvalReason = `missing required evidence (${missingRequired.length})`

  // Navigation
  const navigation = buildNavigation(ordered, def.id)
  const hasPrev = !navigation.isFirstStage
  const hasNext = !navigation.isLastStage

  // Blockers
  const blockers = buildBlockers({
    isLocked,
    lockReason: lock.reason,
    missingRequired,
    invalidEvidenceCount: validation.invalidEvidence.length,
  })

  // Actions
  const availableActions = buildAvailableActions({
    isLocked,
    hasPrev,
    hasNext,
    status,
    canApprove,
    canReject,
  })

  return {
    projectId: input.projectId,
    stageId: def.id,
    stageIndex: idx,
    stageTitle: def.title,
    stageDescription: def.description,
    stageStatus: status,

    lock: { isLocked, reason: lock.reason },

    navigation,

    purpose: def.purpose,
    requiredArtifact: def.artifact,

    evidence: {
      requirements,
      summary,
      validation: { ok: validation.ok, errors: validation.missingRequired.map(r => r.title) },
    },

    blockers,

    approval: {
      isReadyForApproval,
      canApprove,
      canReject,
      reason: approvalReason,
    },

    availableActions,

    aiReview: buildAiReviewPlaceholder(input, def.id),
  }
}

// ─── AI review surfacing ──────────────────────────────────────────────────────
//
// Pure projection from CbccAiReviewResult to the page-model's display-only
// placeholder. Throws on identity mismatch; otherwise either returns the
// 'not_requested' default or copies the relevant fields out.
//
// Critical: this function is the ONLY place AI review enters the page model.
// It runs after approval/locking/blockers have been computed, so there is
// no path by which AI review can affect deterministic state.

function buildAiReviewPlaceholder(
  input: BuildCbccStagePageModelInput,
  currentStageId: CbccStageId,
): CbccStagePageAiReviewPlaceholder {
  const result = input.aiReviewResult
  if (!result) return { status: 'not_requested' }

  if (result.projectId !== input.projectId || result.stageId !== currentStageId) {
    throw new CbccStagePageModelMismatchError(
      { projectId: input.projectId, stageId: currentStageId },
      { projectId: result.projectId, stageId: result.stageId },
    )
  }

  return {
    status: 'available',
    summary: result.summary,
    decision: result.decision,
    risks: result.risks,
    recommendation: result.recommendation,
    reviewedAt: result.reviewedAt,
    model: result.model,
    promptVersion: result.promptVersion,
  }
}
