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
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      {/* Nav bar */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-900">
        <Link href="/" className="text-blue-400 font-semibold tracking-tight hover:text-blue-300">
          CB Control Center
        </Link>
        <Link
          href="/projects/new"
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md opacity-50 pointer-events-none"
        >
          + New Project
        </Link>
      </nav>

      {/* Centered form card */}
      <div className="mx-auto max-w-lg px-4 py-10">
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-400 mb-6 inline-block">
          ← Back to Projects
        </Link>

        <div className="rounded-lg border border-gray-800 bg-gray-900">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-xl font-bold text-white">New Project</h2>
            <p className="mt-1 text-sm text-gray-400">Complete Step 0 — Project Charter intake</p>
          </div>

          <div className="px-6 pb-6 pt-4">
            {result && !result.ok && (
              <div className="mb-5 rounded-md bg-red-900/50 p-3 text-sm text-red-300">
                {result.message}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <Field name="name"              label="Project Name *"           placeholder="e.g., Acme Corp Platform" />
              <Field name="businessType"      label="Business Type *"          placeholder="e.g., Membership marketplace" />
              <Field name="primaryGoal"       label="Primary Goal *"           placeholder="What this project must accomplish" textarea />
              <Field name="targetCustomer"    label="Target Customer *"        placeholder="Who this serves" textarea />
              <Field name="knownConstraints"  label="Known Constraints *"      placeholder="Regulatory, technical, or scope limits" textarea />
              <Field name="forbiddenClaims"   label="Forbidden Claims *"       placeholder="Claims this project must never make" textarea />
              <Field name="sourceUrlsNotes"   label="Source URLs / Notes *"    placeholder="Research links or reference notes" textarea />
              <Field name="desiredOutputType" label="Desired Output Type *"    placeholder="e.g., Public website, internal tool" />
              <Field name="approvalOwner"     label="Approval Owner *"         placeholder="Who approves each stage" />

              <button
                type="submit"
                disabled={pending}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
              >
                {pending ? 'Creating project...' : 'Create Project'}
              </button>
            </form>
          </div>
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
    'mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-600'
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-gray-300">
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
