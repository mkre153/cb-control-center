'use client'

import { useState } from 'react'
import type { DapRequestFlowModel } from '@/lib/dap/site/dapPublicUxTypes'
import type {
  DapRequestConfirmationModel,
  DapRequestValidationIssue,
} from '@/lib/dap/registry/dapRequestTypes'

// ─── Consent text ─────────────────────────────────────────────────────────────
// Recorded verbatim in the consent_captured event on submission.
const CONSENT_TEXT =
  'I consent to DAP contacting dentists in my area on my behalf. ' +
  'I understand this does not guarantee availability.'

// ─── Flow state machine ───────────────────────────────────────────────────────

type FlowState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; requestId: string; confirmation: DapRequestConfirmationModel; isDuplicate: boolean }
  | { kind: 'rate_limited'; retryAfterSeconds: number | null }
  | { kind: 'phi_error'; field: string }
  | { kind: 'validation_error'; issues: DapRequestValidationIssue[] }
  | { kind: 'server_error' }

// ─── Props ────────────────────────────────────────────────────────────────────

interface DapRequestFlowPreviewProps {
  model: DapRequestFlowModel
  /**
   * When true, the component renders a live form that submits to
   * POST /api/dap/requests. Only pass wired={true} inside preview routes.
   * Defaults to false — all inputs disabled, no form element, no API call.
   */
  wired?: boolean
  /** Source path injected into the request record. Defaults to /preview/dap/request. */
  sourcePath?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DapRequestFlowPreview({
  model,
  wired = false,
  sourcePath = '/preview/dap/request',
}: DapRequestFlowPreviewProps) {
  const [flowState, setFlowState] = useState<FlowState>({ kind: 'idle' })

  // ── Wired submit handler ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFlowState({ kind: 'loading' })

    const data = new FormData(e.currentTarget)

    const body = {
      requester_name: String(data.get('requester_name') ?? '').trim(),
      requester_email: String(data.get('requester_email') ?? '').trim() || null,
      requester_phone: String(data.get('requester_phone') ?? '').trim() || null,
      city: String(data.get('city') ?? '').trim() || null,
      zip: String(data.get('zip') ?? '').trim() || null,
      preferred_practice_name: String(data.get('preferred_practice_name') ?? '').trim() || null,
      preferred_practice_slug: null,
      treatment_interest: String(data.get('treatment_interest') ?? '').trim() || null,
      consent_to_contact_practice: data.get('consent_to_contact_practice') === 'on',
      consent_to_contact_patient: data.get('consent_to_contact_patient') === 'on',
      consent_text: CONSENT_TEXT,
      no_phi_acknowledged: data.get('no_phi_acknowledged') === 'on',
      user_message: String(data.get('user_message') ?? '').trim() || null,
      source_page_kind: 'request_flow',
      source_path: sourcePath,
    }

    try {
      const res = await fetch('/api/dap/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        setFlowState({
          kind: 'rate_limited',
          retryAfterSeconds: retryAfter ? parseInt(retryAfter, 10) : null,
        })
        return
      }

      const json = await res.json() as {
        error?: string
        issues?: DapRequestValidationIssue[]
        requestId?: string
        status?: string
        isEnrollment?: boolean
        confirmation?: DapRequestConfirmationModel
      }

      if (res.status === 422) {
        const phiIssue = json.issues?.find(i => i.code === 'PHI_DETECTED')
        if (phiIssue) {
          setFlowState({ kind: 'phi_error', field: phiIssue.field })
          return
        }
        setFlowState({ kind: 'validation_error', issues: json.issues ?? [] })
        return
      }

      if ((res.status === 200 || res.status === 201) && json.confirmation && json.requestId) {
        setFlowState({
          kind: 'success',
          requestId: json.requestId,
          confirmation: json.confirmation,
          isDuplicate: json.status === 'duplicate',
        })
        return
      }

