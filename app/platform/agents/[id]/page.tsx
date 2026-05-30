import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { CbccPlatformAgentStatusBadge } from '@/components/cb-control-center/v2/CbccPlatformAgentStatusBadge'
import { listPrcAgents, getAgentRuns } from '@/lib/cb-control-center/prcPlatform'

export const dynamic = 'force-dynamic'

function fmtTs(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 19).replace('T', ' ') + ' UTC'
}

function duration(a: string | null, b: string | null): string {
  if (!a || !b) return '—'
  const ms = new Date(b).getTime() - new Date(a).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60000)}m`
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [agents, runs] = await Promise.all([listPrcAgents(), getAgentRuns(id)])
  const agent = agents.find((a) => a.id === id)
  if (!agent) notFound()

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      <CbccNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/platform/agents" className="text-xs text-blue-400 hover:text-blue-300">
          ← Agent Registry
        </Link>

        <header className="mt-3 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-100">{agent.name}</h1>
            <CbccPlatformAgentStatusBadge status={agent.lastStatus} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {agent.kind} · {agent.domain} · writes <code className="text-gray-600">{agent.writesTable}</code> ·{' '}
            {agent.runsOn} · {agent.trigger} ({agent.cadence})
          </p>
          <p className="mt-1 font-mono text-xs text-gray-600">{agent.script}</p>
          {agent.notes && <p className="mt-3 text-sm text-gray-400">{agent.notes}</p>}
        </header>

        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-200">Run History</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-gray-500">No runs recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Items</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-900/60 align-top">
                    <td className="px-4 py-2.5 text-gray-400">{fmtTs(r.startedAt)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          r.status === 'ok'
                            ? 'text-emerald-400'
                            : r.status === 'error'
                              ? 'text-red-400'
                              : 'text-blue-400'
                        }
                      >
                        {r.status}
                      </span>
                      {r.error && <p className="mt-1 max-w-md text-xs text-red-400/70">{r.error}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{r.items}</td>
                    <td className="px-4 py-2.5 text-gray-500">{duration(r.startedAt, r.finishedAt)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{r.trigger ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
