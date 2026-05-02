// Preview-only — no email sending, no MKCRM calls, no practice status mutations.
// CB Control Center determines communication eligibility and dispatch authority.
// MKCRM may later deliver approved communications, but MKCRM does not decide
// practice status, payment status, membership standing, or dispatch eligibility.

import Link from 'next/link'
import { getAllDapPracticeDecisionEmailPreviews }          from '@/lib/cb-control-center/dapPracticeDecisionEmailPreview'
import { getDapPracticeDecisionEmailDispatchReadiness }    from '@/lib/cb-control-center/dapCommunicationDispatchReadiness'
import { buildDapDispatchEventFromReadiness }              from '@/lib/cb-control-center/dapCommunicationDispatchEvents'
import { buildDapMkcrmDispatchShadowPayloadFromEvent }     from '@/lib/cb-control-center/mkcrm/dapMkcrmDispatchPayloads'
import type { DapPracticeDecisionEmailPreview }            from '@/lib/cb-control-center/dapPracticeDecisionEmailPreview'
import type { DapPracticeDecisionEmailTemplateKey }        from '@/lib/cb-control-center/dapPracticeDecisionEmailTypes'
import type { DapCommunicationDispatchReadiness }          from '@/lib/cb-control-center/dapCommunicationDispatchTypes'
import type { DapCommunicationDispatchEvent }              from '@/lib/cb-control-center/dapCommunicationDispatchEventTypes'
import type { DapMkcrmDispatchShadowPayload }              from '@/lib/cb-control-center/mkcrm/dapMkcrmDispatchPayloadTypes'

export const dynamic = 'force-dynamic'

// ─── Visual grouping ──────────────────────────────────────────────────────────

const GROUPS: { label: string; keys: DapPracticeDecisionEmailTemplateKey[] }[] = [
  {
    label: 'Review / Intake',
    keys:  ['practice_application_received', 'practice_under_review'],
  },
  {
    label: 'Conditional Approval / Gates',
    keys:  [
      'practice_approved_internal_only',
      'practice_offer_terms_needed',
      'practice_join_cta_blocked',
    ],
  },
  {
    label: 'Negative / Inactive States',
    keys:  ['practice_rejected', 'practice_declined', 'practice_participation_paused'],
  },
]

// ─── Decision state badge color ───────────────────────────────────────────────

function decisionBadgeClass(key: DapPracticeDecisionEmailTemplateKey): string {
  switch (key) {
    case 'practice_application_received':   return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'practice_under_review':           return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'practice_approved_internal_only': return 'bg-teal-50 text-teal-700 border border-teal-200'
    case 'practice_offer_terms_needed':     return 'bg-orange-50 text-orange-700 border border-orange-200'
    case 'practice_join_cta_blocked':       return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    case 'practice_rejected':               return 'bg-red-50 text-red-700 border border-red-200'
    case 'practice_declined':               return 'bg-red-100 text-red-800 border border-red-300'
    case 'practice_participation_paused':   return 'bg-gray-100 text-gray-600 border border-gray-300'
  }
}

// ─── MKCRM shadow payload section ────────────────────────────────────────────

