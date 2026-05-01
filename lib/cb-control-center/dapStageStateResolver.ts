// DAP stage state resolver.
//
// Bridges the engine's static project shape (DAP_PROJECT) and the
// persistence layer (DapStageApprovalStore) into a single read model the
// route handlers and translators consume.
//
// Two outputs from one input:
//   - buildDapEffectiveProject(): an engine CbccProject with persisted
//     approvals overlaid on the static stage statuses. Pass this to
//     isStageLocked / canStartStage / buildStagePageModel directly.
//   - resolveDapStageOverrides(): a Record<stageId, status> + matching
//     approvalOverrides map, ready to hand to the v1 translators.
//
// Pure functions; no IO. The store fetch happens in the route handler.

import type {
  CbccProject as EngineProject,
  CbccStage,
  CbccStageStatus,
} from '@/lib/cbcc/types'
import type { DapStageApproval } from './dapStageApprovalStore'

export interface DapStageOverrides {
  stageStatusOverrides: Record<string, CbccStageStatus>
  approvalOverrides: Record<string, { approvedAt: string | null; approvedBy: string | null }>
}

// Build the engine project with persisted approvals applied. The static
// baseline still drives non-approved stages, but any stage with a persisted
// `approved=true` record is forced to status='approved' with the persisted
// approval metadata attached.
export function buildDapEffectiveProject(
  staticProject: EngineProject,
  persisted: ReadonlyArray<DapStageApproval>,
): EngineProject {
  const persistedByNumber = new Map<number, DapStageApproval>(
    persisted.filter(p => p.approved).map(p => [p.stageNumber, p]),
  )

  const stages: CbccStage[] = staticProject.stages.map(s => {
    const p = persistedByNumber.get(s.order)
    if (!p) return s
    return {
      ...s,
      status: 'approved' as CbccStageStatus,
      approval: {
        decidedBy: p.approvedBy,
        decidedAt: p.approvedAt,
        notes: p.notes ?? undefined,
      },
    }
  })

  // Use the most recent approval timestamp as updatedAt so downstream cache
  // logic (e.g. evidence ledger seeding) uses a fresh-enough time.
  const latestApprovalTs = persisted
    .map(p => p.approvedAt)
    .filter((s): s is string => Boolean(s))
    .sort()
    .at(-1)

  return {
    ...staticProject,
    stages,
    updatedAt: latestApprovalTs ?? staticProject.updatedAt,
  }
}

// Per-stage override maps for the v1 translators. The engine project has
// `id`-based stage identifiers; translators key by the same.
export function resolveDapStageOverrides(
  staticProject: EngineProject,
  persisted: ReadonlyArray<DapStageApproval>,
): DapStageOverrides {
  const stageStatusOverrides: Record<string, CbccStageStatus> = {}
  const approvalOverrides: Record<string, { approvedAt: string | null; approvedBy: string | null }> = {}

  const byNumber = new Map<number, string>(staticProject.stages.map(s => [s.order, s.id]))

  for (const p of persisted) {
    if (!p.approved) continue
    const stageId = byNumber.get(p.stageNumber)
    if (!stageId) continue
    stageStatusOverrides[stageId] = 'approved'
    approvalOverrides[stageId] = {
      approvedAt: p.approvedAt ?? null,
      approvedBy: p.approvedBy ?? null,
    }
  }

  return { stageStatusOverrides, approvalOverrides }
}
