import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { getChannelDossier, isSupplyCategory } from '@/lib/cb-control-center/prcPlatform'

export const dynamic = 'force-dynamic'

function fmtTs(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export default async function ChannelDossierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const channelId = Number(id)
  if (!Number.isInteger(channelId)) notFound()

  const dossier = await getChannelDossier(channelId)
  if (!dossier) notFound()

  const { channel, studies, categoryBreakdown, pickedSample, jobs, videoCount, pickedCount } =
    dossier
  const maxCat = Math.max(1, ...categoryBreakdown.map((c) => c.count))

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      <CbccNav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/platform" className="text-xs text-blue-400 hover:text-blue-300">
          ← Platform
        </Link>

        <header className="mt-3 mb-8">
          <h1 className="text-xl font-semibold text-gray-100">{channel.handle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {channel.name ? `${channel.name} · ` : ''}
            {channel.topic ?? 'coffee'} · {channel.status} · last studied{' '}
            {fmtTs(channel.last_studied_at)}
          </p>
          <div className="mt-3 flex gap-6 text-sm">
            <span>
              <span className="text-lg font-semibold text-gray-100 tabular-nums">{videoCount}</span>{' '}
              <span className="text-gray-500">videos</span>
            </span>
            <span>
              <span className="text-lg font-semibold text-emerald-400 tabular-nums">
                {pickedCount}
              </span>{' '}
              <span className="text-gray-500">picked (coffee supply)</span>
            </span>
            <span>
              <span className="text-lg font-semibold text-gray-100 tabular-nums">
                {studies.length}
              </span>{' '}
              <span className="text-gray-500">study runs</span>
            </span>
          </div>
        </header>

        <div className="grid gap-6">
          {/* Category breakdown */}
          <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-200">
              Category breakdown
            </h2>
            <p className="mb-4 text-xs text-gray-600">
              Live from <code className="text-gray-500">channel_videos</code>. Highlighted rows feed
              the recipe generator.
            </p>
            <div className="space-y-2">
              {categoryBreakdown.map((c) => {
                const supply = isSupplyCategory(c.category)
                return (
                  <div key={c.category} className="flex items-center gap-3 text-sm">
                    <div className="w-24 shrink-0 text-right">
                      <span className={supply ? 'text-emerald-300' : 'text-gray-400'}>
                        {c.category}
                      </span>
                    </div>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-gray-800">
                      <div
                        className={`h-full ${supply ? 'bg-emerald-600' : 'bg-gray-600'}`}
                        style={{ width: `${(c.count / maxCat) * 100}%` }}
                      />
                    </div>
                    <div className="w-28 shrink-0 text-right tabular-nums text-gray-400">
                      {c.count}
                      {supply && c.picked > 0 && (
                        <span className="text-emerald-400"> · {c.picked} picked</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Study runs */}
          <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-200">
              Study runs
            </h2>
            <div className="overflow-hidden rounded-md border border-gray-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Studied</th>
                    <th className="px-4 py-2 font-medium text-right">Videos</th>
                    <th className="px-4 py-2 font-medium text-right">New</th>
                    <th className="px-4 py-2 font-medium">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {studies.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-900/60">
                      <td className="px-4 py-2.5 tabular-nums text-gray-500">{s.id}</td>
                      <td className="px-4 py-2.5 text-gray-400">{fmtTs(s.studied_at)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.video_count ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-400">
                        {s.newly_classified ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{s.model ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Picked sample */}
          <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-200">
              Picked videos
            </h2>
            <p className="mb-4 text-xs text-gray-600">
              Sample of up to 30 coffee-supply videos eligible for recipe generation.
            </p>
            {pickedSample.length === 0 ? (
              <p className="text-sm text-gray-500">No picked videos.</p>
            ) : (
              <ul className="divide-y divide-gray-800 rounded-md border border-gray-800">
                {pickedSample.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-16 shrink-0 text-xs text-emerald-400">{v.category}</span>
                    <a
                      href={`https://www.youtube.com/watch?v=${v.video_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-gray-300 hover:text-blue-300"
                      title={v.title ?? v.video_id}
                    >
                      {v.title ?? v.video_id}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Jobs for this channel */}
          <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-200">
              Jobs
            </h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs for this channel.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {jobs.map((j) => (
                  <li key={j.id} className="flex items-center gap-3">
                    <span className="tabular-nums text-gray-600">#{j.id}</span>
                    <span className="font-mono text-gray-300">{j.type}</span>
                    <span className="text-gray-500">{j.status}</span>
                    <span className="text-xs text-gray-600">{fmtTs(j.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
