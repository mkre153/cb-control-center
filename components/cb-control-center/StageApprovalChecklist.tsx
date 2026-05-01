import type { DapStageGate } from '@/lib/cb-control-center/dapStageGates'

export function StageApprovalChecklist({ stage }: { stage: DapStageGate }) {
  const isApproved = stage.status === 'approved'
  const isAwaiting = stage.status === 'awaiting_owner_approval'

  if (!stage.requiredApprovals.length) return null

  return (
    <div data-stage-approval-checklist className="space-y-2">
      {stage.requiredApprovals.map(item => (
        <div key={item} className="flex items-start gap-2.5">
          {isApproved ? (
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">
              ✓
            </span>
          ) : (
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded border-2 border-amber-300 bg-white inline-block" />
          )}
          <span className={`text-sm ${isApproved ? 'text-green-800 line-through decoration-green-400' : 'text-gray-700'}`}>
            {item}
          </span>
        </div>
      ))}

      {isApproved && stage.approvedAt && (
        <div data-approval-metadata className="mt-3 pt-3 border-t border-green-100 space-y-1 text-xs text-green-700">
          <p>Approved by {stage.approvedAt ? 'Owner' : '—'}</p>
          <p>Date: {stage.approvedAt}</p>
          {stage.nextStageUnlocked && (
            <p className="font-semibold">Next stage unlocked ✓</p>
          )}
        </div>
      )}

      {isAwaiting && (
        <div data-approval-instructions className="mt-4 border border-amber-200 bg-amber-50 rounded-md px-3 py-3 text-xs">
          <p className="font-semibold text-amber-700 mb-2">
            To approve: update <code className="font-mono bg-amber-100 px-0.5 rounded">dapStageGates.ts</code>
          </p>
          <pre className="font-mono text-amber-800 whitespace-pre-wrap leading-relaxed text-[11px]">{`stageId: '${stage.stageId}'
status: 'approved'
approvedByOwner: true
approvedAt: '${new Date().toISOString().slice(0, 10)}'
nextStageUnlocked: true`}</pre>
          <p className="mt-2 text-amber-600">Commit the file. Every approval is auditable in git.</p>
        </div>
      )}
    </div>
  )
}
