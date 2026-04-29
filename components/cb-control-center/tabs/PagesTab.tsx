import type { PagePlanItem } from '@/lib/cb-control-center/types'

export function PagesTab({ pages }: { pages: PagePlanItem[] }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Core 30 Pages</p>
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Page Title</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-28">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pages.map((p, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-sm text-gray-700">{p.title}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        Additional decision pages appear here once Business Truth JSON is validated and AI Search Strategy is complete.
      </p>
    </div>
  )
}