      setFlowState({ kind: 'server_error' })
    } catch {
      setFlowState({ kind: 'server_error' })
    }
  }

  // ── Preview-only mode (default) ───────────────────────────────────────────
  if (!wired) {
    return (
      <>
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-4"
          data-preview-banner
          role="status"
        >
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Preview Mode — No Submission
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            This form does not submit. All inputs are disabled.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-5 py-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900">Request DAP Availability</h3>
            <p className="text-sm text-gray-500" data-caveat>
              {model.availabilityCaveat}
            </p>
          </div>

          {model.steps.map((step) => (
            <div key={step.step} className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Step {step.step} — {step.label}
              </p>
              {step.fields.map((field) => {
                if (field === 'consentToContact') {
                  return (
                    <label
                      key={field}
                      className="flex items-start gap-2.5 text-sm text-gray-700 cursor-not-allowed"
                    >
                      <input
                        type="checkbox"
                        name="consentToContact"
                        disabled
                        className="mt-0.5 rounded border-gray-300"
                        data-consent-field
                      />
                      <span>
                        I consent to DAP contacting dentists in my area on my behalf.
                        I understand this does not guarantee availability.
                      </span>
                    </label>
                  )
                }
                if (field === 'requestType') return null
                const displayName = field.replace(/([A-Z])/g, ' $1').trim()
                return (
                  <div key={field} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 capitalize">
                      {displayName}
                    </label>
                    <input
                      type="text"
                      name={field}
                      disabled
                      placeholder={`${displayName} (preview)`}
                      className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-400 bg-gray-50"
                    />
                  </div>
                )
              })}
            </div>
          ))}

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full py-2 rounded-md bg-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed"
            data-preview-submit
          >
            Submit Request (Preview — not active)
          </button>
        </div>
      </>
    )
  }

  // ── Wired mode — success state ────────────────────────────────────────────
  if (flowState.kind === 'success') {
    const { confirmation, isDuplicate } = flowState
    return (
      <div
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-5 space-y-3"
        data-wired-state="success"
        data-is-enrollment="false"
        data-guarantees-availability="false"
        data-guarantees-pricing="false"
      >
        <h3 className="text-base font-semibold text-emerald-800">
          {confirmation.headline}
        </h3>
        <p className="text-sm text-emerald-700">{confirmation.body}</p>
        <p className="text-sm text-gray-600">{confirmation.nextStep}</p>
        {isDuplicate && (
          <p className="text-xs text-gray-500 italic">
            A similar request was already received. Your original request is still active.
          </p>
        )}
        <p className="text-xs text-gray-400 border-t border-emerald-100 pt-2">
          This is not enrollment in Dental Advantage Plan. DAP availability is not guaranteed.
        </p>
      </div>
    )
  }

  // ── Wired mode — live form ────────────────────────────────────────────────
  const isLoading = flowState.kind === 'loading'

  return (
    <div data-wired="true">
      {/* Error states */}
      {flowState.kind === 'rate_limited' && (
        <div
          className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 mb-4"
          data-wired-state="rate_limited"
          role="alert"
        >
          <p className="text-sm font-semibold text-orange-700">Too many requests</p>
          <p className="text-xs text-orange-600 mt-0.5">
            You have submitted too many requests recently. Please try again later.
            {flowState.retryAfterSeconds !== null && (
              <> Retry in {Math.ceil(flowState.retryAfterSeconds / 60)} minute(s).</>
            )}
          </p>
        </div>
      )}

      {flowState.kind === 'phi_error' && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4"
          data-wired-state="phi_error"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700">Sensitive content detected</p>
          <p className="text-xs text-red-600 mt-0.5">
            Your submission appears to contain protected health information (PHI).
            Please remove medical details, insurance numbers, and similar information, then try again.
          </p>
        </div>
      )}

      {flowState.kind === 'validation_error' && flowState.issues.length > 0 && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4"
          data-wired-state="validation_error"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700">Please correct the following:</p>
          <ul className="mt-1 space-y-0.5">
            {flowState.issues.map((issue, i) => (
              <li key={i} className="text-xs text-red-600">• {issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {flowState.kind === 'server_error' && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4"
          data-wired-state="server_error"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700">Something went wrong</p>
          <p className="text-xs text-red-600 mt-0.5">
            Unable to submit your request. Please try again in a moment.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 bg-white px-5 py-5 space-y-5"
        data-wired-form
      >
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900">Request DAP Availability</h3>
          <p className="text-sm text-gray-500" data-caveat>
            {model.availabilityCaveat}
          </p>
        </div>

        {/* Step 2 fields — location / dentist */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Step 1 — Location &amp; Preference
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="city" className="block text-xs font-medium text-gray-500">City</label>
              <input
                id="city"
                type="text"
                name="city"
                placeholder="e.g. San Diego"
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="zip" className="block text-xs font-medium text-gray-500">ZIP</label>
              <input
                id="zip"
                type="text"
                name="zip"
                placeholder="e.g. 92101"
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="preferred_practice_name" className="block text-xs font-medium text-gray-500">
              Preferred practice (optional)
            </label>
            <input
              id="preferred_practice_name"
              type="text"
              name="preferred_practice_name"
              placeholder="Practice name"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="treatment_interest" className="block text-xs font-medium text-gray-500">
              Treatment interest (optional)
            </label>
            <input
              id="treatment_interest"
              type="text"
              name="treatment_interest"
              placeholder="e.g. cleaning, implant"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Step 3 fields — contact info */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Step 2 — Contact Info
          </p>
          <div className="space-y-1">
            <label htmlFor="requester_name" className="block text-xs font-medium text-gray-500">
              Your name <span className="text-red-400">*</span>
            </label>
            <input
              id="requester_name"
              type="text"
              name="requester_name"
              required
              placeholder="Full name"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="requester_email" className="block text-xs font-medium text-gray-500">
              Email
            </label>
            <input
              id="requester_email"
              type="email"
              name="requester_email"
              placeholder="you@example.com"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="requester_phone" className="block text-xs font-medium text-gray-500">
              Phone
            </label>
            <input
              id="requester_phone"
              type="tel"
              name="requester_phone"
              placeholder="(619) 555-0100"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-400">Email or phone is required.</p>
          <div className="space-y-1">
            <label htmlFor="user_message" className="block text-xs font-medium text-gray-500">
              Additional note (optional — no medical details)
            </label>
            <textarea
              id="user_message"
              name="user_message"
              rows={3}
              placeholder="Any context that would help us reach out on your behalf."
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Step 4 — consent */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Step 3 — Consent
          </p>
          <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              name="consent_to_contact_practice"
              className="mt-0.5 rounded border-gray-300"
              disabled={isLoading}
              data-consent-field
            />
            <span>
              I consent to DAP contacting dentists in my area on my behalf.
              I understand this does not guarantee availability.
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              name="consent_to_contact_patient"
              className="mt-0.5 rounded border-gray-300"
              disabled={isLoading}
            />
            <span>DAP may follow up with me about my request.</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              name="no_phi_acknowledged"
              className="mt-0.5 rounded border-gray-300"
              disabled={isLoading}
              data-no-phi-field
            />
            <span className="font-medium">
              I confirm this form does not contain protected health information (no SSN,
              insurance IDs, diagnoses, or medical records).
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-disabled={isLoading}
          className={[
            'w-full py-2 rounded-md text-sm font-semibold transition-colors',
            isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
          data-wired-submit
        >
          {isLoading ? 'Submitting…' : 'Submit Request'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          This is not enrollment. Submitting does not guarantee DAP availability.
        </p>
      </form>
    </div>
  )
}
