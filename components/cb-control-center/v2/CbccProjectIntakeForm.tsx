'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createProjectAction, type ActionResult } from '@/lib/cb-control-center/cbccProjectActions'

const INITIAL: ActionResult | null = null

export function CbccProjectIntakeForm() {
  const [result, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createProjectAction,
    INITIAL
  )

  return (
    <div className="min-h-screen bg-[#0d1117] font-mono text-gray-300">
      {/* Nav bar */}
      <nav className="border-b border-[#1e2d45] px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-blue-400 font-semibold tracking-tight hover:text-blue-300">
          CB Control Center
        </Link>
        <Link
          href="/projects/new"
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded opacity-50 pointer-events-none"
        >
          + New Project
        </Link>
      </nav>

      {/* Centered form card */}
      <div className="flex justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-[#161b27] border border-[#1e2d45] rounded-lg p-8">
          <h2 className="text-gray-100 text-lg font-semibold mb-1">New Project</h2>
          <p className="text-gray-500 text-sm mb-6">
            Complete Step 0 — Project Charter intake
          </p>

          {result && !result.ok && (
            <div className="mb-5 p-3 bg-red-900/30 border border-red-700/50 rounded text-sm text-red-400">
              {result.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <Field name="name"             label="Project Name *"            placeholder="e.g., Acme Corp Platform" />
            <Field name="businessType"     label="Business Type *"           placeholder="e.g., Membership marketplace" />
            <Field name="primaryGoal"      label="Primary Goal *"            placeholder="What this project must accomplish" textarea />
            <Field name="targetCustomer"   label="Target Customer *"         placeholder="Who this serves" textarea />
            <Field name="knownConstraints" label="Known Constraints *"       placeholder="Regulatory, technical, or scope limits" textarea />
            <Field name="forbiddenClaims"  label="Forbidden Claims *"        placeholder="Claims this project must never make" textarea />
            <Field name="sourceUrlsNotes"  label="Source URLs / Notes *"     placeholder="Research links or reference notes" textarea />
            <Field name="desiredOutputType" label="Desired Output Type *"    placeholder="e.g., Public website, internal tool" />
            <Field name="approvalOwner"    label="Approval Owner *"          placeholder="Who approves each stage" />

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
            >
              {pending ? 'Creating project...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({
  name,
  label,
  placeholder,
  textarea,
}: {
  name: string
  label: string
  placeholder?: string
  textarea?: boolean
}) {
  const base =
    'mt-1 block w-full bg-[#0d1117] border border-[#1e2d45] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-700 font-mono'
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-gray-500 mb-0.5">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          data-field={name}
          required
          rows={2}
          placeholder={placeholder}
          className={base}
        />
      ) : (
        <input
          id={name}
          name={name}
          data-field={name}
          required
          type="text"
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  )
}
