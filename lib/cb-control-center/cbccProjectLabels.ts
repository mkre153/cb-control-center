import type { CbccProjectStatus } from './cbccProjectTypes'

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
