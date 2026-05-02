import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getOfferTermsDraftById,
  getOfferTermsEvents,
} from '@/lib/cb-control-center/dapOfferTerms'
import {
  getOfferTermsReviewByDraftId,
  getOfferTermsReviewEvents,
} from '@/lib/cb-control-center/dapOfferTermsReview'
import { getProviderParticipationByReviewId } from '@/lib/cb-control-center/dapProviderParticipation'
import { canTransitionDapOfferTermsStatus } from '@/lib/cb-control-center/dapOfferTermsRules'
import type {
  DapOfferTermsDraftStatus,
  DapOfferTermsEvent,
} from '@/lib/cb-control-center/dapOfferTermsTypes'
import type {
  DapOfferTermsReview,
  DapOfferTermsReviewEvent,
} from '@/lib/cb-control-center/dapOfferTermsReviewTypes'
import type { DapProviderParticipationConfirmation } from '@/lib/dap/registry/dapProviderParticipationTypes'
import {
  updateOfferTermsDraftAction,
  submitOfferTermsDraftForReviewAction,
  markOfferTermsDraftNeedsClarificationAction,
  markOfferTermsDraftCollectingAction,
  addOfferTermsNoteAction,
} from '../actions'
import {
  startOfferTermsReviewAction,
  passOfferTermsReviewAction,
  failOfferTermsReviewAction,
  requestOfferTermsClarificationAction,
  addOfferTermsReviewNoteAction,
} from '../reviewActions'
import { startProviderParticipationConfirmationAction } from '../../provider-participation/actions'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

type StatusAction = {
  status: DapOfferTermsDraftStatus
  label: string
  action: (formData: FormData) => Promise<void>
  style: string
}

const STATUS_ACTIONS: StatusAction[] = [
  {
    status: 'collecting_terms',
    label:  'Start Collecting Terms',
    action: markOfferTermsDraftCollectingAction,
    style:  'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    status: 'submitted_for_review',
    label:  'Submit for Review',
    action: submitOfferTermsDraftForReviewAction,
    style:  'bg-blue-600 hover:bg-blue-700',
  },
  {
    status: 'needs_clarification',
    label:  'Needs Clarification',
    action: markOfferTermsDraftNeedsClarificationAction,
    style:  'bg-amber-600 hover:bg-amber-700',
  },
]

function EventRow({ event }: { event: DapOfferTermsEvent }) {
  const meta = event.metadata_json as Record<string, unknown> | null
  const hasPrevious = meta?.previous_status !== undefined

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 px-4 text-xs text-gray-500">
        {new Date(event.event_timestamp).toLocaleString()}
      </td>
      <td className="py-2 px-4 text-sm font-mono text-gray-800">{event.event_type}</td>
      <td className="py-2 px-4 text-xs text-gray-500">
        {meta?.actor_id ? String(meta.actor_id) : event.actor_type}
      </td>
      <td className="py-2 px-4 text-xs text-gray-600">
        {hasPrevious && (
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-400">from:</span>{' '}
              <span className="font-mono">{String(meta!.previous_status)}</span>
            </div>
            <div>
              <span className="text-gray-400">to:</span>{' '}
              <span className="font-mono">{String(meta!.new_status ?? '—')}</span>
            </div>
          </div>
        )}
        {event.event_note && (
          <div className="text-gray-500 italic mt-0.5">{event.event_note}</div>
        )}
      </td>
    </tr>
  )
}

function FieldRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value == null ? '—' : String(value)
  return (
    <div className="flex gap-4">
      <dt className="w-52 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{display}</dd>
    </div>
  )
}

