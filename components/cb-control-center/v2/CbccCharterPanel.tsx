'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { CbccProject } from '@/lib/cb-control-center/cbccProjectTypes'
import {
  generateCharterAction,
  approveCharterAction,
  type ActionResult,
} from '@/lib/cb-control-center/cbccProjectActions'
import { CbccNav } from './CbccNav'

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
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      <CbccNav />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/projects/${project.slug}`} className="text-xs text-gray-500 hover:text-gray-400">
            ← {project.name}
          </Link>
        </div>

        {/* Header */}
        <div data-charter-panel className="mb-8">
          <h2 className="text-2xl font-bold text-white">Step 0 — Project Charter</h2>
          <p
            data-charter-status
            className="mt-1 text-sm text-gray-400"
          >
            {project.charterApproved
              ? 'Charter Approved'
              : charter
              ? 'Charter Ready for Owner Approval'
              : 'Charter Draft'}
          </p>
        </div>

        {/* Blocked banner */}
        {!project.charterApproved && (
          <div className="mb-6 px-4 py-3 rounded-md bg-amber-900/20 border border-amber-700/40 text-sm text-amber-400">
            <strong>Blocked:</strong> Step 0 Project Charter requires owner approval before Stage 1 can begin.
          </div>
        )}

        {/* Generate Charter */}
        {!charter && (
          <form action={genAction} className="mb-8">
            <input type="hidden" name="slug" value={project.slug} />
            {genResult && !genResult.ok && (
              <p className="mb-3 text-sm text-red-400">{genResult.message}</p>
            )}
            <button
              type="submit"
              disabled={genPending}
              data-action="generate-charter"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {genPending ? 'Generating charter...' : 'Generate Charter'}
            </button>
            <p className="mt-2 text-xs text-gray-600">
              Opus 4.7 drafts a scope-only charter from your intake. Approves scope only — not claims, positioning, or build decisions.
            </p>
          </form>
        )}

        {/* Charter content */}
        {charter && (
          <div className="space-y-4 mb-8">
            <Section title="What This Is"    content={charter.whatThisIs}      field="whatThisIs" />
            <Section title="What This Is Not" content={charter.whatThisIsNot}  field="whatThisIsNot" />
            <Section title="Who It Serves"   content={charter.whoItServes}     field="whoItServes" />
            <ListSection title="Allowed Claims"   items={charter.allowedClaims}   field="allowedClaims" />
            <ListSection title="Forbidden Claims" items={charter.forbiddenClaims} field="forbiddenClaims" />
            <ListSection title="Required Evidence" items={charter.requiredEvidence} field="requiredEvidence" />
            <Section title="Approval Authority" content={charter.approvalAuthority} field="approvalAuthority" />
            <div
              data-charter-field="scopeNote"
              className="px-4 py-3 rounded-md bg-gray-900 border border-gray-800 text-xs text-gray-500"
            >
              <strong className="text-gray-500">Scope Note:</strong> This charter approves project scope only. It does not approve claims, positioning, compliance language, SEO strategy, page content, or build decisions.
            </div>
          </div>
        )}

        {/* Approve Charter */}
        {charter && !project.charterApproved && (
          <form action={approveAction}>
            <input type="hidden" name="slug" value={project.slug} />
            <input type="hidden" name="approvedBy" value={project.approvalOwner ?? 'owner'} />
            {approveResult && !approveResult.ok && (
              <p className="mb-3 text-sm text-red-400">{approveResult.message}</p>
            )}
            <button
              type="submit"
              disabled={approvePending}
              data-action="approve-charter"
              className="px-5 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {approvePending ? 'Approving...' : 'Approve Charter'}
            </button>
            <p className="mt-2 text-xs text-gray-600">
              Approving unlocks Stage 1. This action is recorded and immutable.
            </p>
          </form>
        )}

        {project.charterApproved && (
          <div className="px-4 py-3 rounded-md bg-green-900/20 border border-green-700/40 text-sm text-green-400">
            Charter approved by {project.charterApprovedBy} on{' '}
            {project.charterApprovedAt
              ? new Date(project.charterApprovedAt).toLocaleDateString()
              : '—'}
            . Stage 1 is now available.
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, content, field }: { title: string; content: string; field: string }) {
  return (
    <div data-charter-field={field} className="border border-gray-800 rounded-md px-4 py-3 bg-gray-900">
      <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-sm text-gray-300">{content}</p>
    </div>
  )
}

function ListSection({ title, items, field }: { title: string; items: string[]; field: string }) {
  return (
    <div data-charter-field={field} className="border border-gray-800 rounded-md px-4 py-3 bg-gray-900">
      <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={`${field}-${i}`} className="text-sm text-gray-300 before:content-['—'] before:text-gray-600 before:mr-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
