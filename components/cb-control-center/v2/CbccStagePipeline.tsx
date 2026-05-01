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

const STATUS_STYLE: Record<CbccStageStatus, string> = {
  locked:            'bg-gray-100 text-gray-400 border-gray-200',
  available:         'bg-blue-50 text-blue-700 border-blue-200',
  in_progress:       'bg-indigo-50 text-indigo-700 border-indigo-200',
  awaiting_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved:          'bg-green-50 text-green-700 border-green-200',
}

export function CbccStagePipeline({ project, stages }: Props) {
  const visibilities = computeStageVisibilities(project, stages)

  return (
    <div data-stage-pipeline className="space-y-2">
      {visibilities.map(vis => {
        const stage = stages.find(s => s.stageNumber === vis.stageNumber)
        const title = stage?.stageTitle ?? `Stage ${vis.stageNumber}`

        return (
          <div
            key={vis.stageNumber}
            data-stage-number={vis.stageNumber}
            data-stage-status={vis.status}
            className={`flex items-center justify-between px-4 py-3 border rounded-lg ${STATUS_STYLE[vis.status]}`}
          >
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs">{STATUS_LABEL[vis.status]}</span>
          </div>
        )
      })}
    </div>
  )
}
