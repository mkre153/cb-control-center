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

export interface PersistedStageApproval {
  stageNumber: number
  approved: boolean
  approvedAt: string | null
  approvedBy: string | null
}

export interface TranslateEngineProjectOptions {
  // Persisted owner approvals from the storage layer. When supplied, the
  // returned project + stage rows reflect persistence-overlaid-on-static
  // state — this is what makes refresh-stable approval flows possible.
  persistedApprovals?: ReadonlyArray<PersistedStageApproval>
}

export function translateEngineProjectToV2(
  engine: EngineProject,
  options: TranslateEngineProjectOptions = {},
): TranslatedProjectBundle {
  const persistedByNumber = new Map<number, PersistedStageApproval>(
    (options.persistedApprovals ?? []).map(p => [p.stageNumber, p]),
  )

  // Effective stage state: persisted approval overlays the engine's static
  // baseline. Stage 1 may be approved either by the engine's recorded
  // approval or by a persisted approval; either way the charter flips.
  const effectiveStage1 = (() => {
    const baseline = engine.stages.find(s => s.order === 1) ?? null
    const persisted = persistedByNumber.get(1)
    if (persisted?.approved) {
      return {
        approved: true,
        approvedAt: persisted.approvedAt,
        approvedBy: persisted.approvedBy,
      }
    }
    return {
      approved: baseline?.status === 'approved',
      approvedAt: baseline?.approval?.decidedAt ?? null,
      approvedBy: baseline?.approval?.decidedBy ?? null,
    }
  })()

  const charterApproved = effectiveStage1.approved
  const approvedAt = effectiveStage1.approvedAt
  const approvedBy = effectiveStage1.approvedBy

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

  const stages: ProjectStage[] = engine.stages.map(s => {
    const persisted = persistedByNumber.get(s.order)
    const isApproved = persisted?.approved ?? s.status === 'approved'
    return {
      id: `${engine.slug}-stage-${String(s.order).padStart(2, '0')}-${s.id}`,
      projectId: engine.id,
      stageNumber: s.order,
      stageKey: s.id,
      stageTitle: s.id,
      stageStatus: isApproved ? 'approved' : mapEngineStatusToV2(s.status),
      approved: isApproved,
      approvedAt: isApproved ? (persisted?.approvedAt ?? s.approval?.decidedAt ?? null) : null,
      approvedBy: isApproved ? (persisted?.approvedBy ?? s.approval?.decidedBy ?? null) : null,
      createdAt: engine.createdAt,
      updatedAt: engine.updatedAt,
    }
  })

  return { project, stages }
}

// Convenience for the DAP-specific route — single import site.
export function translateDapProjectForPipeline(
  options: TranslateEngineProjectOptions = {},
): TranslatedProjectBundle {
  return translateEngineProjectToV2(DAP_PROJECT, options)
}

export const TRANSLATOR_DAP_PROJECT_ID = DAP_PROJECT_ID