export default async function DapOfferTermsDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const [draft, events, review] = await Promise.all([
    getOfferTermsDraftById(id),
    getOfferTermsEvents(id),
    getOfferTermsReviewByDraftId(id),
  ])

  if (!draft) notFound()

  const reviewEvents: DapOfferTermsReviewEvent[] = review
    ? await getOfferTermsReviewEvents(review.id)
    : []

  const participation: DapProviderParticipationConfirmation | null =
    review?.status === 'review_passed'
      ? await getProviderParticipationByReviewId(review.id)
      : null

  const validStatusActions = STATUS_ACTIONS.filter(a =>
    canTransitionDapOfferTermsStatus(draft.status, a.status),
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-offer-terms-detail>
      <div>
        <Link href="/preview/dap/offer-terms" className="text-sm text-blue-600 hover:underline">
          ← Back to offer terms
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="dap-offer-terms-detail"
        >
          Offer Terms Draft
        </h1>
        <p className="font-mono text-xs text-gray-400">{draft.id}</p>
        <p className="text-xs text-gray-400">Internal draft only</p>
      </div>

      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        data-no-public-claims-disclaimer
      >
        <p className="text-xs text-amber-800">
          Collected terms are internal drafts. Do not use these values in public pages, CMS export,
          pricing claims, or Join CTA logic. A submitted draft does not confirm provider
          participation or unlock patient-facing claims.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Practice</h2>
        <dl className="space-y-2">
          <FieldRow label="Name"   value={draft.practice_name} />
          <FieldRow label="City"   value={draft.city} />
          <FieldRow label="Status" value={draft.status} />
          <div className="flex gap-4">
            <dt className="w-52 shrink-0 text-sm font-medium text-gray-500">Source Onboarding</dt>
            <dd className="text-sm">
              <Link
                href={`/preview/dap/onboarding/${draft.onboarding_intake_id}`}
                className="text-blue-600 hover:underline font-mono text-xs"
                data-source-onboarding-link={draft.onboarding_intake_id}
              >
                {draft.onboarding_intake_id.slice(0, 8)}… →
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-6 space-y-4" data-offer-terms-fields>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Offer Fields (Internal Draft)
        </h2>
        <form className="space-y-4">
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="onboardingIntakeId" value={draft.onboarding_intake_id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name</label>
              <input
                type="text"
                name="planName"
                defaultValue={draft.plan_name ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Annual Membership Fee ($)</label>
              <input
                type="number"
                name="annualMembershipFee"
                defaultValue={draft.annual_membership_fee ?? ''}
                step="0.01"
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cleanings / Year</label>
              <input
                type="number"
                name="includedCleaningsPerYear"
                defaultValue={draft.included_cleanings_per_year ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exams / Year</label>
              <input
                type="number"
                name="includedExamsPerYear"
                defaultValue={draft.included_exams_per_year ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">X-Rays / Year</label>
              <input
                type="number"
                name="includedXraysPerYear"
                defaultValue={draft.included_xrays_per_year ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount Percentage (%)</label>
              <input
                type="number"
                name="discountPercentage"
                defaultValue={draft.discount_percentage ?? ''}
                step="0.1"
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Preventive Care Summary</label>
            <textarea
              name="preventiveCareSummary"
              rows={2}
              defaultValue={draft.preventive_care_summary ?? ''}
              className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Excluded Services (one per line)</label>
            <textarea
              name="excludedServices"
              rows={2}
              defaultValue={(draft.excluded_services ?? []).join('\n')}
              className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Waiting Period</label>
              <input
                type="text"
                name="waitingPeriod"
                defaultValue={draft.waiting_period ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cancellation Terms</label>
              <input
                type="text"
                name="cancellationTerms"
                defaultValue={draft.cancellation_terms ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Renewal Terms</label>
              <input
                type="text"
                name="renewalTerms"
                defaultValue={draft.renewal_terms ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Internal Notes</label>
            <textarea
              name="fieldNotes"
              rows={2}
              defaultValue={draft.notes ?? ''}
              className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <button
            formAction={updateOfferTermsDraftAction}
            type="submit"
            className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            data-action="save-fields"
          >
            Save Changes
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-4" data-offer-terms-workflow>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Review Workflow
          </h2>
          <p className="text-xs text-amber-800">
            Current status:{' '}
            <span className="font-mono font-semibold" data-draft-current-status={draft.status}>
              {draft.status}
            </span>
          </p>
        </div>
        <form className="space-y-3">
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="onboardingIntakeId" value={draft.onboarding_intake_id} />
          <textarea
            name="note"
            placeholder="Optional note…"
            rows={2}
            className="w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex flex-wrap gap-3">
            {validStatusActions.map(a => (
              <button
                key={a.status}
                formAction={a.action}
                type="submit"
                className={`rounded px-4 py-1.5 text-sm font-medium text-white ${a.style}`}
                data-action={a.status}
              >
                {a.label}
              </button>
            ))}
            <button
              formAction={addOfferTermsNoteAction}
              type="submit"
              className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-action="add-note"
            >
              Add Note
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3" data-event-log>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Event log ({events.length})
        </h2>
        {events.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center" data-empty-events>
            <p className="text-sm text-gray-500">No events recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left" data-events-table>
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="py-2 px-4">Time</th>
                  <th className="py-2 px-4">Event</th>
                  <th className="py-2 px-4">Actor</th>
                  <th className="py-2 px-4">Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {draft.status === 'submitted_for_review' && (
        <section
          className="rounded-lg border border-violet-200 bg-violet-50 p-6 space-y-4"
          data-review-panel
        >
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Internal Review
            </h2>
            <p
              className="text-xs text-violet-800"
              data-review-disclaimer
            >
              Passing review only means the submitted terms cleared internal review criteria.
              It does not validate public pricing, confirm provider participation, unlock
              Join CTA behavior, or publish any patient-facing claims.
            </p>
          </div>

          {!review && (
            <form>
              <input type="hidden" name="draftId" value={draft.id} />
              <button
                formAction={startOfferTermsReviewAction}
                type="submit"
                className="rounded bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                data-action="start-review"
              >
                Start Review
              </button>
            </form>
          )}

          {review && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Review status:{' '}
                <span className="font-mono font-semibold" data-review-status={review.status}>
                  {review.status}
                </span>
              </p>

              <form className="space-y-3" data-review-criteria>
                <input type="hidden" name="draftId"  value={draft.id} />
                <input type="hidden" name="reviewId" value={review.id} />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Review Criteria
                  </p>
                  {([
                    ['planNamePresent',          'Plan name present'],
                    ['annualFeePresent',          'Annual fee present'],
                    ['preventiveCareDefined',     'Preventive care defined'],
                    ['discountTermsDefined',      'Discount terms defined'],
                    ['exclusionsDefined',         'Exclusions defined'],
                    ['cancellationTermsDefined',  'Cancellation terms defined'],
                    ['renewalTermsDefined',       'Renewal terms defined'],
                  ] as const).map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name={name}
                        defaultChecked={
                          (review.criteria_json as Record<string, boolean> | null)?.[name] === true
                        }
                        className="rounded border-gray-300"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Reviewer Notes
                  </label>
                  <textarea
                    name="reviewerNotes"
                    rows={2}
                    defaultValue={review.criteria_json?.reviewerNotes ?? ''}
                    placeholder="Internal reviewer notes…"
                    className="w-full rounded border border-violet-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    formAction={passOfferTermsReviewAction}
                    type="submit"
                    className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                    data-action="pass-review"
                  >
                    Pass Review
                  </button>
                  <button
                    formAction={failOfferTermsReviewAction}
                    type="submit"
                    className="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                    data-action="fail-review"
                  >
                    Fail Review
                  </button>
                  <button
                    formAction={requestOfferTermsClarificationAction}
                    type="submit"
                    className="rounded bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                    data-action="request-clarification"
                  >
                    Request Clarification
                  </button>
                  <button
                    formAction={addOfferTermsReviewNoteAction}
                    type="submit"
                    className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    data-action="add-review-note"
                  >
                    Add Note
                  </button>
                </div>
              </form>

              {reviewEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Review Events ({reviewEvents.length})
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-violet-100">
                    <table className="w-full text-left" data-review-events-table>
                      <thead className="bg-violet-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <tr>
                          <th className="py-2 px-4">Time</th>
                          <th className="py-2 px-4">Event</th>
                          <th className="py-2 px-4">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewEvents.map(ev => (
                          <ReviewEventRow key={ev.id} event={ev} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {review?.status === 'review_passed' && (
        <section
          className="rounded-lg border border-teal-200 bg-teal-50 p-6 space-y-4"
          data-provider-participation-panel
        >
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Provider Participation Confirmation
            </h2>
            <p className="text-xs text-teal-800">
              Start an internal confirmation record to document whether the practice has
              explicitly agreed to participate under the reviewed terms. This does not publish
              the provider or unlock patient-facing claims.
            </p>
          </div>

          {!participation && (
            <form>
              <input type="hidden" name="reviewId" value={review.id} />
              <input type="hidden" name="draftId"  value={draft.id} />
              <button
                formAction={startProviderParticipationConfirmationAction}
                type="submit"
                className="rounded bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
                data-action="start-provider-confirmation"
              >
                Start Provider Confirmation
              </button>
            </form>
          )}

          {participation && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                Status:{' '}
                <span className="font-mono font-semibold">
                  {participation.status}
                </span>
              </p>
              <Link
                href={`/preview/dap/provider-participation/${participation.id}`}
                className="inline-block text-sm text-teal-700 hover:underline font-medium"
                data-participation-link={participation.id}
              >
                View provider participation confirmation →
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

function ReviewEventRow({ event }: { event: DapOfferTermsReviewEvent }) {
  const meta = event.metadata_json as Record<string, unknown> | null
  return (
    <tr className="border-t border-violet-100">
      <td className="py-2 px-4 text-xs text-gray-500">
        {new Date(event.event_timestamp).toLocaleString()}
      </td>
      <td className="py-2 px-4 text-sm font-mono text-gray-800">{event.event_type}</td>
      <td className="py-2 px-4 text-xs text-gray-600">
        {meta?.previous_status !== undefined && (
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-400">from:</span>{' '}
              <span className="font-mono">{String(meta.previous_status)}</span>
            </div>
            <div>
              <span className="text-gray-400">to:</span>{' '}
              <span className="font-mono">{String(meta.new_status ?? '—')}</span>
            </div>
          </div>
        )}
        {event.event_note && (
          <div className="text-gray-500 italic mt-0.5">{event.event_note}</div>
        )}
      </td>
    </tr>
  )
}
