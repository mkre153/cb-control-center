'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useActionState } from 'react'
import {
  createProjectAction,
  prefillFromUrlAction,
  type ActionResult,
  type PrefillResult,
  type PrefillFields,
} from '@/lib/cb-control-center/cbccProjectActions'

const EMPTY_FIELDS: PrefillFields = {
  name: '', businessType: '', primaryGoal: '', targetCustomer: '',
  knownConstraints: '', forbiddenClaims: '', sourceUrlsNotes: '',
  desiredOutputType: '', approvalOwner: '',
}

const INITIAL_CREATE: ActionResult | null = null
const INITIAL_PREFILL: PrefillResult | null = null

export function CbccProjectIntakeForm({ defaultShowIntake = false }: { defaultShowIntake?: boolean } = {}) {
  const [manualMode, setManualMode] = useState(defaultShowIntake)
  const [prefillState, prefillAction, prefillPending] = useActionState<PrefillResult | null, FormData>(
    prefillFromUrlAction,
    INITIAL_PREFILL
  )
  const [createState, createAction, createPending] = useActionState<ActionResult | null, FormData>(
    createProjectAction,
    INITIAL_CREATE
  )

  const showIntakeForm = manualMode || (prefillState?.ok === true)
  const prefilled: PrefillFields = prefillState?.ok ? prefillState.fields : EMPTY_FIELDS

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

      <div className="mx-auto max-w-lg px-4 py-10">
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-400 mb-6 inline-block">
          ← Back to Projects
        </Link>

        {!showIntakeForm ? (
          /* ── Phase 1: URL entry ── */
          <div className="rounded-lg border border-gray-800 bg-gray-900">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-xl font-bold text-white">New Project</h2>
              <p className="mt-1 text-sm text-gray-400">
                Enter your project URL and we&apos;ll pre-fill the intake form from your site.
              </p>
            </div>
            <div className="px-6 pb-6 pt-4">
              {prefillState && !prefillState.ok && (
                <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-300">
                  {prefillState.message}
                </div>
              )}
              <form action={prefillAction} className="space-y-4">
                <div>
                  <label htmlFor="url" className="block text-sm text-gray-300">
                    Project Website URL
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="text"
                    required
                    placeholder="https://yourproject.com"
                    className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={prefillPending}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {prefillPending ? 'Analyzing site...' : 'Analyze & Pre-fill →'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setManualMode(true)}
                  className="text-xs text-gray-500 hover:text-gray-400 underline"
                >
                  Skip — fill manually
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Phase 2: 9-field intake form (prefilled or empty) ── */
          <div className="rounded-lg border border-gray-800 bg-gray-900">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-xl font-bold text-white">New Project</h2>
              <p className="mt-1 text-sm text-gray-400">
                {prefillState?.ok
                  ? 'Review the pre-filled details and edit before submitting.'
                  : 'Complete Step 0 — Project Charter intake'}
              </p>
            </div>
            <div className="px-6 pb-6 pt-4">
              {prefillState?.ok && (
                <div className="mb-4 rounded-md bg-blue-900/30 border border-blue-700/40 px-3 py-2 text-xs text-blue-400 flex items-center justify-between">
                  <span>Pre-filled from {prefillState.fields.sourceUrlsNotes.split(' ')[0]}</span>
                  <button
                    onClick={() => setManualMode(false)}
                    className="ml-3 underline hover:text-blue-300"
                  >
                    ← Change URL
                  </button>
                </div>
              )}

              {createState && !createState.ok && (
                <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-300">
                  {createState.message}
                </div>
              )}

              <form action={createAction} className="space-y-4">
                <Field name="name"              label="Project Name *"           placeholder="e.g., Acme Corp Platform"          defaultValue={prefilled.name} />
                <Field name="businessType"      label="Business Type *"          placeholder="e.g., Membership marketplace"       defaultValue={prefilled.businessType} />
                <Field name="primaryGoal"       label="Primary Goal *"           placeholder="What this project must accomplish"  defaultValue={prefilled.primaryGoal}       textarea />
                <Field name="targetCustomer"    label="Target Customer *"        placeholder="Who this serves"                    defaultValue={prefilled.targetCustomer}    textarea />
                <Field name="knownConstraints"  label="Known Constraints *"      placeholder="Regulatory, technical, or scope limits" defaultValue={prefilled.knownConstraints} textarea />
                <Field name="forbiddenClaims"   label="Forbidden Claims *"       placeholder="Claims this project must never make" defaultValue={prefilled.forbiddenClaims}   textarea />
                <Field name="sourceUrlsNotes"   label="Source URLs / Notes *"    placeholder="Research links or reference notes"  defaultValue={prefilled.sourceUrlsNotes}   textarea />
                <Field name="desiredOutputType" label="Desired Output Type *"    placeholder="e.g., Public website, internal tool" defaultValue={prefilled.desiredOutputType} />
                <Field name="approvalOwner"     label="Approval Owner *"         placeholder="Who approves each stage"            defaultValue={prefilled.approvalOwner} />

                <button
                  type="submit"
                  disabled={createPending}
                  className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {createPending ? 'Creating project...' : 'Create Project'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  name,
  label,
  placeholder,
  textarea,
  defaultValue,
}: {
  name: string
  label: string
  placeholder?: string
  textarea?: boolean
  defaultValue?: string
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
          defaultValue={defaultValue}
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
          defaultValue={defaultValue}
          className={base}
        />
      )}
    </div>
  )
}
