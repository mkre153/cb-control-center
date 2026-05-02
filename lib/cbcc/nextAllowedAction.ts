// CBCC generic engine — next-allowed-action engine (Part 10)
//
// Pure function that answers "what is the next legal thing for this project?"
// — given a project, an evidence ledger, and the per-stage requirement set
// supplied by the adapter. The engine never invents requirements; the
// adapter does.
//
// Determinism rules:
//   1. Walk stages in order.
//   2. Skip stages whose status is 'approved' or 'rejected' (those are done
//      or terminal).
//   3. The first non-terminal stage drives the answer:
//        a. If locked by predecessor → 'work_blocked'.
//        b. If unlocked but required evidence is missing →
//           'generate_required_artifact' for the first missing requirement.
//        c. If unlocked and all required evidence is present →
//           'submit_for_owner_approval' when status is 'in_progress' or
//           'not_started', else 'approve_stage' when status is
//           'awaiting_owner_approval'.
//   4. If every stage is approved → 'project_complete'.
//
// The function never calls AI, never mutates state, and runs in O(stages).

import type {
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccProject,
  CbccStageDefinition,
  CbccStageId,
} from './types'
import { getStageLockReason } from './stageLocking'

export type CbccNextAllowedAction =
  | {
      kind: 'generate_required_artifact'
      projectSlug: string
      stageNumber: number
      stageId: CbccStageId
      requiredEvidenceId: string
      label: string
    }
  | {
      kind: 'submit_for_owner_approval'
      projectSlug: string
      stageNumber: number
      stageId: CbccStageId
    }
  | {
      kind: 'approve_stage'
      projectSlug: string
      stageNumber: number
      stageId: CbccStageId
    }
  | {
      kind: 'work_blocked'
      projectSlug: string
      stageNumber: number
      stageId: CbccStageId
      reason: string
      missingEvidence?: ReadonlyArray<string>
    }
  | {
      kind: 'project_complete'
      projectSlug: string
    }

export interface GetNextAllowedActionInput {
  project: CbccProject
  stageDefinitions: ReadonlyArray<CbccStageDefinition>
  // Map from stage definition id → required evidence requirements for that
  // stage. Adapters supply this. Stages without an entry are treated as
  // having zero requirements.
  evidenceRequirementsByStage: Readonly<Record<string, ReadonlyArray<CbccEvidenceRequirement>>>
  evidenceLedger: CbccEvidenceLedger
}

export function getNextAllowedAction(input: GetNextAllowedActionInput): CbccNextAllowedAction {
  const { project } = input
  const sorted = [...project.stages].sort((a, b) => a.order - b.order)

  for (const stage of sorted) {
    if (stage.status === 'approved') continue
    if (stage.status === 'rejected') continue

    const def = input.stageDefinitions.find(d => d.id === stage.id)
    const stageNumber = stage.order

    // 3a. Locked by predecessor or other lock condition.
    const lock = getStageLockReason(project, stage.id)
    if (lock.locked) {
      return {
        kind: 'work_blocked',
        projectSlug: project.slug,
        stageNumber,
        stageId: stage.id,
        reason: lock.reason ?? 'locked',
      }
    }

    // 3b. Required evidence missing.
    const requirements = input.evidenceRequirementsByStage[stage.id] ?? []
    const scoped = input.evidenceLedger.filter(
      e => e.projectId === project.id && e.stageId === stage.id,
    )
    const missing = requirements
      .filter(r => r.required)
      .filter(r => !scoped.some(e => e.id === r.id && e.status === 'valid'))

    if (missing.length > 0) {
      const first = missing[0]!
      return {
        kind: 'generate_required_artifact',
        projectSlug: project.slug,
        stageNumber,
        stageId: stage.id,
        requiredEvidenceId: first.id,
        label: first.title || first.id,
      }
    }

    // 3c. Unlocked + evidence present → either submit or approve depending on status.
    if (stage.status === 'awaiting_owner_approval') {
      return {
        kind: 'approve_stage',
        projectSlug: project.slug,
        stageNumber,
        stageId: stage.id,
      }
    }
    // not_started / in_progress / blocked-but-not-locked / locked-but-not-locked-here
    void def
    return {
      kind: 'submit_for_owner_approval',
      projectSlug: project.slug,
      stageNumber,
      stageId: stage.id,
    }
  }

  // 4. Every stage approved (or only rejected stages remain — treat as complete-ish).
  return { kind: 'project_complete', projectSlug: project.slug }
}
