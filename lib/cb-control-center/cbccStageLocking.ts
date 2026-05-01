import type { CbccProject, CbccStageStatus, ProjectStage, StageVisibility } from './cbccProjectTypes'

export function computeStageVisibilities(
  project: Pick<CbccProject, 'charterApproved'>,
  stages: readonly Pick<ProjectStage, 'stageNumber' | 'approved' | 'stageStatus'>[],
): StageVisibility[] {
  if (!project.charterApproved) {
    return stages.map(s => ({
      stageNumber: s.stageNumber,
      status: 'locked' as CbccStageStatus,
      reason: 'Step 0 charter not yet approved',
    }))
  }

  const sorted = [...stages].sort((a, b) => a.stageNumber - b.stageNumber)

  return sorted.map(stage => {
    if (stage.stageNumber === 1) {
      return { stageNumber: 1, status: stage.stageStatus }
    }

    // Sequential enforcement: ALL prior stages must have approved=true in DB.
    // Out-of-order DB approvals (e.g., stage 3 approved while stage 2 is not)
    // are ignored — the chain must be unbroken from stage 1 to stage N-1.
    const priorAllApproved = sorted
      .filter(s => s.stageNumber < stage.stageNumber)
      .every(s => s.approved === true)

    if (!priorAllApproved) {
      return {
        stageNumber: stage.stageNumber,
        status: 'locked' as CbccStageStatus,
        reason: `Prior stage not yet approved`,
      }
    }

    return { stageNumber: stage.stageNumber, status: stage.stageStatus }
  })
}
