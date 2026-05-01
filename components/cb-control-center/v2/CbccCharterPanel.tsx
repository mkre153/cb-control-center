'use client'

import { useActionState } from 'react'
import type { CbccProject } from '@/lib/cb-control-center/cbccProjectTypes'
import {
  generateCharterAction,
  approveCharterAction,
  type ActionResult,
} from '@/lib/cb-control-center/cbccProjectActions'

interface Props {
  project: CbccProject
}

const INITIAL: ActionResult | null = null

export function CbccCharterPanel({ project }: Props) {
  const [genResult, genAction, genPending] = useActionState<ActionResult | null, FormData>(
    generateCharterAction,
    INITIAL
  )
  const [approveResult, approveAction, approvePending] = useActionState<ActionResult | null, FormData>(
    approveCharterAction,
    INITIAL
  )

  const charter = project.charterJson

  return (
    <div data-charter-panel className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Step 0 — Project Charter</h2>
        <p
          data-charter-status
          className="mt-1 text-sm text-gray-500"
        >
          {project.charterApproved
            ? 'Charter Approved'
            : charter
            ? 'Charter Ready for Owner Approval'
            : 'Charter Draft'}
        </p>
      </div>

      {!project.charterApproved && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <strong>Blocked:</strong> Step 0 Project Charter requires owner approval before Stage 1
          can begin.
        </div>
      )}

      {/* Generate Charter */}
      {!charter && (
        <form action={genAction} className="mb-8">
          <input type="hidden" name="slug" value={project.slug} />
          {genResult && !genResult.ok && (
            <p className="mb-3 text-sm text-red-600">{genResult.message}</p>
          )}
          <button
            type="submit"
            disabled={genPending}
            data-action="generate-charter"
            className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {genPending ? 'Generating charter...' : 'Generate Charter'}
          </button>
          <p className="mt-2 text-xs text-gray-400">
            Uses Opus 4.7 to draft a scope-only charter based on your intake.
          </p>
        </form>
      )}

      {/* Charter content */}
      {charter && (
        <div className="space-y-5 mb-8">
          <CharterSection title="What This Is" content={charter.whatThisIs} field="whatThisIs" />
          <CharterSection title="What This Is Not" content={charter.whatThisIsNot} field="whatThisIsNot" />
          <CharterSection title="Who It Serves" content={charter.whoItServes} field="whoItServes" />
          <CharterList title="Allowed Claims" items={charter.allowedClaims} field="allowedClaims" />
          <CharterList title="Forbidden Claims" items={charter.forbiddenClaims} field="forbiddenClaims" />
          <CharterList title="Required Evidence" items={charter.requiredEvidence} field="requiredEvidence" />
          <CharterSection title="Approval Authority" content={charter.approvalAuthority} field="approvalAuthority" />
          <div data-charter-field="scopeNote" className="p-4 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">
            <strong>Scope Note:</strong> This charter approves project scope only. It does not
            approve claims, positioning, compliance language, SEO strategy, page content, or build
            decisions.
          </div>
        </div>
      )}

      {/* Approve Charter */}
      {charter && !project.charterApproved && (
        <form action={approveAction}>
          <input type="hidden" name="slug" value={project.slug} />
          <input type="hidden" name="approvedBy" value={project.approvalOwner ?? 'owner'} />
          {approveResult && !approveResult.ok && (
            <p className="mb-3 text-sm text-red-600">{approveResult.message}</p>
          )}
          <button
            type="submit"
            disabled={approvePending}
            data-action="approve-charter"
            className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 disabled:opacity-50"
          >
            {approvePending ? 'Approving...' : 'Approve Charter'}
          </button>
          <p className="mt-2 text-xs text-gray-400">
            Approving the charter unlocks Stage 1. This action is recorded and immutable.
          </p>
        </form>
      )}

      {project.charterApproved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          Charter approved by {project.charterApprovedBy} on{' '}
          {project.charterApprovedAt
            ? new Date(project.charterApprovedAt).toLocaleDateString()
            : '—'}
          . Stage 1 is now available.
        </div>
      )}
    </div>
  )
}

function CharterSection({
  title,
  content,
  field,
}: {
  title: string
  content: string
  field: string
}) {
  return (
    <div data-charter-field={field}>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  )
}

function CharterList({
  title,
  items,
  field,
}: {
  title: string
  items: string[]
  field: string
}) {
  return (
    <div data-charter-field={field}>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <ul className="list-disc list-inside space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
