import { computeStageVisibilities } from '@/lib/cb-control-center/cbccStageLocking'
import {
  computeStep0State,
  STEP_0_LABEL,
  STEP_0_ACTION_LABEL,
  type Step0State,
} from '@/lib/cb-control-center/cbccProjectLabels'
import { buildAllGenericStageGates } from '@/lib/cb-control-center/cbccProjectStageAdapter'
import type { CbccProject, ProjectStage } from '@/lib/cb-control-center/cbccProjectTypes'
import { StageOverviewCard } from '../StageOverviewCard'
import { AntiBypassBanner } from '../AntiBypassBanner'

interface Props {
  project: Pick<CbccProject, 'slug' | 'charterApproved' | 'charterJson'>
  stages: ProjectStage[]
}

const STEP_0_STYLE: Record<Step0State, string> = {
  no_charter:        'bg-gray-100 text-gray-500 border border-gray-200',
  awaiting_approval: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved:          'bg-green-100 text-green-700 border border-green-200',
}

function Step0OverviewCard({
  state,
  charterHref,
}: {
  state: Step0State
  charterHref: string
}) {
  const isApproved = state === 'approved'
  const isAwaiting = state === 'awaiting_approval'
  const isEmpty = state === 'no_charter'

  return (
    <div
      data-step-zero-card
      data-step-zero-status={state}
      className={`bg-white rounded-lg border px-4 py-3 flex items-center gap-4 ${
        isApproved
          ? 'border-green-200'
          : isAwaiting
          ? 'border-amber-300 shadow-sm ring-1 ring-amber-100'
          : 'border-gray-200'
      } ${isEmpty ? 'opacity-90' : ''}`}
    >
      <div className={`shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
        isApproved
          ? 'bg-green-500 text-white'
          : isAwaiting
          ? 'bg-amber-400 text-white'
          : 'bg-gray-300 text-white'
      }`}>
        0
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">Step 0 — Project Charter</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STEP_0_STYLE[state]}`}>
            {STEP_0_LABEL[state]}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-snug line-clamp-1">
          Owner-approved charter that defines what this project is, who it serves, and what claims are allowed before Stage 1 can begin.
        </p>
      </div>

      <a
        href={charterHref}
        data-open-step-zero-link
        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded border transition-colors whitespace-nowrap ${
          isAwaiting
            ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
            : isApproved
            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
            : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {STEP_0_ACTION_LABEL[state]} →
      </a>
    </div>
  )
}

export function CbccStagePipeline({ project, stages }: Props) {
  const step0State = computeStep0State(project)
  const visibilities = computeStageVisibilities(project, stages)

  // Build display rows for stages 1–7. We always render exactly 7 cards even
  // if some DB rows are missing — the stage definition supplies a fallback
  // shell so the pipeline never collapses to fewer than 7 cards.
  const overviewByNumber = new Map(
    buildAllGenericStageGates(project, stages).map(g => [g.stageNumber, g]),
  )

  const stageBase = `/projects/${project.slug}/stages`
  const charterHref = `/projects/${project.slug}/charter`

  return (
    <div data-stage-pipeline className="space-y-4">
      <AntiBypassBanner />

      <div className="space-y-2">
        <Step0OverviewCard state={step0State} charterHref={charterHref} />

        {visibilities.map(vis => {
          const stage = overviewByNumber.get(vis.stageNumber)
          if (!stage) return null

          return (
            <div
              key={vis.stageNumber}
              data-cbcc-stage-row
              data-cbcc-stage-number={vis.stageNumber}
              data-cbcc-stage-status={vis.status}
            >
              <StageOverviewCard
                stage={stage}
                isActive={vis.status === 'awaiting_approval' || vis.status === 'in_progress'}
                detailHref={`${stageBase}/${vis.stageNumber}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
