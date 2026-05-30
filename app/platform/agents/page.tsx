import Link from 'next/link'
import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { CbccPlatformAgentStatusBadge } from '@/components/cb-control-center/v2/CbccPlatformAgentStatusBadge'
import { listPrcAgents, getDomainHealth } from '@/lib/cb-control-center/prcPlatform'

export const dynamic = 'force-dynamic'

function fmtTs(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export default async function PlatformAgentsPage() {
  const [agents, health] = await Promise.all([listPrcAgents(), getDomainHealth()])

  const scheduled = agents.filter((a) => a.trigger === 'cron').length
  const erroring = agents.filter((a) => a.lastStatus === 'error').length

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      <CbccNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8">
          <Link href="/platform" className="text-xs text-blue-400 hover:text-blue-300">
            ← Platform
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-gray-100">Agent Registry</h1>
          <p className="mt-1 text-sm text-gray-500">
            The autonomous agents that fulfill PremiumRoast data, synced from{' '}
            <code className="text-gray-600">scripts/lib/agent-registry.ts</code>.
          </p>
          <div className="mt-3 flex gap-6 text-sm">
            <span><span className="text-lg font-semibold text-gray-100 tabular-nums">{agents.length}</span> <span className="text-gray-500">agents</span></span>
            <span><span className="text-lg font-semibold text-blue-300 tabular-nums">{scheduled}</span> <span className="text-gray-500">scheduled</span></span>
            <span><span className={`text-lg font-semibold tabular-nums ${erroring ? 'text-red-400' : 'text-gray-100'}`}>{erroring}</span> <span className="text-gray-500">erroring</span></span>
          </div>
        </header>

        {agents.length === 0 ? (
          <p className="rounded-lg border border-gray-800 bg-gray-900/60 p-5 text-sm text-gray-500">
            No agents yet. Apply <code>20260530_agent_registry.sql</code> and run{' '}
            <code className="text-gray-400">npx tsx scripts/sync-agent-registry.ts</code>.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Agent</th>
                  <th className="px-4 py-2 font-medium">Domain</th>
                  <th className="px-4 py-2 font-medium">Kind</th>
                  <th className="px-4 py-2 font-medium">Runs on</th>
                  <th className="px-4 py-2 font-medium">Trigger</th>
                  <th className="px-4 py-2 font-medium">Last run</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-900/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/platform/agents/${a.id}`} className="font-medium text-blue-400 hover:text-blue-300">
                        {a.name}
                      </Link>
                      {a.gated && <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-500/70">gated</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{a.domain}</td>
                    <td className="px-4 py-2.5 text-gray-500">{a.kind}</td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {a.runsOn}
                      {a.runsOn !== 'controller' && <span className="ml-1 text-[10px] text-amber-500/70">metered</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={a.trigger === 'cron' ? 'text-blue-300' : 'text-gray-500'}>{a.trigger}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {fmtTs(a.lastRunAt)}
                      {a.lastItems != null && a.lastItems > 0 && (
                        <span className="ml-2 text-emerald-400/80">+{a.lastItems}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><CbccPlatformAgentStatusBadge status={a.lastStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Data health by domain */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-200">Data Health by Domain</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {health.map((h) => (
              <div key={h.domain} className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                <p className="text-sm font-medium text-gray-200">{h.domain}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-100">
                  {h.live}
                  <span className="ml-1 text-sm font-normal text-gray-500">live</span>
                </p>
                {h.drafts > 0 && (
                  <p className="text-xs text-amber-400/80">{h.drafts} draft{h.drafts === 1 ? '' : 's'} awaiting review</p>
                )}
                <p className="mt-1 text-xs text-gray-600">{h.note}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
