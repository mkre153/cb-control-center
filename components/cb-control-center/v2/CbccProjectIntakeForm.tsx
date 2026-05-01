'use client'

import { useActionState } from 'react'
import { createProjectAction, type ActionResult } from '@/lib/cb-control-center/cbccProjectActions'

const INITIAL: ActionResult | null = null

export function CbccProjectIntakeForm() {
  const [result, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createProjectAction,
    INITIAL
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">New Project — Step 0</h1>
      <p className="text-sm text-gray-500 mb-8">
        Complete the Project Charter intake. An AI-generated charter will be produced for owner
        review and approval before any build stage begins.
      </p>

      {result && !result.ok && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {result.message}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <Field name="name" label="Project Name" required />
        <Field name="businessType" label="Business Type" required />
        <Field name="primaryGoal" label="Primary Goal" required textarea />
        <Field name="targetCustomer" label="Target Customer" required textarea />
        <Field name="knownConstraints" label="Known Constraints" required textarea />
        <Field name="forbiddenClaims" label="Forbidden Claims" required textarea />
        <Field name="sourceUrlsNotes" label="Source URLs / Research Notes" required textarea />
        <Field name="desiredOutputType" label="Desired Output Type" required />
        <Field name="approvalOwner" label="Approval Owner" required />

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? 'Creating project...' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}

function Field({
  name,
  label,
  required,
  textarea,
}: {
  name: string
  label: string
  required?: boolean
  textarea?: boolean
}) {
  const base = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900'
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          data-field={name}
          required={required}
          rows={3}
          className={base}
        />
      ) : (
        <input
          id={name}
          name={name}
          data-field={name}
          required={required}
          type="text"
          className={base}
        />
      )}
    </div>
  )
}
