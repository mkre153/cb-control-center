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
            <p data-form-error className="text-xs text-red-700 font-semibold">
              {result.message}
            </p>
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
