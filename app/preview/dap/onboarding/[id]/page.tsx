import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getOnboardingIntakeById,
  getOnboardingIntakeEvents,
} from '@/lib/cb-control-center/dapPracticeOnboarding'
import { canTransitionDapPracticeOnboardingStatus } from '@/lib/cb-control-center/dapPracticeOnboardingRules'
import type {
  DapPracticeOnboardingEvent,
  DapPracticeOnboardingStatus,
} from '@/lib/cb-control-center/dapPracticeOnboardingTypes'
import {
  markOutreachNeededAction,
  markOutreachStartedAction,
  recordPracticeRespondedAction,
  markPracticeInterestedAction,
  markPracticeNotInterestedAction,
  markTermsNeededAction,
  addOnboardingNoteAction,
} from '../actions'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

type StatusAction = {
  status: DapPracticeOnboardingStatus
  label: string
  action: (formData: FormData) => Promise<void>
  style: string
}

const STATUS_ACTIONS: StatusAction[] = [
  {
    status: 'outreach_needed',
    label:  'Mark Outreach Needed',
    action: markOutreachNeededAction,
    style:  'bg-yellow-600 hover:bg-yellow-700',
  },
  {
    status: 'outreach_started',
    label:  'Mark Outreach Started',
    action: markOutreachStartedAction,
    style:  'bg-blue-600 hover:bg-blue-700',
  },
  {
    status: 'practice_responded',
    label:  'Mark Practice Responded',
    action: recordPracticeRespondedAction,
    style:  'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    status: 'interested',
    label:  'Mark Interested',
    action: markPracticeInterestedAction,
    style:  'bg-green-600 hover:bg-green-700',
  },
  {
    status: 'not_interested',
    label:  'Mark Not Interested',
    action: markPracticeNotInterestedAction,
    style:  'bg-red-600 hover:bg-red-700',
  },
  {
    status: 'terms_needed',
    label:  'Mark Terms Needed',
    action: markTermsNeededAction,
    style:  'bg-purple-600 hover:bg-purple-700',
  },
]

function EventRow({ event }: { event: DapPracticeOnboardingEvent }) {
  const meta = event.metadata_json as Record<string, unknown> | null
  const hasPrevious = meta?.previous_status !== undefined

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 px-4 text-xs text-gray-500">
        {new Date(event.event_timestamp).toLocaleString()}
      </td>
      <td className="py-2 px-4 text-sm font-mono text-gray-800">{event.event_type}</td>
      <td className="py-2 px-4 text-xs text-gray-500" data-event-actor>
        {meta?.actor_id ? String(meta.actor_id) : event.actor_type}
      </td>
      <td className="py-2 px-4 text-xs text-gray-600">
        {hasPrevious && (
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-400">from:</span>{' '}
              <span className="font-mono" data-event-previous-status>
                {String(meta!.previous_status)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">to:</span>{' '}
              <span className="font-mono" data-event-new-status>
                {String(meta!.new_status ?? '—')}
              </span>
            </div>
          </div>
        )}
        {event.event_note && (
          <div className="text-gray-500 italic mt-0.5" data-event-note>
            {event.event_note}
          </div>
        )}
      </td>
    </tr>
  )
}

export default async function DapOnboardingDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const [intake, events] = await Promise.all([
    getOnboardingIntakeById(id),
    getOnboardingIntakeEvents(id),
  ])

  if (!intake) notFound()

  const validStatusActions = STATUS_ACTIONS.filter(a =>
    canTransitionDapPracticeOnboardingStatus(intake.status, a.status),
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-onboarding-detail>
      <div>
        <Link href="/preview/dap/onboarding" className="text-sm text-blue-600 hover:underline">
          ← Back to onboarding queue
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="dap-onboarding-detail"
        >
          Practice Onboarding Detail
        </h1>
        <p className="font-mono text-xs text-gray-400">{intake.id}</p>
        <p className="text-xs text-gray-400">Internal review only</p>
      </div>

      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-4"
        data-onboarding-actions
      >
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Outreach Workflow
          </h2>
          <p className="text-xs text-amber-800" data-outreach-disclaimer>
            Outreach status is internal only. It does not confirm this practice as a DAP provider,
            validate offer terms, or publish any patient-facing claims.
          </p>
        </div>

        <div className="text-sm text-gray-700">
          Current status:{' '}
          <span
            className="font-mono font-semibold"
            data-current-status={intake.status}
          >
            {intake.status}
          </span>
        </div>

        <form className="space-y-3">
          <input type="hidden" name="intakeId" value={intake.id} />
          <input type="hidden" name="requestId" value={intake.request_id} />
          <textarea
            name="note"
            placeholder="Optional note…"
            rows={2}
            data-note-input
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
              formAction={addOnboardingNoteAction}
              type="submit"
              className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-action="add-note"
            >
              Add Note
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Practice</h2>
        <dl className="space-y-2">
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">Name</dt>
            <dd className="text-sm text-gray-900">{intake.practice_name ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">City</dt>
            <dd className="text-sm text-gray-900">{intake.city ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">Zip</dt>
            <dd className="text-sm text-gray-900">{intake.zip ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">Status</dt>
            <dd
              className="text-sm text-gray-900 font-mono"
              data-intake-status={intake.status}
            >
              {intake.status}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">Source Request</dt>
            <dd className="text-sm">
              <Link
                href={`/preview/dap/requests/${intake.request_id}`}
                className="text-blue-600 hover:underline font-mono text-xs"
                data-source-request-link={intake.request_id}
              >
                {intake.request_id.slice(0, 8)}… →
              </Link>
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">Created</dt>
            <dd className="text-sm text-gray-900">{new Date(intake.created_at).toLocaleString()}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">Updated</dt>
            <dd className="text-sm text-gray-900">{new Date(intake.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3" data-event-log>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Event log ({events.length})
        </h2>
        {events.length === 0 ? (
          <div
            className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center"
            data-empty-events
          >
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
    </main>
  )
}
