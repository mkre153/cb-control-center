'use client'

import { useState, useTransition } from 'react'
import { approveDapStageAction, type ApproveDapStageResult } from '@/lib/cb-control-center/dapStageActions'

interface Props {
  stageNumber: number
  stageTitle: string
  defaultOwner?: string
}

export function DapStageOwnerApprovalForm({ stageNumber, stageTitle, defaultOwner = 'Owner' }: Props) {
  const [owner, setOwner] = useState(defaultOwner)
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ApproveDapStageResult | null>(null)

  return (
    <section
      data-dap-owner-approval-form
      data-stage-number={stageNumber}
      className="border border-amber-200 rounded-lg bg-white overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-amber-200 bg-amber-50">
        <h2 className="text-sm font-semibold text-gray-700">Owner Approval — {stageTitle}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-xs text-gray-600 leading-relaxed">
          Approving this stage is recorded as an owner decision and unlocks the next stage.
          Approval is persisted; refreshing the page preserves it. AI review is advisory only
          and cannot record an approval.
        </p>

        <form
          action={(formData: FormData) => {
            startTransition(async () => {
              const r = await approveDapStageAction(null, formData)
              setResult(r)
            })
          }}
          className="space-y-3"
        >
          <input type="hidden" name="stageNumber" value={stageNumber} />

          <label className="block">
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Approving as
            </span>
            <input
              name="approvedBy"
              data-field="approvedBy"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>

          <label className="block">
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Notes (optional)
            </span>
            <textarea
              name="notes"
              data-field="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="What was reviewed, any caveats…"
            />
          </label>

          <button
            type="submit"
            data-action="approve-dap-stage"
            disabled={pending || !owner.trim()}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Approving…' : `Approve Stage ${stageNumber}`}
          </button>

          {result && !result.ok && (
            <ApprovalErrorView result={result} stageNumber={stageNumber} />
          )}
          {result && result.ok && (
            <p data-form-success className="text-xs text-green-700 font-semibold">
              Stage {stageNumber} approved by {result.approval.approvedBy}.
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

// Renders the four discriminated approval failure states with stable test
// anchors. The form keeps the original `data-form-error` anchor for backward
// compatibility with Part 11 tests, and adds the Part 12 anchors below.
// Exported so unit tests can render it directly against a `result` literal
// instead of having to drive the form through user interactions.
export function ApprovalErrorView({
  result,
  stageNumber,
}: {
  result: Extract<ApproveDapStageResult, { ok: false }>
  stageNumber: number
}) {
  const code = result.code

  if (code === 'missing_required_evidence') {
    const ids = result.missingEvidence ?? []
    return (
      <div
        data-form-error
        data-approval-error
        data-approval-error-code={code}
        className="space-y-2"
      >
        <p className="text-xs text-red-700 font-semibold">
          Stage {stageNumber} cannot be approved — missing required evidence.
        </p>
        {ids.length > 0 && (
          <ul data-approval-missing-evidence className="space-y-1 pl-3">
            {ids.map(id => (
              <li
                key={id}
                data-approval-missing-evidence-item
                data-approval-missing-evidence-id={id}
                className="text-xs text-red-700 font-mono"
              >
                {id}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-red-600 leading-relaxed">
          Add and validate the listed evidence items before retrying approval. The approval
          gate will not advance until every required item is present.
        </p>
      </div>
    )
  }

  if (code === 'stage_locked') {
    return (
      <p
        data-form-error
        data-approval-error
        data-approval-error-code={code}
        className="text-xs text-red-700 font-semibold"
      >
        Stage {stageNumber} is locked — its predecessor must be owner-approved first.
      </p>
    )
  }

  if (code === 'already_approved') {
    return (
      <p
        data-form-error
        data-approval-error
        data-approval-error-code={code}
        className="text-xs text-amber-700 font-semibold"
      >
        Stage {stageNumber} is already approved. {result.message}
      </p>
    )
  }

  return (
    <p
      data-form-error
      data-approval-error
      data-approval-error-code={code}
      className="text-xs text-red-700 font-semibold"
    >
      {result.message}
    </p>
  )
}
