import {
  DAP_STAGE_GATES,
  getActiveStageGate,
  type DapStageGate,
  type DapStageStatus,
  type DapStageEvidence,
} from '@/lib/cb-control-center/dapStageGates'
import { StageArtifactPanel } from './StageArtifactPanel'

// ─── Status display ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DapStageStatus, string> = {
  not_started:              'Not Started',
  ready_for_directive:      'Ready for Directive',
  directive_issued:         'Directive Issued',
  in_progress:              'In Progress',
  evidence_submitted:       'Evidence Submitted',
  validation_passed:        'Validation Passed',
  awaiting_owner_approval:  'Awaiting Owner Approval',
  approved:                 'Approved',
  revision_requested:       'Revision Requested',
  blocked:                  'Blocked',
}

const STATUS_STYLE: Record<DapStageStatus, string> = {
  not_started:              'bg-gray-100 text-gray-400 border border-gray-200',
  ready_for_directive:      'bg-blue-50 text-blue-600 border border-blue-200',
  directive_issued:         'bg-indigo-100 text-indigo-700 border border-indigo-200',
  in_progress:              'bg-blue-100 text-blue-700 border border-blue-200',
  evidence_submitted:       'bg-cyan-100 text-cyan-700 border border-cyan-200',
  validation_passed:        'bg-teal-100 text-teal-700 border border-teal-200',
  awaiting_owner_approval:  'bg-amber-100 text-amber-700 border border-amber-200',
  approved:                 'bg-green-100 text-green-700 border border-green-200',
  revision_requested:       'bg-orange-100 text-orange-700 border border-orange-200',
  blocked:                  'bg-red-100 text-red-700 border border-red-200',
}

// ─── Evidence block ───────────────────────────────────────────────────────────