function MkcrmShadowPayloadSection({ shadowPayload }: { shadowPayload: DapMkcrmDispatchShadowPayload }) {
  return (
    <div
      className="rounded-md bg-purple-50 border border-purple-200 px-4 py-3 space-y-2"
      data-mkcrm-shadow-payload={shadowPayload.templateKey}
    >
      <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
        MKCRM Shadow Payload
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="font-mono text-purple-600">shadowMode:</span>{' '}
          <span className="font-mono font-semibold text-green-700">
            {String(shadowPayload.shadowMode)}
          </span>
        </div>
        <div>
          <span className="font-mono text-purple-600">eventType:</span>{' '}
          <span className="font-mono font-semibold text-purple-900 text-[10px]">
            {shadowPayload.eventType}
          </span>
        </div>
      </div>

      <div className="space-y-0.5 text-xs font-mono">
        <p className="text-purple-600 font-medium text-[10px] uppercase tracking-wide mt-1">Delivery</p>
        <div>
          deliveryDisabled:{' '}
          <span className="text-amber-700 font-semibold">{String(shadowPayload.delivery.deliveryDisabled)}</span>
        </div>
        <div>
          externalSendDisabled:{' '}
          <span className="text-amber-700 font-semibold">{String(shadowPayload.delivery.externalSendDisabled)}</span>
        </div>
        <div>
          mkcrmDeliveryDisabled:{' '}
          <span className="text-amber-700 font-semibold">{String(shadowPayload.delivery.mkcrmDeliveryDisabled)}</span>
        </div>
        <div>
          resendDisabled:{' '}
          <span className="text-amber-700 font-semibold">{String(shadowPayload.delivery.resendDisabled)}</span>
        </div>
      </div>

      <div className="space-y-0.5 text-xs font-mono">
        <p className="text-purple-600 font-medium text-[10px] uppercase tracking-wide mt-1">Authority</p>
        <div>
          decisionAuthority:{' '}
          <span className="text-purple-900 font-semibold">{shadowPayload.source.decisionAuthority}</span>
        </div>
        <div>
          crmAuthority:{' '}
          <span className="text-green-700 font-semibold">{String(shadowPayload.source.crmAuthority)}</span>
        </div>
        <div>
          paymentAuthority:{' '}
          <span className="text-green-700 font-semibold">{String(shadowPayload.source.paymentAuthority)}</span>
        </div>
      </div>

      <div className="space-y-0.5 text-xs font-mono">
        <p className="text-purple-600 font-medium text-[10px] uppercase tracking-wide mt-1">Safety</p>
        <div>noEmailBody: <span className="text-green-700 font-semibold">{String(shadowPayload.safety.noEmailBody)}</span></div>
        <div>noPhi: <span className="text-green-700 font-semibold">{String(shadowPayload.safety.noPhi)}</span></div>
        <div>noPaymentCta: <span className="text-green-700 font-semibold">{String(shadowPayload.safety.noPaymentCta)}</span></div>
        <div>noStoredStanding: <span className="text-green-700 font-semibold">{String(shadowPayload.safety.noStoredStanding)}</span></div>
      </div>

      <p className="text-xs text-purple-600 italic pt-1">
        Phase 9X creates MKCRM shadow payload previews only.
        MKCRM does not send, decide, or modify communication eligibility in this phase.
      </p>
    </div>
  )
}

// ─── Projected dispatch event section ────────────────────────────────────────

function ProjectedDispatchEventSection({ event }: { event: DapCommunicationDispatchEvent }) {
  return (
    <div
      className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 space-y-2"
      data-projected-dispatch-event={event.templateKey}
    >
      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        Projected Dispatch Event
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="font-mono text-slate-500">eventType:</span>{' '}
          <span className="font-mono font-semibold text-slate-800">{event.eventType}</span>
        </div>
        <div>
          <span className="font-mono text-slate-500">channel:</span>{' '}
          <span className="font-mono font-semibold text-slate-800">{event.channel}</span>
        </div>
        <div>
          <span className="font-mono text-slate-500">readinessStatus:</span>{' '}
          <span className="font-mono font-semibold text-slate-800">{event.readinessStatus}</span>
        </div>
        <div>
          <span className="font-mono text-slate-500">eligibleForFutureDispatch:</span>{' '}
          <span className={`font-mono font-semibold ${event.eligibleForFutureDispatch ? 'text-green-700' : 'text-red-600'}`}>
            {String(event.eligibleForFutureDispatch)}
          </span>
        </div>
        <div>
          <span className="font-mono text-slate-500">decisionAuthority:</span>{' '}
          <span className="font-mono font-semibold text-slate-800">{event.source.decisionAuthority}</span>
        </div>
        <div>
          <span className="font-mono text-slate-500">actor:</span>{' '}
          <span className="font-mono font-semibold text-slate-800">{event.actor.type}</span>
        </div>
      </div>

      {event.blockerCodes.length > 0 && (
        <div className="text-xs text-red-600 space-y-0.5">
          <p className="font-medium">Blocker codes:</p>
          {event.blockerCodes.map(c => (
            <span key={c} className="block font-mono">{c}</span>
          ))}
        </div>
      )}

      <div className="pt-1 space-y-0.5 text-xs text-slate-500 font-mono">
        <div>
          externalSendDisabled:{' '}
          <span className="text-amber-700 font-semibold">
            {String(event.metadata.externalSendDisabled)}
          </span>
        </div>
        <div>
          mkcrmDeliveryDisabled:{' '}
          <span className="text-amber-700 font-semibold">
            {String(event.metadata.mkcrmDeliveryDisabled)}
          </span>
        </div>
        <div>
          resendDisabled:{' '}
          <span className="text-amber-700 font-semibold">
            {String(event.metadata.resendDisabled)}
          </span>
        </div>
        <div>
          noPaymentCta:{' '}
          <span className="text-green-700 font-semibold">
            {String(event.metadata.noPaymentCta)}
          </span>
        </div>
        <div>
          noPhi:{' '}
          <span className="text-green-700 font-semibold">
            {String(event.metadata.noPhi)}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 italic pt-1">
        Phase 9W records dispatch lifecycle events only.
        It does not send email or trigger MKCRM delivery.
      </p>
    </div>
  )
}

