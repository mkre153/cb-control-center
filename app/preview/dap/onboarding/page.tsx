import { listOnboardingIntakes } from '@/lib/cb-control-center/dapPracticeOnboarding'
import type { DapPracticeOnboardingIntake } from '@/lib/cb-control-center/dapPracticeOnboardingTypes'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusBadgeClass(status: string): string {
  if (status === 'not_interested') return 'bg-red-50 text-red-700'
  if (status === 'interested' || status === 'ready_for_offer_validation') return 'bg-green-50 text-green-700'
  if (status === 'intake_created') return 'bg-blue-50 text-blue-700'
  return 'bg-yellow-50 text-yellow-700'
}

function IntakeRow({ intake }: { intake: DapPracticeOnboardingIntake }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-800">
        {intake.practice_name ?? <span className="text-gray-400">—</span>}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">{intake.city ?? '—'}</td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500">
        <Link
          href={`/preview/dap/requests/${intake.request_id}`}
          className="text-blue-600 hover:underline"
          data-source-request-link={intake.request_id}
        >
          {intake.request_id.slice(0, 8)}…
        </Link>
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(intake.status)}`}
          data-intake-status={intake.status}
        >
          {intake.status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {new Date(intake.created_at).toLocaleString()}
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {new Date(intake.updated_at).toLocaleString()}
      </td>
      <td className="py-3 px-4 text-xs">
        <Link
          href={`/preview/dap/onboarding/${intake.id}`}
          className="text-blue-600 hover:underline"
          data-manage-link={intake.id}
        >
          Manage →
        </Link>
      </td>
    </tr>
  )
}

export default async function DapOnboardingListPage() {
  const intakes = await listOnboardingIntakes()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" data-page-heading="dap-onboarding-list">
            Practice Onboarding Intakes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Internal tracking only — not public provider records
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/preview/dap/requests" className="text-sm text-blue-600 hover:underline">
            ← Request queue
          </Link>
          <span className="text-sm text-gray-400">
            {intakes.length} {intakes.length === 1 ? 'intake' : 'intakes'}
          </span>
        </div>
      </div>

      <p
        className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2"
        data-outreach-disclaimer
      >
        Outreach status is internal only. Progress through outreach stages does not confirm a
        practice as a DAP provider, validate offer terms, or publish any patient-facing claims.
      </p>

      {intakes.length === 0 ? (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center"
          data-empty-state
        >
          <p className="text-gray-500 text-sm">No onboarding intakes yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Approve a DAP request and create an intake from the request detail page.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left" data-onboarding-table>
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-3 px-4">Practice</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Source Request</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {intakes.map(intake => (
                <IntakeRow key={intake.id} intake={intake} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
