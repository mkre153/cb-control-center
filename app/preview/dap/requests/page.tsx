import { listDapRequests } from '@/lib/cb-control-center/dapRequestAdmin'
import type { DapRequest } from '@/lib/dap/registry/dapRequestTypes'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusBadgeClass(status: string): string {
  if (status.startsWith('closed_')) return 'bg-gray-100 text-gray-600'
  if (status === 'submitted') return 'bg-blue-50 text-blue-700'
  if (status === 'provider_confirmed') return 'bg-green-50 text-green-700'
  return 'bg-yellow-50 text-yellow-700'
}

function RequestRow({ req }: { req: DapRequest }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 font-mono text-xs text-gray-500">
        <Link
          href={`/preview/dap/requests/${req.id}`}
          className="text-blue-600 hover:underline"
          data-request-id={req.id}
        >
          {req.id.slice(0, 8)}…
        </Link>
      </td>
      <td className="py-3 px-4 text-sm text-gray-800">{req.requester_name}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{req.city ?? '—'}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{req.treatment_interest ?? '—'}</td>
      <td className="py-3 px-4">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(req.request_status)}`}
          data-status={req.request_status}
        >
          {req.request_status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {new Date(req.created_at).toLocaleString()}
      </td>
    </tr>
  )
}

export default async function DapRequestsPage() {
  const requests = await listDapRequests()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" data-page-heading="dap-requests">
            DAP Request Queue
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Internal review only — read-only, no mutations
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {requests.length === 0 ? (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center"
          data-empty-state
        >
          <p className="text-gray-500 text-sm">No DAP requests yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left" data-requests-table>
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Treatment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <RequestRow key={req.id} req={req} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
