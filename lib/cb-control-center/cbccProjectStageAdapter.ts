// CBCC v2 — Stage adapter
//
// Two-tier project model:
//   Tier 1 (DAP): rich content lives in DAP_STAGE_GATES; we look up by stage
//     number and return that v1 record verbatim (it is already the canonical
//     DapStageGate shape).
//   Tier 2 (generic v2 projects): no rich registry exists. We construct a
//     DapStageGate-shaped object on the fly from the canonical
//     CBCC_STAGE_DEFINITIONS entry plus the project's stage row.
//
// Both branches return the same DapStageGate type so a single StageDetailPage
// component renders both.

import type { DapStageGate, DapStageStatus } from './dapStageGates'
import { DAP_STAGE_GATES } from './dapStageGates'
import { CBCC_STAGE_DEFINITIONS, getStageDefinitionByNumber } from './cbccStageDefinitions'
import type { CbccProject, CbccStageStatus, ProjectStage } from './cbccProjectTypes'

// 5-state v2 enum → 10-state v1 enum (subset). Generic v2 stages never enter
// directive_issued / evidence_submitted / validation_passed / revision_requested
// / blocked because no AI directive system exists yet for non-DAP projects.
const V2_TO_V1_STATUS: Record<CbccStageStatus, DapStageStatus> = {
  locked:            'not_started',
  available:         'ready_for_directive',
  in_progress:       'in_progress',
  awaiting_approval: 'awaiting_owner_approval',
  approved:          'approved',
}

export function buildDapStageGate(stageNumber: number): DapStageGate | null {
  const found = DAP_STAGE_GATES.find(s => s.stageNumber === stageNumber)
  return (found as DapStageGate) ?? null
}

export function buildGenericStageGate(
  project: Pick<CbccProject, 'slug'>,
  row: Pick<ProjectStage, 'stageNumber' | 'stageStatus' | 'approved' | 'approvedAt' | 'approvedBy'>,
  definition?: ReturnType<typeof getStageDefinitionByNumber>,
): DapStageGate | null {
  const def = definition ?? getStageDefinitionByNumber(row.stageNumber)
  if (!def) return null

  const v1Status = V2_TO_V1_STATUS[row.stageStatus]
  const isApproved = row.approved && row.stageStatus === 'approved'

  return {
    stageId: `${project.slug}-stage-${String(row.stageNumber).padStart(2, '0')}-${def.key}`,
    stageNumber: row.stageNumber,
    slug: String(row.stageNumber),
    title: def.title,
    description: def.description,
    whyItMatters: def.whyItMatters,
    filesExpected: [],
    status: v1Status,
    directiveIssued: false,
    directive: '',
    approvedByOwner: isApproved,
    approvedAt: row.approvedAt,
    nextStageUnlocked: isApproved,
    requirements: def.requirements,
    implementationEvidence: {},
    requiredApprovals: def.requiredApprovals,
    blockers: [],
    artifact: undefined,
  }
}

// Convenience for project overview pages that need all 7 stages built at once.
export function buildAllGenericStageGates(
  project: Pick<CbccProject, 'slug'>,
  rows: ReadonlyArray<Pick<ProjectStage, 'stageNumber' | 'stageStatus' | 'approved' | 'approvedAt' | 'approvedBy'>>,
): DapStageGate[] {
  const byNumber = new Map(rows.map(r => [r.stageNumber, r]))
  const result: DapStageGate[] = []
  for (const def of CBCC_STAGE_DEFINITIONS) {
    const row = byNumber.get(def.number)
    if (!row) continue
    const gate = buildGenericStageGate(project, row, def)
    if (gate) result.push(gate)
  }
  return result
}
