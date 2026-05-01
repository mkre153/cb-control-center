// Translator: engine `CbccProject` (DAP adapter) → v2-shaped CbccProject and
// ProjectStage[] consumed by <CbccProjectRegistry> and <CbccStagePipeline>.
//
// The v2 UI components were written against the Supabase row shape
// (cbccProjectTypes.ts). Rather than rewrite them, we project DAP_PROJECT
// down into the same shape so the existing pipeline + visibilities pass
// through unchanged.

import type { CbccProject as EngineProject, CbccStage as EngineStage } from '@/lib/cbcc/types'
import { DAP_PROJECT, DAP_PROJECT_ID } from '@/lib/cbcc/adapters/dap'
import type {
  CbccProject as V2Project,
  CbccStageStatus as V2StageStatus,
  ProjectCharter,
  ProjectStage,
} from './cbccProjectTypes'

// Engine status (7 values) → v2 status (5 values).
//
//   approved                 → approved
//   awaiting_owner_approval  → awaiting_approval
//   in_progress              → in_progress
//   not_started              → available    (visibility layer locks it if predecessors aren't approved)
//   locked                   → locked
//   rejected | blocked       → locked       (v2 has no closer state)
export function mapEngineStatusToV2(status: EngineStage['status']): V2StageStatus {
  switch (status) {
    case 'approved':
      return 'approved'
    case 'awaiting_owner_approval':
      return 'awaiting_approval'
    case 'in_progress':
      return 'in_progress'
    case 'not_started':
      return 'available'
    case 'locked':
    case 'rejected':
    case 'blocked':
      return 'locked'
  }
}

// Synthesize a v2 ProjectCharter from the engine project metadata. The DAP
// adapter doesn't track a separate "charter" concept — Stage 1 already serves
// that role — so we surface a thin charter that matches the v2 shape and
// flips downstream UI flags into the post-charter state.
function buildSyntheticCharter(engine: EngineProject): ProjectCharter {
  return {
    whatThisIs: engine.description ?? engine.name,
    whatThisIsNot: '',
    whoItServes: '',
    allowedClaims: [],
    forbiddenClaims: [],
    requiredEvidence: [],
    approvalAuthority: 'Owner',
    presetStages: [],
  }
}

export interface TranslatedProjectBundle {
  project: V2Project
  stages: ProjectStage[]
}

export function translateEngineProjectToV2(engine: EngineProject): TranslatedProjectBundle {
  const stage1 = engine.stages.find(s => s.order === 1) ?? null
  const charterApproved = stage1?.status === 'approved'
  const approvedAt = stage1?.approval?.decidedAt ?? null
  const approvedBy = stage1?.approval?.decidedBy ?? null

  const project: V2Project = {
    id: engine.id,
    slug: engine.slug,
    name: engine.name,
    businessType: null,
    primaryGoal: null,
    targetCustomer: null,
    knownConstraints: null,
    forbiddenClaims: null,
    sourceUrlsNotes: null,
    desiredOutputType: null,
    approvalOwner: 'Owner',
    charterJson: buildSyntheticCharter(engine),
    charterGeneratedAt: engine.createdAt,
    charterModel: 'engine-adapter',
    charterApproved,
    charterApprovedAt: charterApproved ? approvedAt : null,
    charterApprovedBy: charterApproved ? approvedBy : null,
    charterVersion: 1,
    charterHash: null,
    projectStatus: charterApproved ? 'in_progress' : 'step_0_charter_ready',
    createdAt: engine.createdAt,
    updatedAt: engine.updatedAt,
  }

  const stages: ProjectStage[] = engine.stages.map(s => ({
    id: `${engine.slug}-stage-${String(s.order).padStart(2, '0')}-${s.id}`,
    projectId: engine.id,
    stageNumber: s.order,
    stageKey: s.id,
    stageTitle: s.id,
    stageStatus: mapEngineStatusToV2(s.status),
    approved: s.status === 'approved',
    approvedAt: s.approval?.decidedAt ?? null,
    approvedBy: s.approval?.decidedBy ?? null,
    createdAt: engine.createdAt,
    updatedAt: engine.updatedAt,
  }))

  return { project, stages }
}

// Convenience for the DAP-specific route — single import site.
export function translateDapProjectForPipeline(): TranslatedProjectBundle {
  return translateEngineProjectToV2(DAP_PROJECT)
}

export const TRANSLATOR_DAP_PROJECT_ID = DAP_PROJECT_ID
