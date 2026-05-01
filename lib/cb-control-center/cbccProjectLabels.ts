import type { CbccProject, CbccProjectStatus } from './cbccProjectTypes'

export const PROJECT_STATUS_LABEL: Record<CbccProjectStatus, string> = {
  step_0_draft:         'Charter Draft',
  step_0_charter_ready: 'Awaiting Approval',
  step_0_approved:      'Stage 1 Available',
  in_progress:          'In Progress',
  completed:            'Completed',
  archived:             'Archived',
}

export function projectProgressPct(status: CbccProjectStatus): number {
  switch (status) {
    case 'step_0_draft':         return 0
    case 'step_0_charter_ready': return 10
    case 'step_0_approved':      return 15
    case 'in_progress':          return 50
    case 'completed':            return 100
    case 'archived':             return 100
  }
}

// ─── Step 0 (Project Charter) ─────────────────────────────────────────────────
//
// Step 0 sits BEFORE Stage 1 in the pipeline. It owns the project charter:
// charter generation → owner review → owner approval. Once approved, Stage 1
// unlocks. Step 0's three states are derived from `charterApproved` +
// `charterJson` so the UI can render a card without a separate status column.

export type Step0State = 'no_charter' | 'awaiting_approval' | 'approved'

export function computeStep0State(
  project: Pick<CbccProject, 'charterApproved' | 'charterJson'>,
): Step0State {
  if (project.charterApproved) return 'approved'
  if (project.charterJson) return 'awaiting_approval'
  return 'no_charter'
}

export const STEP_0_LABEL: Record<Step0State, string> = {
  no_charter:        'Charter Not Generated',
  awaiting_approval: 'Awaiting Owner Approval',
  approved:          'Charter Approved',
}

export const STEP_0_ACTION_LABEL: Record<Step0State, string> = {
  no_charter:        'Generate Charter',
  awaiting_approval: 'Review Charter',
  approved:          'View Charter',
}
