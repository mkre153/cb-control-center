import {
  DAP_STAGE_GATES,
  getActiveStageGate,
  type DapStageGate,
  type DapStageStatus,
} from '@/lib/cb-control-center/dapStageGates'

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DapStageStatus, string> = {
  not_started:             'Not Started',
  ready_for_directive:     'Ready for Directive',
  directive_issued:        'Directive Issued',
  in_progress:             'In Progress',
  evidence_submitted:      'Evidence Submitted',
  validation_passed:       'Validation Passed',
  awaiting_owner_approval: 'Awaiting Owner Approval',
  approved:                'Approved',
  revision_requested:      'Revision Requested',
  blocked:                 'Blocked',
}

const STATUS_STYLE: Record<DapStageStatus, string> = {
  not_started:             'bg-gray-100 text-gray-400 border border-gray-200',
  ready_for_directive:     'bg-blue-50 text-blue-600 border border-blue-200',
  directive_issued:        'bg-indigo-100 text-indigo-700 border border-indigo-200',
  in_progress:             'bg-blue-100 text-blue-700 border border-blue-200',
  evidence_submitted:      'bg-cyan-100 text-cyan-700 border border-cyan-200',
  validation_passed:       'bg-teal-100 text-teal-700 border border-teal-200',
  awaiting_owner_approval: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved:                'bg-green-100 text-green-700 border border-green-200',
  revision_requested:      'bg-orange-100 text-orange-700 border border-orange-200',
  blocked:                 'bg-red-100 text-red-700 border border-red-200',
}

const STAGE_BASE = '/businesses/dental-advantage-plan/build/stages'

// ─── Stage overview card ──────────────────────────────────────────────────────

function StageOverviewCard({ stage, isActive }: { stage: DapStageGate; isActive: boolean }) {
  const isApproved = stage.status === 'approved'
  const isNotStarted = stage.status === 'not_started'
  const isAwaiting = stage.status === 'awaiting_owner_approval'
  const detailUrl = `${STAGE_BASE}/${stage.slug}`

  const ev = stage.implementationEvidence
  const evidenceSummary = ev.commit
    ? `${ev.branch ? `${ev.branch} · ` : ''}${ev.commit}${ev.tests ? ` · ${ev.tests}` : ''}`
    : ev.tests
    ? ev.tests
    : ev.branch
    ? ev.branch
    : null

  return (
    <div
      data-stage-overview-card
      data-stage-id={stage.stageId}
      data-stage-status={stage.status}
      data-stage-number={stage.stageNumber}
      className={`bg-white rounded-lg border px-4 py-3 flex items-center gap-4 ${
        isActive
          ? 'border-amber-300 shadow-sm ring-1 ring-amber-100'
          : isApproved
          ? 'border-green-200'
          : 'border-gray-200'
      } ${isNotStarted ? 'opacity-60' : ''}`}
    >
      {/* Stage number circle */}
      <div className={`shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
        isApproved
          ? 'bg-green-500 text-white'
          : isAwaiting
          ? 'bg-amber-400 text-white'
          : isNotStarted
          ? 'bg-gray-200 text-gray-400'
          : 'bg-blue-400 text-white'
      }`}>
        {stage.stageNumber}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{stage.title}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[stage.status]}`}>
            {STATUS_LABEL[stage.status]}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-snug line-clamp-1">{stage.description}</p>
        {evidenceSummary && (
          <p className="text-[10px] font-mono text-gray-400">{evidenceSummary}</p>
        )}
      </div>

      {/* Open full stage link */}
      <a
        href={detailUrl}
        data-open-stage-link={stage.slug}
        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded border transition-colors whitespace-nowrap ${
          isAwaiting
            ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
            : isApproved
            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
            : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {isAwaiting ? 'Review →' : 'Open →'}
      </a>
    </div>
  )
}

// ─── Pipeline overview ────────────────────────────────────────────────────────

export function StagePipelineOverview() {
  const active = getActiveStageGate()
  const approvedCount = DAP_STAGE_GATES.filter(s => s.approvedByOwner).length
  const total = DAP_STAGE_GATES.length
  const awaitingCount = DAP_STAGE_GATES.filter(s => s.status === 'awaiting_owner_approval').length

  return (
    <div data-stage-pipeline-overview className="space-y-4">
      {/* Header */}
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

      {/* Anti-bypass rule */}
      <div
        data-anti-bypass-rule
        className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 leading-relaxed"
      >
        <span className="font-semibold text-gray-700">Anti-bypass rule: </span>
        No DAP implementation phase may begin without a CBCC-issued directive for that stage.
        Each phase stops at evidence submission. Owner must approve before the next directive is issued.
      </div>

      {/* Stage cards */}
      <div className="space-y-2">
        {(DAP_STAGE_GATES as readonly DapStageGate[]).map(stage => (
          <StageOverviewCard
            key={stage.stageId}
            stage={stage}
            isActive={stage.stageId === active.stageId}
          />
        ))}
      </div>
    </div>
  )
}
