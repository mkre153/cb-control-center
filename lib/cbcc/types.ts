// CBCC generic engine — types
//
// Foundation types for the project-agnostic stage-gated control engine.
// No project-specific names, claims, or domain language.

// ─── Identifiers ──────────────────────────────────────────────────────────────

export type CbccStageId = string

// ─── Status enums ─────────────────────────────────────────────────────────────

export type CbccStageStatus =
  | 'not_started'
  | 'locked'
  | 'in_progress'
  | 'awaiting_owner_approval'
  | 'approved'
  | 'rejected'
  | 'blocked'

export type CbccProjectStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'

// ─── Evidence ─────────────────────────────────────────────────────────────────
//
// Evidence items document what was produced or referenced for a stage. The
// shape is portable: a discriminated `type` plus a flexible payload. Future
// ledger persistence will key on `type` and the value fields.

export type CbccEvidenceType =
  | 'file'
  | 'route'
  | 'git_commit'
  | 'git_branch'
  | 'test'
  | 'deployment'
  | 'external_url'
  | 'note'

export interface CbccEvidenceItem {
  type: CbccEvidenceType
  value: string
  label?: string
  recordedAt?: string
  recordedBy?: string
}

// ─── Evidence ledger ──────────────────────────────────────────────────────────
//
// CbccEvidenceItem is the lightweight inline reference used by stages and
// adapters. CbccEvidenceEntry is the full ledger record — append-only, tied
// to a specific project + stage, with id, status, and audit metadata.

export type CbccEvidenceStatus =
  | 'valid'
  | 'pending'
  | 'invalid'
  | 'missing'

export interface CbccEvidenceEntry {
  id: string
  projectId: string
  stageId: string | number
  type: CbccEvidenceType
  status: CbccEvidenceStatus
  title: string
  description?: string
  ref?: string
  createdAt: string
  createdBy?: string
  metadata?: Record<string, unknown>
}

export type CbccEvidenceLedger = ReadonlyArray<CbccEvidenceEntry>

export interface CbccEvidenceRequirement {
  id: string
  type: CbccEvidenceType
  title: string
  required: boolean
  description?: string
}

export interface CbccEvidenceValidationResult {
  ok: boolean
  reason?: string
  errors?: ReadonlyArray<string>
}

export interface CbccEvidenceSummary {
  projectId: string
  stageId: string | number
  total: number
  valid: number
  pending: number
  invalid: number
  missing: number
  byType: Record<CbccEvidenceType, number>
  byStatus: Record<CbccEvidenceStatus, number>
}

// ─── Stage definition vs. stage instance ──────────────────────────────────────
//
// A *definition* is the static template (what stage 3 is for any project of
// this kind). A *stage* is the live instance tied to a specific project,
// carrying status and decision metadata.

export interface CbccStageRequirement {
  key: string
  label: string
  description?: string
}

export interface CbccStageDefinition {
  id: CbccStageId
  order: number
  title: string
  description: string
  // Optional — adapters that want to surface a stage purpose distinct from
  // the description (e.g. "why this stage exists") populate it here.
  purpose?: string
  // Optional — adapters that want to declare a primary deliverable/artifact
  // contract per stage populate it here. The page model surfaces it as
  // requiredArtifact. Both fields are independent of evidence requirements.
  artifact?: CbccStagePageArtifact
  requirements: ReadonlyArray<CbccStageRequirement>
  requiredApprovals: ReadonlyArray<string>
}

// ─── Approval ─────────────────────────────────────────────────────────────────

export interface CbccApprovalDecision {
  decidedBy: string
  decidedAt: string
  notes?: string
}

export interface CbccStage {
  id: CbccStageId
  order: number
  status: CbccStageStatus
  approval?: CbccApprovalDecision
  rejection?: CbccApprovalDecision
  evidence?: ReadonlyArray<CbccEvidenceItem>
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface CbccProject {
  id: string
  slug: string
  name: string
  description?: string
  adapterKey: string
  status: CbccProjectStatus
  stages: ReadonlyArray<CbccStage>
  createdAt: string
  updatedAt: string
}

// ─── Operation results ────────────────────────────────────────────────────────
//
// Pure logic returns structured results, never throws or returns booleans
// alone. `ok: true` always carries the post-operation project/stage so callers
// can compose without inspecting the input.

export interface CbccApprovalResult {
  ok: boolean
  reason?: string
  project?: CbccProject
  stage?: CbccStage
}

// ─── Adapter interface ────────────────────────────────────────────────────────
//
// Adapters are how project-specific systems plug into CBCC. The generic
// engine only knows how to ask an adapter for definitions, artifacts, and
// evidence. Adapters are registered by `adapterKey` (see projectRegistry).
//
// `unknown` is used for adapter-specific artifact shapes — the generic engine
// does not interpret artifact payloads, only routes them.

export interface CbccProjectAdapter {
  key: string
  getProjectDefinition(projectId: string): Promise<CbccProject | null> | CbccProject | null
  getStageDefinitions(projectId: string): Promise<ReadonlyArray<CbccStageDefinition>> | ReadonlyArray<CbccStageDefinition>
  getStageArtifact(projectId: string, stageId: CbccStageId): Promise<unknown | null> | unknown | null
  validateStageArtifact(stageId: CbccStageId, artifact: unknown): { valid: boolean; errors?: ReadonlyArray<string> }
  getEvidenceForStage(projectId: string, stageId: CbccStageId): Promise<ReadonlyArray<CbccEvidenceItem>> | ReadonlyArray<CbccEvidenceItem>
}

// ─── Stage page model (Part 3) ────────────────────────────────────────────────
//
// Pure data model that powers a full stage detail page. UI is not part of the
// engine — the model just answers "given a project, current stage, locking,
// and evidence, what should the page display?". A renderer (later) maps this
// model to React components.

export type CbccStagePageAction =
  | 'submit_evidence'
  | 'request_ai_review'
  | 'approve_stage'
  | 'reject_stage'
  | 'unlock_previous_stage'
  | 'view_previous_stage'
  | 'view_next_stage'

export type CbccStagePageBlockerSeverity = 'info' | 'warning' | 'blocking'

export interface CbccStagePageBlocker {
  code: string
  message: string
  severity: CbccStagePageBlockerSeverity
}

export interface CbccStagePageNavigation {
  previousStageId?: CbccStageId
  nextStageId?: CbccStageId
  isFirstStage: boolean
  isLastStage: boolean
}

export interface CbccStagePageArtifact {
  title: string
  description: string
  required: boolean
}

export type CbccStagePageAiReviewStatus =
  | 'not_requested'
  | 'pending'
  | 'available'
  | 'not_applicable'

export interface CbccStagePageAiReviewPlaceholder {
  status: CbccStagePageAiReviewStatus
  summary?: string
}

export interface CbccStagePageModel {
  projectId: string
  stageId: CbccStageId
  stageIndex: number
  stageTitle: string
  stageDescription?: string
  stageStatus: CbccStageStatus

  lock: {
    isLocked: boolean
    reason?: string
  }

  navigation: CbccStagePageNavigation

  purpose?: string
  requiredArtifact?: CbccStagePageArtifact

  evidence: {
    requirements: ReadonlyArray<CbccEvidenceRequirement>
    summary: CbccEvidenceSummary
    validation: CbccEvidenceValidationResult
  }

  blockers: ReadonlyArray<CbccStagePageBlocker>

  approval: {
    isReadyForApproval: boolean
    canApprove: boolean
    canReject: boolean
    reason?: string
  }

  availableActions: ReadonlyArray<CbccStagePageAction>

  aiReview: CbccStagePageAiReviewPlaceholder
}
