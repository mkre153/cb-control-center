import {
  DAP_STAGE_GATES,
  getActiveStageGate,
  type DapStageGate,
} from '@/lib/cb-control-center/dapStageGates'
import { StageOverviewCard } from './StageOverviewCard'
import { AntiBypassBanner } from './AntiBypassBanner'

const STAGE_BASE = '/businesses/dental-advantage-plan/build/stages'

export function StagePipelineOverview() {
  const active = getActiveStageGate()
  const approvedCount = DAP_STAGE_GATES.filter(s => s.approvedByOwner).length
  const total = DAP_STAGE_GATES.length
  const awaitingCount = DAP_STAGE_GATES.filter(s => s.status === 'awaiting_owner_approval').length

  return (
    <div data-stage-pipeline-overview className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">DAP Stage Gate Pipeline</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {approvedCount} of {total} stages approved
            {awaitingCount > 0 && (
              <span className="ml-2 text-amber-500">· {awaitingCount} awaiting owner review</span>
            )}
          </p>
        </div>
        <span
          data-stage-gate-active-id={active.stageId}
          className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5"
        >
          Active: Stage {active.stageNumber} — {active.title}
        </span>
      </div>

      <AntiBypassBanner />

      <div className="space-y-2">
        {(DAP_STAGE_GATES as readonly DapStageGate[]).map(stage => (
          <StageOverviewCard
            key={stage.stageId}
            stage={stage}
            isActive={stage.stageId === active.stageId}
            detailHref={`${STAGE_BASE}/${stage.slug}`}
          />
        ))}
      </div>
    </div>
  )
}
