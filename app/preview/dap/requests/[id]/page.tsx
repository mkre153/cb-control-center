import { notFound } from 'next/navigation'
import { getDapRequest, getDapRequestEvents } from '@/lib/cb-control-center/dapRequestAdmin'
import type { DapRequestEvent } from '@/lib/cb-control-center/dapRequestTypes'
import { approveRequestAction, rejectRequestAction, needsReviewRequestAction } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

const DECISION_EVENT_TYPES = new Set(['request_approved', 'request_rejected', 'request_needs_review'])

function EventRow({ event }: { event: DapRequestEvent }) {
  const meta = event.metadata_json as Record<string, unknown> | null
  const isDecision = DECISION_EVENT_TYPES.has(event.event_type)
  const actorDisplay = meta?.actor_id ? String(meta.actor_id) : event.actor_type

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 px-4 text-xs text-gray-500">
        {new Date(event.event_timestamp).toLocaleString()}
      </td>
      <td className="py-2 px-4 text-sm font-mono text-gray-800">{event.event_type}</td>
      <td className="py-2 px-4 text-xs text-gray-500" data-event-actor>
        {actorDisplay}
      </td>
      <td className="py-2 px-4 text-sm text-gray-600">
        {isDecision && meta ? (
          <div className="space-y-0.5 text-xs" data-event-transition>
            <div>
              <span className="text-gray-400">from:</span>{' '}
              <span className="font-mono" data-event-previous-status>
                {String(meta.previous_status ?? '—')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">to:</span>{' '}
              <span className="font-mono" data-event-new-status>
                {String(meta.new_status ?? '—')}
              </span>
            </div>
            {event.event_note && (
              <div className="text-gray-500 italic" data-event-note>
                {event.event_note}
              </div>
            )}
          </div>
        ) : (
          <span data-event-note>{event.event_note ?? '—'}</span>
        )}
      </td>
    </tr>
  )
}

function Field({ label, value }: { label: string; value: string | boolean | null | undefined }) {
  const display =
    value === null || value === undefined ? '—' : typeof value === 'boolean' ? String(value) : value
  return (
    <div className="flex gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-all">{display}</dd>
    </div>
  )
}

export default async function DapRequestDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const [request, events] = await Promise.all([getDapRequest(id), getDapRequestEvents(id)])

  if (!request) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-request-detail>
      <div className="flex items-center gap-3">
        <Link
          href="/preview/dap/requests"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to queue
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-900" data-page-heading="dap-request-detail">
          Request Detail
        </h1>
        <p className="font-mono text-xs text-gray-400">{request.id}</p>
        <p className="text-xs text-gray-400">Internal review only</p>
      </div>

      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-4"
        data-decision-panel
      >
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Review Decision
          </h2>
          <p className="text-xs text-amber-800" data-decision-disclaimer>
            This decision only updates the internal DAP request workflow. It does not publish a
            provider page, validate offer terms, or unlock patient-facing claims.
          </p>
        </div>

        <form className="space-y-3">
          <input type="hidden" name="requestId" value={request.id} />
          <textarea
            name="note"
            placeholder="Optional review note…"
            rows={2}
            className="w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex flex-wrap gap-3">
            <button
              formAction={approveRequestAction}
              type="submit"
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              data-action="approve"
            >
              Approve
            </button>
            <button
              formAction={needsReviewRequestAction}
              type="submit"
              className="rounded border border-amber-400 bg-white px-4 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
              data-action="needs-review"
            >
              Needs Review
            </button>
            <button
              formAction={rejectRequestAction}
              type="submit"
              className="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              data-action="reject"
            >
              Reject
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status</h2>
        <dl className="space-y-2">
          <Field label="Request status" value={request.request_status} />
          <Field label="Created" value={new Date(request.created_at).toLocaleString()} />
          <Field label="Updated" value={new Date(request.updated_at).toLocaleString()} />
          <Field label="Source page kind" value={request.source_page_kind} />
          <Field label="Source path" value={request.source_path} />
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact</h2>
        <dl className="space-y-2">
          <Field label="Name" value={request.requester_name} />
          <Field label="Email" value={request.requester_email} />
          <Field label="Phone" value={request.requester_phone} />
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location &amp; Intent</h2>
        <dl className="space-y-2">
          <Field label="City" value={request.city} />
          <Field label="Zip" value={request.zip} />
          <Field label="Treatment interest" value={request.treatment_interest} />
          <Field label="Preferred practice" value={request.preferred_practice_name} />
          <Field label="Practice slug" value={request.preferred_practice_slug} />
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Consent</h2>
        <dl className="space-y-2">
          <Field label="Consent to contact practice" value={request.consent_to_contact_practice} />
          <Field label="Consent to contact patient" value={request.consent_to_contact_patient} />
          <Field label="No PHI acknowledged" value={request.no_phi_acknowledged} />
          <Field label="Consent timestamp" value={new Date(request.consent_timestamp).toLocaleString()} />
          <Field label="Consent text" value={request.consent_text} />
        </dl>
      </section>

      {request.user_message && (
        <section className="rounded-lg border border-gray-200 p-6 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Patient note</h2>
          <p className="text-sm text-gray-800">{request.user_message}</p>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Scoping</h2>
        <dl className="space-y-2">
          <Field label="Client key" value={request.client_key} />
          <Field label="Vertical key" value={request.vertical_key} />
          <Field label="Project key" value={request.project_key} />
          <Field label="Dedupe key" value={request.dedupe_key} />
        </dl>
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
                  <th className="py-2 px-4">Note</th>
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
    </main>
  )
}
