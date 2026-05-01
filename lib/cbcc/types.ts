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
  // Display-only fields populated when an AI review result is supplied to
  // the page-model builder. None of these affect deterministic approval —
  // see ARCHITECTURE.md ("AI recommends. CBCC enforces. Owner approves.").
  decision?: CbccAiReviewDecision
  risks?: ReadonlyArray<CbccAiReviewRisk>
  recommendation?: CbccAiReviewRecommendation
  reviewedAt?: string
  model?: string
  promptVersion?: string
}

// ─── AI review (Part 4A — contract only) ──────────────────────────────────────
//
// The engine represents an AI recommendation as advisory data. The AI
// **cannot mutate state**: it produces a CbccAiReviewResult, which the page
// model surfaces; only the owner can approve/reject. Part 4B will wire an
// actual provider — for now this is the contract layer.

export type CbccAiReviewDecision =
  | 'pass'
  | 'pass_with_concerns'
  | 'fail'
  | 'inconclusive'

export type CbccAiReviewRiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface CbccAiReviewRisk {
  id: string
  severity: CbccAiReviewRiskSeverity
  category?: string
  message: string
  // Free-form references (evidence ids, file paths, urls, commit hashes…).
  // The engine does not interpret them — they are display strings.
  citations?: ReadonlyArray<string>
}

export type CbccAiReviewRecommendationAction =
  | 'request_more_evidence'
  | 'revise_artifact'
  | 'rerun_tests'
  | 'address_risks'
  | 'proceed_to_owner_review'
  | 'no_action'

export interface CbccAiReviewRecommendation {
  action: CbccAiReviewRecommendationAction
  rationale: string
  nextSteps?: ReadonlyArray<string>
}

export interface CbccAiReviewResult {
  projectId: string
  stageId: CbccStageId
  // Provider metadata — informational only. The engine does not branch on these.
  model?: string
  promptVersion?: string
  decision: CbccAiReviewDecision
  // Plain-text summary suitable for display.
  summary: string
  recommendation: CbccAiReviewRecommendation
  risks: ReadonlyArray<CbccAiReviewRisk>
  reviewedAt: string
}

// The structured packet handed to a future provider. Producing this packet
// is pure (no IO). A provider takes the packet and returns raw output, which
// `normalizeCbccAiReviewResult` validates.

export interface CbccAiReviewPromptPacket {
  projectId: string
  stageId: CbccStageId
  stageTitle: string
  stageDescription?: string
  stagePurpose?: string
  evidence: ReadonlyArray<CbccEvidenceEntry>
  evidenceRequirements: ReadonlyArray<CbccEvidenceRequirement>
  // Optional prior review result so providers can do follow-ups.
  priorReview?: CbccAiReviewResult
  // System-level rules the AI must respect (e.g. "do not approve, only
  // recommend"). Callers inject these — the engine does not opine.
  guardrails: ReadonlyArray<string>
  // Stable identifier for the prompt template the caller intends to use.
  // Surfaces back into `CbccAiReviewResult.promptVersion` for auditability.
  promptVersion?: string
}

// ─── Agent runtime (Part 5) ───────────────────────────────────────────────────
//
// Agents are controlled workers. They can inspect a stage, propose evidence,
// propose an artifact, or recommend owner review. They cannot approve, unlock,
// persist, or otherwise mutate engine state. The runtime is deterministic in
// Part 5 — Part 6+ may wire AI behind the same shape.

export type CbccAgentId = string

export type CbccAgentKind =
  | 'stage_worker'
  | 'reviewer'
  | 'evidence_collector'
  | 'adapter_worker'

export type CbccAgentRunStatus =
  | 'not_started'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'

export type CbccAgentRunDecision =
  | 'no_change'
  | 'evidence_proposed'
  | 'artifact_proposed'
  | 'owner_review_required'
  | 'blocked'

export interface CbccAgentDefinition {
  id: CbccAgentId
  kind: CbccAgentKind
  name: string
  description: string
  // Optional whitelist of stage numbers the agent is allowed to run against.
  // Undefined → agent is allowed on any stage.
  allowedStages?: ReadonlyArray<number>
  requiredInputs?: ReadonlyArray<string>
  producesEvidence?: boolean
  producesArtifact?: boolean
}

export interface CbccAgentRunInput {
  projectId: string
  projectSlug: string
  stageNumber: number
  agentId: CbccAgentId
  requestedBy: string
  prompt?: string
  metadata?: Record<string, unknown>
}

export interface CbccAgentRuntimeContext {
  stageLocked: boolean
  lockReason?: string
  stageApproved: boolean
  stageTitle?: string
  // Engine-shaped values are erased to `unknown` here so the runtime stays
  // independent of the evidence ledger's internal shape — agents propose,
  // they don't persist, and only the engine knows the canonical types.
  requiredEvidence?: ReadonlyArray<unknown>
  existingEvidence?: ReadonlyArray<unknown>
  currentArtifact?: unknown
}

export interface CbccAgentRunOutput {
  status: CbccAgentRunStatus
  decision: CbccAgentRunDecision
  summary: string
  proposedArtifact?: unknown
  proposedEvidence?: ReadonlyArray<unknown>
  risks?: ReadonlyArray<string>
  blockers?: ReadonlyArray<string>
  recommendation?: string
  completedAt?: string
  error?: string
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
