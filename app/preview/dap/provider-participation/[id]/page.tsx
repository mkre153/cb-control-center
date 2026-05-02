import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getProviderParticipationById,
  getProviderParticipationEvents,
} from '@/lib/cb-control-center/dapProviderParticipation'
import { canTransitionDapProviderParticipationStatus } from '@/lib/dap/registry/dapProviderParticipationRules'
import type {
  DapProviderParticipationStatus,
  DapProviderParticipationEvent,
} from '@/lib/dap/registry/dapProviderParticipationTypes'
import {
  markAgreementSentAction,
  markAgreementReceivedAction,
  confirmProviderParticipationAction,
  declineProviderParticipationAction,
  voidProviderParticipationConfirmationAction,
  addProviderParticipationNoteAction,
  updateProviderParticipationFieldsAction,
} from '../actions'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

type WorkflowAction = {
  status: DapProviderParticipationStatus
  label: string
  action: (formData: FormData) => Promise<void>
  style: string
}

const WORKFLOW_ACTIONS: WorkflowAction[] = [
  {
    status: 'agreement_sent',
    label:  'Mark Agreement Sent',
    action: markAgreementSentAction,
    style:  'bg-blue-600 hover:bg-blue-700',
  },
  {
    status: 'agreement_received',
    label:  'Mark Agreement Received',
    action: markAgreementReceivedAction,
    style:  'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    status: 'participation_confirmed',
    label:  'Confirm Participation',
    action: confirmProviderParticipationAction,
    style:  'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    status: 'participation_declined',
    label:  'Mark Declined',
    action: declineProviderParticipationAction,
    style:  'bg-red-600 hover:bg-red-700',
  },
  {
    status: 'confirmation_voided',
    label:  'Void Confirmation',
    action: voidProviderParticipationConfirmationAction,
    style:  'bg-gray-500 hover:bg-gray-600',
  },
]

function EventRow({ event }: { event: DapProviderParticipationEvent }) {
  const meta = event.metadata_json as Record<string, unknown> | null
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

export default async function ProviderParticipationDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const [confirmation, events] = await Promise.all([
    getProviderParticipationById(id),
    getProviderParticipationEvents(id),
  ])

  if (!confirmation) notFound()

  const availableActions = WORKFLOW_ACTIONS.filter(a =>
    canTransitionDapProviderParticipationStatus(confirmation.status, a.status),
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-provider-participation-detail>
      <div>
        <Link
          href="/preview/dap/provider-participation"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to participation confirmations
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="provider-participation-detail"
        >
          Provider Participation Confirmation
        </h1>
        <p className="font-mono text-xs text-gray-400">{confirmation.id}</p>
        <p className="text-xs text-gray-400">Internal record only</p>
      </div>

      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        data-no-public-publish-disclaimer
      >
        <p className="text-xs text-amber-800">
          Confirmed participation is required before public eligibility review, but it does not
          by itself validate pricing, unlock Join CTA behavior, or publish a confirmed provider
          page.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Practice</h2>
        <div className="space-y-2">
          <div className="flex gap-4">
            <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">Name</dt>
            <dd className="text-sm text-gray-900">{confirmation.practice_name ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">City</dt>
            <dd className="text-sm text-gray-900">{confirmation.city ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">Status</dt>
            <dd
              className="text-sm font-mono font-semibold text-gray-900"
              data-confirmation-current-status={confirmation.status}
            >
              {confirmation.status}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">Source Offer Terms</dt>
            <dd className="text-sm">
              <Link
                href={`/preview/dap/offer-terms/${confirmation.draft_id}`}
                className="text-blue-600 hover:underline font-mono text-xs"
                data-source-offer-terms-link={confirmation.draft_id}
              >
                {confirmation.draft_id.slice(0, 8)}… →
              </Link>
            </dd>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-6 space-y-4" data-agreement-fields>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Agreement Details (Internal)
        </h2>
        <form className="space-y-4">
          <input type="hidden" name="confirmationId" value={confirmation.id} />
          <input type="hidden" name="reviewId"       value={confirmation.review_id} />
          <input type="hidden" name="draftId"        value={confirmation.draft_id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agreement Sent At</label>
              <input
                type="text"
                name="agreementSentAt"
                defaultValue={confirmation.agreement_sent_at ?? ''}
                placeholder="ISO date string"
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agreement Received At</label>
              <input
                type="text"
                name="agreementReceivedAt"
                defaultValue={confirmation.agreement_received_at ?? ''}
                placeholder="ISO date string"
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Signer Name</label>
              <input
                type="text"
                name="signerName"
                defaultValue={confirmation.signer_name ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Signer Title</label>
              <input
                type="text"
                name="signerTitle"
                defaultValue={confirmation.signer_title ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Signer Email</label>
              <input
                type="text"
                name="signerEmail"
                defaultValue={confirmation.signer_email ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agreement Version</label>
              <input
                type="text"
                name="agreementVersion"
                defaultValue={confirmation.agreement_version ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Agreement Document URL</label>
              <input
                type="text"
                name="agreementDocumentUrl"
                defaultValue={confirmation.agreement_document_url ?? ''}
                className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmation Notes</label>
            <textarea
              name="confirmationNotes"
              rows={2}
              defaultValue={confirmation.confirmation_notes ?? ''}
              className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <button
            formAction={updateProviderParticipationFieldsAction}
            type="submit"
            className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            data-action="save-fields"
          >
            Save Agreement Details
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-4" data-participation-workflow>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Workflow
          </h2>
          <p className="text-xs text-amber-800">
            Current status:{' '}
            <span className="font-mono font-semibold" data-current-participation-status={confirmation.status}>
              {confirmation.status}
            </span>
          </p>
        </div>
        <form className="space-y-3">
          <input type="hidden" name="confirmationId" value={confirmation.id} />
          <input type="hidden" name="reviewId"       value={confirmation.review_id} />
          <input type="hidden" name="draftId"        value={confirmation.draft_id} />
          <textarea
            name="note"
            placeholder="Optional note…"
            rows={2}
            className="w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex flex-wrap gap-3">
            {availableActions.map(a => (
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
              formAction={addProviderParticipationNoteAction}
              type="submit"
              className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-action="add-note"
            >
              Add Note
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3" data-participation-event-log>
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
    </main>
  )
}