function EvidenceBlock({ ev, stageId }: { ev: DapStageEvidence; stageId: string }) {
  const hasAny = ev.branch || ev.commit || ev.tests || ev.previewUrl ||
    (ev.filesChanged && ev.filesChanged.length > 0)
  if (!hasAny) return null
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Evidence</p>
      {ev.branch && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">Branch</span>
          <span className="font-mono text-gray-700">{ev.branch}</span>
        </div>
      )}
      {ev.commit && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">Commit</span>
          <span className="font-mono text-gray-700">{ev.commit}</span>
        </div>
      )}
      {ev.tests && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">Tests</span>
          <span className="font-mono text-green-700">{ev.tests}</span>
        </div>
      )}
      {ev.previewUrl && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">Preview</span>
          <span className="font-mono text-indigo-600">{ev.previewUrl || '—'}</span>
        </div>
      )}
      {ev.filesChanged && ev.filesChanged.length > 0 && (
        <div className="flex gap-2 items-start">
          <span className="text-gray-400 w-14 shrink-0 mt-0.5">Files</span>
          <ul className="space-y-0.5">
            {ev.filesChanged.map(f => (
              <li key={f} className="font-mono text-gray-600">{f}</li>
            ))}
          </ul>
        </div>
      )}
      {ev.unresolvedIssues && ev.unresolvedIssues.length > 0 && (
        <div className="mt-1 flex gap-2 items-start">
          <span className="text-red-400 w-14 shrink-0 mt-0.5">Unresolved</span>
          <ul className="space-y-0.5">
            {ev.unresolvedIssues.map(i => (
              <li key={i} className="text-red-600">{i}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Approval checklist ───────────────────────────────────────────────────────

function ApprovalChecklist({ approvals }: { approvals: readonly string[] }) {
  if (!approvals.length) return null
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-[10px]">
        Owner approval required
      </p>
      {approvals.map(a => (
        <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
          <span className="w-4 h-4 rounded border border-amber-300 bg-amber-50 shrink-0 inline-block" />
          {a}
        </div>
      ))}
    </div>
  )
}

// ─── Operator instructions ────────────────────────────────────────────────────

function ApprovalInstructions({ stage }: { stage: DapStageGate }) {
  if (stage.status !== 'awaiting_owner_approval') return null
  return (
    <div className="mt-4 border border-amber-200 bg-amber-50 rounded-md px-3 py-3 text-xs">
      <p className="font-semibold text-amber-700 mb-2">To approve this stage, update dapStageGates.ts:</p>
      <pre className="font-mono text-amber-800 whitespace-pre-wrap leading-relaxed text-[11px]">{`stageId: '${stage.stageId}'
status: 'approved'
approvedByOwner: true
approvedAt: '${new Date().toISOString().slice(0, 10)}'
nextStageUnlocked: true`}</pre>
      <p className="mt-2 text-amber-600">Then commit the file. Every approval is auditable in git.</p>
    </div>
  )
}

// ─── Directive block ──────────────────────────────────────────────────────────

function DirectiveBlock({ directive, stageId }: { directive: string; stageId: string }) {
  if (!directive.trim()) return null
  return (
    <details className="mt-3 group">
      <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none uppercase tracking-wide text-[10px]">
        Claude Directive ▸
      </summary>
      <div
        data-directive={stageId}
        className="mt-2 bg-gray-900 text-gray-100 rounded-md px-3 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto"
      >
        {directive}
      </div>
    </details>
  )
}

// ─── Stage gate card ──────────────────────────────────────────────────────────

function StageGateCard({ stage, isActive }: { stage: DapStageGate; isActive: boolean }) {
  const isApproved = stage.status === 'approved'
  const isNotStarted = stage.status === 'not_started'
  const isAwaiting = stage.status === 'awaiting_owner_approval'

  return (
    <div
      data-stage-id={stage.stageId}
      data-stage-status={stage.status}
      data-stage-number={stage.stageNumber}
      className={`bg-white rounded-lg border px-5 py-4 space-y-2 ${
        isActive
          ? 'border-amber-300 shadow-sm ring-1 ring-amber-100'
          : isApproved
          ? 'border-green-200'
          : 'border-gray-200'
      } ${isNotStarted ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
            isApproved
              ? 'bg-green-500 text-white'
              : isAwaiting
              ? 'bg-amber-400 text-white'
              : isNotStarted
              ? 'bg-gray-200 text-gray-400'
              : 'bg-blue-400 text-white'
          }`}
        >
          {stage.stageNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[stage.status]}`}
            >
              {STATUS_LABEL[stage.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{stage.description}</p>
        </div>
      </div>

      {/* Why it matters — only for active/awaiting stages */}
      {(isActive || isAwaiting) && (
        <p className="text-xs text-gray-600 italic border-l-2 border-amber-200 pl-2">
          {stage.whyItMatters}
        </p>
      )}

      {/* Artifact — rendered for all stages that have one */}
      {stage.artifact && <StageArtifactPanel artifact={stage.artifact} />}

      {/* Evidence */}
      <EvidenceBlock ev={stage.implementationEvidence} stageId={stage.stageId} />

      {/* Approval checklist */}
      {isAwaiting && <ApprovalChecklist approvals={stage.requiredApprovals} />}

      {/* Blockers */}
      {stage.blockers.length > 0 && (
        <div className="mt-2 space-y-1">
          {stage.blockers.map(b => (
            <div key={b} className="flex items-start gap-1.5 text-xs text-red-600">
              <span className="shrink-0 mt-0.5">⊘</span>
              {b}
            </div>
          ))}
        </div>
      )}

      {/* Approval instructions */}
      <ApprovalInstructions stage={stage} />

      {/* Directive */}
      {stage.directive && !isNotStarted && (
        <DirectiveBlock directive={stage.directive} stageId={stage.stageId} />
      )}

      {/* Approved completion line */}
      {isApproved && stage.approvedAt && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Approved {stage.approvedAt}
          {stage.nextStageUnlocked && (
            <span className="text-gray-400 ml-2">· Next stage unlocked</span>
          )}
        </p>
      )}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function StageGatePanel() {
  const active = getActiveStageGate()
  const approvedCount = DAP_STAGE_GATES.filter(s => s.approvedByOwner).length
  const total = DAP_STAGE_GATES.length
  const awaitingCount = DAP_STAGE_GATES.filter(s => s.status === 'awaiting_owner_approval').length

  return (
    <div data-stage-gate-panel className="space-y-4">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">DAP Stage Gate System</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {approvedCount} of {total} stages approved
            {awaitingCount > 0 && (
              <span className="ml-2 text-amber-500">· {awaitingCount} awaiting owner approval</span>
            )}
          </p>
        </div>
        <span
          data-stage-gate-active-id={active.stageId}
          className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5"
        >
          Active: {active.title}
        </span>
      </div>

      {/* Anti-bypass rule notice */}
      <div
        data-anti-bypass-rule
        className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 leading-relaxed"
      >
        <span className="font-semibold text-gray-700">Anti-bypass rule: </span>
        No DAP implementation phase may begin without a CBCC-issued directive for that stage.
        Each phase stops at evidence submission. Owner must approve before the next directive is issued.
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        {(DAP_STAGE_GATES as readonly DapStageGate[]).map(stage => (
          <StageGateCard
            key={stage.stageId}
            stage={stage}
            isActive={stage.stageId === active.stageId}
          />
        ))}
      </div>
    </div>
  )
}
