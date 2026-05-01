import type { DapStageGate, DapStageStatus } from '@/lib/cb-control-center/dapStageGates'

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

export function StageOverviewCard({
  stage,
  isActive,
  detailHref,
}: {
  stage: DapStageGate
  isActive: boolean
  detailHref: string
}) {
  const isApproved = stage.status === 'approved'
  const isNotStarted = stage.status === 'not_started'
  const isAwaiting = stage.status === 'awaiting_owner_approval'

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

      <a
        href={detailHref}
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
