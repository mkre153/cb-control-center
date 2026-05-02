import Link from 'next/link'
import { listProviderParticipationConfirmations } from '@/lib/cb-control-center/dapProviderParticipation'
import type { DapProviderParticipationConfirmation } from '@/lib/dap/registry/dapProviderParticipationTypes'

export const dynamic = 'force-dynamic'

function ConfirmationRow({ conf }: { conf: DapProviderParticipationConfirmation }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-4 text-sm text-gray-900">{conf.practice_name ?? '—'}</td>
      <td className="py-2 px-4 text-sm text-gray-600">{conf.city ?? '—'}</td>
      <td className="py-2 px-4 text-xs">
        <Link
          href={`/preview/dap/offer-terms/${conf.draft_id}`}
          className="text-blue-600 hover:underline font-mono"
          data-offer-terms-link={conf.draft_id}
        >
          {conf.draft_id.slice(0, 8)}… →
        </Link>
      </td>
      <td className="py-2 px-4">
        <span
          className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700"
          data-confirmation-status={conf.status}
        >
          {conf.status}
        </span>
      </td>
      <td className="py-2 px-4 text-xs text-gray-500">
        {conf.agreement_sent_at
          ? new Date(conf.agreement_sent_at).toLocaleDateString()
          : '—'}
      </td>
      <td className="py-2 px-4 text-xs text-gray-500">
        {conf.agreement_received_at
          ? new Date(conf.agreement_received_at).toLocaleDateString()
          : '—'}
      </td>
      <td className="py-2 px-4 text-sm text-gray-600">{conf.signer_name ?? '—'}</td>
      <td className="py-2 px-4 text-xs text-gray-400">
        {new Date(conf.updated_at).toLocaleDateString()}
      </td>
      <td className="py-2 px-4">
        <Link
          href={`/preview/dap/provider-participation/${conf.id}`}
          className="text-blue-600 hover:underline text-xs"
          data-manage-link={conf.id}
        >
          Manage →
        </Link>
      </td>
    </tr>
  )
}

export default async function ProviderParticipationListPage() {
  const confirmations = await listProviderParticipationConfirmations()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6" data-provider-participation-list>
      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="provider-participation-list"
        >
          Provider Participation Confirmations
        </h1>
        <p className="text-xs text-gray-400">Internal records only</p>
      </div>

      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        data-provider-participation-disclaimer
      >
        <p className="text-xs text-amber-800">
          Provider participation confirmations are internal records only. They do not publish
          provider pages, validate public pricing, or unlock patient-facing enrollment claims.
        </p>
      </section>

      <div className="flex">
        <Link
          href="/preview/dap/offer-terms"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Offer terms
        </Link>
      </div>

      {confirmations.length === 0 ? (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center"
          data-empty-state
        >
          <p className="text-sm text-gray-500">No participation confirmations yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Start confirmation from an offer terms draft whose review has passed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left" data-provider-participation-table>
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-2 px-4">Practice</th>
                <th className="py-2 px-4">City</th>
                <th className="py-2 px-4">Offer Terms Draft</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Agreement Sent</th>
                <th className="py-2 px-4">Agreement Received</th>
                <th className="py-2 px-4">Signer</th>
                <th className="py-2 px-4">Updated</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {confirmations.map(conf => (
                <ConfirmationRow key={conf.id} conf={conf} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
