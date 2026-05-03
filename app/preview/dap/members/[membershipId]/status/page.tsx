import Link from 'next/link'
import {
  getDapMemberStatusPreview,
} from '@/lib/dap/membership/dapMemberStatusPreview'
import { isTerminalDapMemberStanding } from '@/lib/dap/registry/dapMemberStatusRules'
import type { DapMemberStanding } from '@/lib/dap/membership/dapMemberStatusTypes'
import type { DapMemberBillingEventForStatus } from '@/lib/dap/membership/dapMemberStatusTypes'

export const dynamic = 'force-dynamic'

type Params = Promise<{ membershipId: string }>

function standingBadgeClass(standing: DapMemberStanding): string {
  switch (standing) {
    case 'active':          return 'bg-green-50 text-green-700 border border-green-200'
    case 'pending':         return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'past_due':        return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'payment_failed':  return 'bg-red-50 text-red-700 border border-red-200'
    case 'canceled':        return 'bg-gray-100 text-gray-600 border border-gray-300'
    case 'refunded':        return 'bg-violet-50 text-violet-700 border border-violet-200'
    case 'chargeback':      return 'bg-red-100 text-red-800 border border-red-300'
    default:                return 'bg-gray-50 text-gray-500 border border-gray-200'
  }
}

function BillingEventRow({ event, index }: { event: DapMemberBillingEventForStatus; index: number }) {
  return (
    <tr className="border-t border-gray-100" data-billing-event-row={index}>
      <td className="py-2 px-4 text-xs text-gray-500">
        {new Date(event.occurredAt).toLocaleString()}
      </td>
      <td className="py-2 px-4 text-sm font-mono text-gray-800">
        {event.eventType}
      </td>
      <td className="py-2 px-4 text-xs text-gray-500">
        {event.receivedAt ? new Date(event.receivedAt).toLocaleString() : '—'}
      </td>
    </tr>
  )
}

export default async function MemberStatusPreviewPage({ params }: { params: Params }) {
  const { membershipId } = await params
  const preview = getDapMemberStatusPreview(membershipId)
  const { readModel, billingEvents, display } = preview
  const terminal = isTerminalDapMemberStanding(readModel.standing)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8" data-member-status-preview>
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="member-status-preview"
        >
          Derived Member Standing
        </h1>
        <p className="font-mono text-xs text-gray-400" data-membership-id>{membershipId}</p>
        <p className="text-xs text-gray-400">Preview only — internal use</p>
      </div>

      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4"
        data-derived-status-notice
      >
        <p className="text-xs text-blue-800">
          This status is calculated from append-only Client Builder Pro billing events.
          DAP does not manually set member standing, and MKCRM does not determine billing status.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 p-6 space-y-4" data-standing-summary>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Derived Standing
        </h2>

        <div className="flex items-center gap-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${standingBadgeClass(readModel.standing)}`}
            data-member-standing={readModel.standing}
          >
            {display.label}
          </span>
          {terminal && (
            <span className="text-xs text-gray-500">(terminal)</span>
          )}
        </div>

        <p className="text-sm text-gray-600" data-standing-description>
          {display.description}
        </p>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-gray-500">Event count</dt>
            <dd className="font-mono text-gray-900" data-event-count>{readModel.eventCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Last event type</dt>
            <dd className="font-mono text-xs text-gray-900" data-last-event-type>
              {readModel.lastBillingEventType ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Last event at</dt>
            <dd className="font-mono text-xs text-gray-900" data-last-event-at>
              {readModel.lastBillingEventAt
                ? new Date(readModel.lastBillingEventAt).toLocaleString()
                : '—'}
            </dd>
          </div>
        </dl>

        <div className="text-xs text-gray-400 space-y-0.5" data-read-model-meta>
          <div>
            Billing source:{' '}
            <span className="font-mono">client_builder_pro</span>
          </div>
          <div>
            MKCRM role:{' '}
            <span className="font-mono">lifecycle sync destination only</span>
          </div>
          <div>
            Derived from billing events:{' '}
            <span className="font-mono">{String(readModel.derivedFromBillingEvents)}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3" data-billing-event-log>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Billing Event Log ({billingEvents.length})
        </h2>
        <p className="text-xs text-gray-500">
          Append-only. Client Builder Pro is the billing event source.
          MKCRM receives lifecycle sync signals only and is not a billing source.
        </p>
        {billingEvents.length === 0 ? (
          <div
            className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center"
            data-empty-events
          >
            <p className="text-sm text-gray-500">
              No Client Builder Pro billing events recorded for this membership.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left" data-events-table>
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="py-2 px-4">Occurred At</th>
                  <th className="py-2 px-4">Event Type</th>
                  <th className="py-2 px-4">Received At</th>
                </tr>
              </thead>
              <tbody>
                {billingEvents.map((event, i) => (
                  <BillingEventRow
                    key={`${event.eventType}-${event.occurredAt}-${i}`}
                    event={event}
                    index={i}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
