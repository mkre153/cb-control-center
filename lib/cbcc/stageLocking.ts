// CBCC generic engine — stage locking logic
//
// Pure functions that decide whether a stage is unlocked, given a project's
// stage list. No DB, no side effects, no project-specific behavior.
//
// Locking rule:
//   - The lowest-ordered stage is always unlocked when the project is active
//     or draft (configurable via opts.allowFirstStageWhenDraft).
//   - Stage N is unlocked iff stage N-1 is approved.
//   - A rejected or blocked stage prevents *all* downstream unlock.
//   - Locked stages remain readable; this layer reports lock state, not
//     visibility.

import type { CbccProject, CbccStage, CbccStageId, CbccStageStatus } from './types'

export interface LockingOptions {
  // If true, the first stage is unlocked while the project is in draft as
  // well as active. Defaults to true — callers wanting a stricter regime
  // (e.g. require an explicit kickoff) can opt out.
  allowFirstStageWhenDraft?: boolean
}

const DEFAULTS: Required<LockingOptions> = {
  allowFirstStageWhenDraft: true,
}

function ordered(stages: ReadonlyArray<CbccStage>): CbccStage[] {
  return [...stages].sort((a, b) => a.order - b.order)
}

function findStage(project: CbccProject, stageId: CbccStageId): CbccStage | null {
  return project.stages.find(s => s.id === stageId) ?? null
}

function isProjectActiveForStages(project: CbccProject, opts: Required<LockingOptions>): boolean {
  if (project.status === 'active') return true
  if (project.status === 'draft' && opts.allowFirstStageWhenDraft) return true
  return false
}

const BLOCKING_STATUSES: ReadonlySet<CbccStageStatus> = new Set(['rejected', 'blocked'])

export interface LockReason {
  locked: boolean
  reason?: string
}

export function getStageLockReason(
  project: CbccProject,
  stageId: CbccStageId,
  options: LockingOptions = {},
): LockReason {
  const opts = { ...DEFAULTS, ...options }
  const target = findStage(project, stageId)
  if (!target) return { locked: true, reason: `stage "${stageId}" not found in project` }

  if (!isProjectActiveForStages(project, opts) && project.status !== 'draft') {
    return { locked: true, reason: `project is ${project.status}` }
  }

  const sorted = ordered(project.stages)
  const idx = sorted.findIndex(s => s.id === stageId)

  // First stage: unlocked when project is active (or draft if allowed).
  if (idx === 0) {
    if (!isProjectActiveForStages(project, opts)) {
      return { locked: true, reason: `project is ${project.status}` }
    }
    return { locked: false }
  }

  // Any prior stage with a blocking status keeps this stage locked.
  for (let i = 0; i < idx; i++) {
    const prior = sorted[i]
    if (BLOCKING_STATUSES.has(prior.status)) {
      return { locked: true, reason: `stage "${prior.id}" is ${prior.status}` }
    }
  }

  // The immediate predecessor must be approved.
  const predecessor = sorted[idx - 1]
  if (predecessor.status !== 'approved') {
    return {
      locked: true,
      reason: `predecessor stage "${predecessor.id}" is ${predecessor.status}, not approved`,
    }
  }

  return { locked: false }
}

export function isStageLocked(
  project: CbccProject,
  stageId: CbccStageId,
  options?: LockingOptions,
): boolean {
  return getStageLockReason(project, stageId, options).locked
}

export function getUnlockedStages(
  project: CbccProject,
  options?: LockingOptions,
): ReadonlyArray<CbccStage> {
  const sorted = ordered(project.stages)
  return sorted.filter(s => !isStageLocked(project, s.id, options))
}

export function getNextUnlockedStage(
  project: CbccProject,
  options?: LockingOptions,
): CbccStage | null {
  const sorted = ordered(project.stages)
  for (const stage of sorted) {
    // Skip terminal states — these are not "next" candidates.
    if (stage.status === 'approved') continue
    if (stage.status === 'rejected' || stage.status === 'blocked') continue
    if (!isStageLocked(project, stage.id, options)) return stage
  }
  return null
}

// canStartStage = unlocked AND in a status that permits transitioning to
// in_progress (i.e. not_started or locked-with-no-blocker). Approved/rejected
// stages cannot be re-started here.
export function canStartStage(
  project: CbccProject,
  stageId: CbccStageId,
  options?: LockingOptions,
): { ok: boolean; reason?: string } {
  const target = findStage(project, stageId)
  if (!target) return { ok: false, reason: `stage "${stageId}" not found in project` }
  const lock = getStageLockReason(project, stageId, options)
  if (lock.locked) return { ok: false, reason: lock.reason }
  if (target.status === 'approved' || target.status === 'rejected') {
    return { ok: false, reason: `stage is already ${target.status}` }
  }
  return { ok: true }
}
