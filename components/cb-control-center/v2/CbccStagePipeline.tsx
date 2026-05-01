import { computeStageVisibilities } from '@/lib/cb-control-center/cbccStageLocking'
import type { CbccProject, CbccStageStatus, ProjectStage } from '@/lib/cb-control-center/cbccProjectTypes'

interface Props {
  project: Pick<CbccProject, 'charterApproved'>
  stages: ProjectStage[]
}

const STATUS_LABEL: Record<CbccStageStatus, string> = {
  locked:            'Stage Locked',
  available:         'Available',
  in_progress:       'In Progress',
  awaiting_approval: 'Awaiting Approval',
  approved:          'Approved',
}

const STATUS_COLOR: Record<CbccStageStatus, string> = {
  locked:            'text-gray-600',
  available:         'text-blue-400',
  in_progress:       'text-indigo-400',
  awaiting_approval: 'text-amber-400',
  approved:          'text-green-400',
}

export function CbccStagePipeline({ project, stages }: Props) {
  const visibilities = computeStageVisibilities(project, stages)

  return (
    <div data-stage-pipeline className="space-y-1.5">
      {visibilities.map(vis => {
        const stage = stages.find(s => s.stageNumber === vis.stageNumber)
        const title = stage?.stageTitle ?? `Stage ${vis.stageNumber}`
        const isLocked = vis.status === 'locked'

        return (
          <div
            key={vis.stageNumber}
            data-stage-number={vis.stageNumber}
            data-stage-status={vis.status}
            className={`flex items-center justify-between px-4 py-2.5 border rounded font-mono text-sm ${
              isLocked
                ? 'border-[#1e2d45] bg-[#0f1520]'
                : 'border-[#1e3a5f] bg-[#0f1f35]'
            }`}
          >
            <span className={isLocked ? 'text-gray-600' : 'text-gray-300'}>{title}</span>
            <span className={`text-xs ${STATUS_COLOR[vis.status]}`}>
              {STATUS_LABEL[vis.status]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
