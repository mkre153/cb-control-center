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
