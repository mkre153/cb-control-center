import { listOfferTermsDrafts } from '@/lib/cb-control-center/dapOfferTerms'
import type { DapOfferTermsDraft } from '@/lib/dap/registry/dapOfferTermsTypes'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusBadgeClass(status: string): string {
  if (status === 'submitted_for_review') return 'bg-blue-50 text-blue-700'
  if (status === 'needs_clarification')  return 'bg-amber-50 text-amber-700'
  if (status === 'collecting_terms')     return 'bg-indigo-50 text-indigo-700'
  return 'bg-gray-50 text-gray-600'
}

function DraftRow({ draft }: { draft: DapOfferTermsDraft }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-800">
        {draft.practice_name ?? <span className="text-gray-400">—</span>}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">{draft.city ?? '—'}</td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500">
        <Link
          href={`/preview/dap/onboarding/${draft.onboarding_intake_id}`}
          className="text-blue-600 hover:underline"
          data-onboarding-link={draft.onboarding_intake_id}
        >
          {draft.onboarding_intake_id.slice(0, 8)}…
        </Link>
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(draft.status)}`}
          data-draft-status={draft.status}
        >
          {draft.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {draft.annual_membership_fee != null ? `$${draft.annual_membership_fee}` : <span className="text-gray-400">—</span>}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {draft.discount_percentage != null ? `${draft.discount_percentage}%` : <span className="text-gray-400">—</span>}
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {new Date(draft.updated_at).toLocaleString()}
      </td>
      <td className="py-3 px-4 text-xs">
        <Link
          href={`/preview/dap/offer-terms/${draft.id}`}
          className="text-blue-600 hover:underline"
          data-draft-link={draft.id}
        >
          View →
        </Link>
      </td>
    </tr>
  )
}

export default async function DapOfferTermsListPage() {
  const drafts = await listOfferTermsDrafts()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold text-gray-900"
            data-page-heading="dap-offer-terms-list"
          >
            Offer Terms Drafts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Internal drafts only — not validated pricing or public claims
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/preview/dap/onboarding" className="text-sm text-blue-600 hover:underline">
            ← Onboarding queue
          </Link>
          <span className="text-sm text-gray-400">
            {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
          </span>
        </div>
      </div>

      <p
        className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2"
        data-offer-terms-disclaimer
      >
        Offer terms shown here are internal drafts only. They are not validated, approved, public,
        or eligible for patient-facing claims. Do not use these values in public pages, CMS export,
        pricing claims, or Join CTA logic.
      </p>

      {drafts.length === 0 ? (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center"
          data-empty-state
        >
          <p className="text-gray-500 text-sm">No offer terms drafts yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Create a draft from an interested practice&apos;s onboarding detail page.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left" data-offer-terms-table>
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-3 px-4">Practice</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Onboarding Intake</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Annual Fee</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4">Detail</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map(draft => (
                <DraftRow key={draft.id} draft={draft} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
