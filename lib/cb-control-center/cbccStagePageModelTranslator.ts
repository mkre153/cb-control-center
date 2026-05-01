// Translator: engine `CbccStagePageModel` (+ DAP adapter context) → v1 `DapStageGate`
// consumed by <StageDetailPage>.
//
// The engine's page model carries the deterministic locking / approval / blocker
// computation. <StageDetailPage> renders against the v1 `DapStageGate` shape.
// This module bridges the two without touching either side.

import type {
  CbccProject as EngineProject,
  CbccStageDefinition as EngineStageDefinition,
  CbccStagePageModel,
  CbccStageStatus as EngineStageStatus,
} from '@/lib/cbcc/types'
import { buildStagePageModel } from '@/lib/cbcc/index'
import {
  DAP_PROJECT,
  DAP_PROJECT_ID,
  DAP_STAGE_DEFINITIONS,
  getDapEvidenceForStage,
  getDapStageArtifact,
  seedDapEvidenceLedger,
} from '@/lib/cbcc/adapters/dap'
import type {
  DapStageEvidence,
  DapStageGate,
  DapStageStatus,
} from './dapStageGates'
import type { StageArtifact } from './dapBusinessDefinition'

// Engine status → v1 DapStageStatus. The v1 enum has 10 values; the engine
// has 7. We map conservatively — anything the engine considers "not started
// but unlocked" surfaces as 'ready_for_directive' so the badge differs from
// "Not Started" when stage 1 is approved and stage 2 is actionable.
function mapEngineStatusToV1(status: EngineStageStatus, locked: boolean): DapStageStatus {
  if (locked) return 'not_started'
  switch (status) {
    case 'approved':
      return 'approved'
    case 'awaiting_owner_approval':
      return 'awaiting_owner_approval'
    case 'in_progress':
      return 'in_progress'
    case 'rejected':
      return 'revision_requested'
    case 'blocked':
      return 'blocked'
    case 'locked':
      return 'not_started'
    case 'not_started':
      return 'ready_for_directive'
  }
}

// Inline evidence items → v1 DapStageEvidence summary.
function buildEvidenceSummary(stageId: string): DapStageEvidence {
  const items = getDapEvidenceForStage(stageId)
  if (items.length === 0) return {}
  const first = (type: string) => items.find(i => i.type === type)?.value
  return {
    branch: first('git_branch'),
    commit: first('git_commit'),
    tests: first('test'),
    previewUrl: first('external_url'),
    filesChanged: items.filter(i => i.type === 'file').map(i => i.value),
  }
}

export interface BuildDapStageGateOptions {
  // Override the project for tests that exercise non-DAP locking paths.
  project?: EngineProject
  // Override the stage definitions array for tests.
  stageDefinitions?: ReadonlyArray<EngineStageDefinition>
}

export function buildDapStageGateFromEngine(
  stageNumber: number,
  options: BuildDapStageGateOptions = {},
): DapStageGate | null {
  const project = options.project ?? DAP_PROJECT
  const definitions = options.stageDefinitions ?? DAP_STAGE_DEFINITIONS

  const def = definitions.find(d => d.order === stageNumber) ?? null
  if (!def) return null

  const stageInstance = project.stages.find(s => s.order === stageNumber)
  if (!stageInstance) return null

  // Engine page model assembles locking + evidence. We pass the project's own
  // stage statuses so locking matches the adapter's recorded state.
  const stageStatuses = Object.fromEntries(
    project.stages.map(s => [s.id, s.status]),
  ) as Record<string, EngineStageStatus>

  // Seed the ledger from the adapter's known inline evidence so the page
  // model reflects what the adapter advertises. Status='valid' marks them
  // as engine-acceptable for any future evidence requirements.
  const ledger = seedDapEvidenceLedger(def.id, { now: project.updatedAt })

  const model: CbccStagePageModel = buildStagePageModel({
    projectId: project.id,
    stages: definitions,
    currentStageId: def.id,
    stageStatuses,
    evidenceLedger: ledger,
    evidenceRequirements: [],
    projectStatus: project.status,
  })

  const artifact = getDapStageArtifact(def.id)

  return translateModelToGate({
    model,
    definition: def,
    stageNumber,
    artifact,
    approvedAt: stageInstance.approval?.decidedAt ?? null,
    approvedBy: stageInstance.approval?.decidedBy ?? null,
  })
}

export interface TranslateModelToGateInput {
  model: CbccStagePageModel
  definition: EngineStageDefinition
  stageNumber: number
  artifact: unknown
  approvedAt: string | null
  approvedBy: string | null
}

export function translateModelToGate(input: TranslateModelToGateInput): DapStageGate {
  const { model, definition, stageNumber, artifact, approvedAt } = input

  const v1Status = mapEngineStatusToV1(model.stageStatus, model.lock.isLocked)
  const isApproved = model.stageStatus === 'approved'

  const blockers: string[] = model.blockers
    .filter(b => b.severity === 'blocking')
    .map(b => b.message)

  return {
    stageId: `dap-stage-${String(stageNumber).padStart(2, '0')}-${definition.id}`,
    stageNumber,
    slug: String(stageNumber),
    title: definition.title,
    description: definition.description,
    whyItMatters: definition.purpose ?? '',
    filesExpected: [],
    status: v1Status,
    directiveIssued: false,
    directive: '',
    approvedByOwner: isApproved,
    approvedAt: isApproved ? approvedAt : null,
    nextStageUnlocked: isApproved && !model.navigation.isLastStage,
    requirements: definition.requirements.map(r => r.label),
    implementationEvidence: buildEvidenceSummary(definition.id),
    requiredApprovals: [...definition.requiredApprovals],
    blockers,
    artifact: (artifact ?? undefined) as StageArtifact | undefined,
  }
}

export const TRANSLATOR_DAP_PROJECT_ID = DAP_PROJECT_ID
