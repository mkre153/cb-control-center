import Link from 'next/link'
import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { CbccPlatformApproveButton } from '@/components/cb-control-center/v2/CbccPlatformApproveButton'
import {
  listChannels,
  listJobs,
  listRecipeDrafts,
  getLiveRecipeCount,
  type PlatformJob,
} from '@/lib/cb-control-center/prcPlatform'

export const dynamic = 'force-dynamic'

function fmtTs(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

const JOB_STATUS_STYLE: Record<string, string> = {
  queued: 'bg-amber-900/40 text-amber-300 border-amber-700',
  running: 'bg-blue-900/40 text-blue-300 border-blue-700',
  done: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  failed: 'bg-red-900/40 text-red-300 border-red-700',
}

function JobStatusBadge({ status }: { status: string }) {
  const style = JOB_STATUS_STYLE[status] ?? 'bg-gray-800 text-gray-300 border-gray-700'
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-200">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export default async function PlatformOverviewPage() {
  const [channels, jobs, drafts, liveCount] = await Promise.all([
    listChannels(),
    listJobs(25),
    listRecipeDrafts(),
    getLiveRecipeCount(),
  ])

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      <CbccNav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-gray-100">Channel Intelligence Platform</h1>
          <p className="mt-1 text-sm text-gray-500">
            Durable channel studies → job queue → recipe drafts, over the PremiumRoast database.
            Studies classify videos once; the worker drafts recipes; you approve them live.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Channels */}
          <Section title="Channels" subtitle={`${channels.length} registered`}>
            {channels.length === 0 ? (
              <p className="text-sm text-gray-500">No channels yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-gray-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Channel</th>
                      <th className="px-4 py-2 font-medium">Topic</th>
                      <th className="px-4 py-2 font-medium text-right">Videos</th>
                      <th className="px-4 py-2 font-medium text-right">Picked</th>
                      <th className="px-4 py-2 font-medium text-right">Studies</th>
                      <th className="px-4 py-2 font-medium">Last studied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {channels.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-900/60">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/platform/channels/${c.id}`}
                            className="font-medium text-blue-400 hover:text-blue-300"
                          >
                            {c.handle}
                          </Link>
                          <span className="ml-2 text-xs text-gray-600">{c.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">{c.topic ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{c.videoCount}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-400">
                          {c.pickedCount}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{c.studyCount}</td>
                        <td className="px-4 py-2.5 text-gray-500">{fmtTs(c.last_studied_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Recipe review queue */}
          <Section
            title="Recipe review queue"
            subtitle={`${drafts.length} draft${drafts.length === 1 ? '' : 's'} awaiting approval · ${liveCount} live`}
          >
            {drafts.length === 0 ? (
              <p className="text-sm text-gray-500">No drafts pending. The queue is clear.</p>
            ) : (
              <ul className="divide-y divide-gray-800 rounded-md border border-gray-800">
                {drafts.map((d) => (
                  <li
                    key={d.slug}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-200">{d.title ?? d.slug}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        <span className="font-mono">{d.slug}</span>
                        {d.drink_category && <> · {d.drink_category}</>}
                        {d.videoCount > 0 && <> · {d.videoCount} source video{d.videoCount === 1 ? '' : 's'}</>}
                      </p>
                    </div>
                    <CbccPlatformApproveButton slug={d.slug} />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-gray-600">
              Drafts have passed the adversarial verify gate. Approving flips{' '}
              <code className="text-gray-500">active=true</code> and publishes live via ISR (no
              deploy). Curate gear ASINs in the recipe row first if needed.
            </p>
          </Section>

          {/* Job queue */}
          <Section title="Job queue" subtitle="Most recent platform jobs (study / generate)">
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-gray-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">#</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Channel</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Created</th>
                      <th className="px-4 py-2 font-medium">Finished</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {jobs.map((j: PlatformJob) => (
                      <tr key={j.id} className="hover:bg-gray-900/60">
                        <td className="px-4 py-2.5 tabular-nums text-gray-500">{j.id}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-300">{j.type}</td>
                        <td className="px-4 py-2.5 text-gray-400">{j.channelHandle ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <JobStatusBadge status={j.status} />
                          {j.error && (
                            <span className="ml-2 text-xs text-red-400/80" title={j.error}>
                              error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{fmtTs(j.created_at)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{fmtTs(j.finished_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </main>
    </div>
  )
}