// ─── Single template card ─────────────────────────────────────────────────────

function PracticeDecisionEmailCard({
  preview,
  readiness,
  projectedEvent,
  shadowPayload,
}: {
  preview:        DapPracticeDecisionEmailPreview
  readiness:      DapCommunicationDispatchReadiness
  projectedEvent: DapCommunicationDispatchEvent
  shadowPayload:  DapMkcrmDispatchShadowPayload
}) {
  const { templateKey, copy, source } = preview

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6 space-y-5"
      data-practice-decision-email-card={templateKey}
    >
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${decisionBadgeClass(templateKey)}`}
          data-template-key={templateKey}
        >
          {templateKey}
        </span>
        <span className="inline-block rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-600 border border-gray-200">
          audience: {copy.audience}
        </span>
      </div>

      {/* Email copy */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</p>
          <p className="text-sm text-gray-900 mt-0.5">{copy.subject}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview Text</p>
          <p className="text-sm text-gray-600 mt-0.5">{copy.previewText}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Headline</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{copy.headline}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Body</p>
          <ul className="mt-1 space-y-1">
            {copy.body.map((para, i) => (
              <li key={i} className="text-sm text-gray-700">{para}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Footer Note</p>
          <p className="text-xs text-gray-500 mt-0.5 italic">{copy.footerNote}</p>
        </div>
      </div>

      {/* CTA state */}
      <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3" data-cta-state>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Primary CTA</p>
        <p className="text-sm text-gray-400 mt-0.5" data-primary-cta-none>None</p>
      </div>

      {/* Safety flags */}
      <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1" data-safety-flags>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safety Flags</p>
        <FlagRow label="includesPaymentCta"       value={copy.includesPaymentCta} />
        <FlagRow label="includesPhi"              value={copy.includesPhi} />
        <FlagRow label="derivedFromBillingEvents" value={copy.derivedFromBillingEvents} />
        <FlagRow label="decidedByCbControlCenter" value={copy.decidedByCbControlCenter} positive />
        <FlagRow label="decidedByMkcrm"           value={copy.decidedByMkcrm} />
      </div>

      {/* Source authority */}
      <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 space-y-1" data-source-authority>
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Decision Authority</p>
        <SourceRow label="decisionAuthority"  value={source.decisionAuthority} />
        <SourceRow label="crmAuthority"       value={String(source.crmAuthority)} />
        <SourceRow label="paymentAuthority"   value={String(source.paymentAuthority)} />
        <SourceRow label="includesPaymentCta" value={String(source.includesPaymentCta)} />
        <SourceRow label="includesPhi"        value={String(source.includesPhi)} />
      </div>

      {/* Dispatch readiness */}
      <div
        className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 space-y-2"
        data-dispatch-readiness={templateKey}
      >
        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
          Dispatch Readiness
        </p>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-yellow-700">status:</span>
          <span className="font-mono font-semibold text-yellow-900">{readiness.status}</span>
        </div>

        <div className="flex items-center gap-2 text-xs" data-eligible-for-future-dispatch>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              readiness.eligibleForFutureDispatch ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span className="font-mono text-yellow-700">eligibleForFutureDispatch:</span>
          <span className={`font-mono font-semibold ${
            readiness.eligibleForFutureDispatch ? 'text-green-700' : 'text-red-600'
          }`}>
            {String(readiness.eligibleForFutureDispatch)}
          </span>
        </div>

        <div className="text-xs font-mono text-yellow-700">
          channel: {readiness.channel}
        </div>

        <div className="text-xs font-mono text-yellow-700">
          copySafe: {String(readiness.safety.copySafe)}
        </div>

        {readiness.blockers.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="text-xs font-medium text-red-600">Blockers:</p>
            {readiness.blockers.map(b => (
              <div key={b.code} className="text-xs text-red-700">
                [{b.severity}] {b.code}: {b.message}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-yellow-600 italic pt-1" data-send-disabled-notice>
          Sending disabled in Phase 9V.
        </p>
      </div>

      {/* Projected dispatch event */}
      <ProjectedDispatchEventSection event={projectedEvent} />

      {/* MKCRM shadow payload */}
      <MkcrmShadowPayloadSection shadowPayload={shadowPayload} />
    </article>
  )
}

function FlagRow({
  label,
  value,
  positive = false,
}: {
  label:    string
  value:    boolean
  positive?: boolean
}) {
  const safe = positive ? value === true : value === false
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-block w-2 h-2 rounded-full ${safe ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="font-mono text-gray-700">{label}:</span>
      <span className={`font-mono font-semibold ${safe ? 'text-green-700' : 'text-red-600'}`}>
        {String(value)}
      </span>
    </div>
  )
}

function SourceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono text-blue-600">{label}:</span>
      <span className="font-mono font-semibold text-blue-900">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeDecisionEmailPreviewPage() {
  const previews = getAllDapPracticeDecisionEmailPreviews()

  const byKey             = new Map(previews.map(p => [p.templateKey, p]))
  const readinessByKey    = new Map(
    previews.map(p => [p.templateKey, getDapPracticeDecisionEmailDispatchReadiness(p)])
  )
  const projectedEventByKey = new Map(
    previews.map(p => {
      const readiness = readinessByKey.get(p.templateKey)!
      return [
        p.templateKey,
        buildDapDispatchEventFromReadiness(readiness, { communicationType: 'practice_decision_email' }),
      ]
    })
  )
  const shadowPayloadByKey = new Map(
    Array.from(projectedEventByKey.entries()).map(([key, event]) => [
      key,
      buildDapMkcrmDispatchShadowPayloadFromEvent(event),
    ])
  )

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-10"
      data-practice-decision-email-preview-page
    >
      {/* Back nav */}
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="practice-decision-email-preview"
        >
          DAP Practice Decision Email Previews
        </h1>
        <p className="text-xs text-gray-400">
          Preview only — internal use. No emails are sent from this page.
        </p>
      </div>

      {/* Authority boundary notice */}
      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2"
        data-authority-notice
      >
        <p className="text-xs font-semibold text-blue-800">Decision Authority</p>
        <p className="text-xs text-blue-700">
          CB Control Center determines communication eligibility. MKCRM may later deliver approved
          communications, but MKCRM does not decide practice status, payment status, membership
          standing, or dispatch eligibility.
        </p>
        <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
          <li>No payment CTA is present on any template.</li>
          <li>No PHI is present on any template.</li>
          <li>These are preview-only copies. No email is sent from this surface.</li>
          <li>Phase 9W records dispatch lifecycle events only. It does not send email or trigger MKCRM delivery.</li>
        </ul>
      </section>

      {/* Template groups */}
      {GROUPS.map(group => (
        <section key={group.label} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
            {group.label}
          </h2>
          <div className="space-y-6">
            {group.keys.map(key => {
              const preview        = byKey.get(key)
              const readiness      = readinessByKey.get(key)
              const projectedEvent = projectedEventByKey.get(key)
              const shadowPayload  = shadowPayloadByKey.get(key)
              if (!preview || !readiness || !projectedEvent || !shadowPayload) return null
              return (
                <PracticeDecisionEmailCard
                  key={key}
                  preview={preview}
                  readiness={readiness}
                  projectedEvent={projectedEvent}
                  shadowPayload={shadowPayload}
                />
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
