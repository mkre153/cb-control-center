// Admin event timeline preview — internal use only.
// Pure formatter — does not mutate source events.
// MKCRM shadow events are labeled as non-authoritative.
// No PHI. No payment CTAs.

import Link from 'next/link'
import {
  formatDapAdminTimeline,
  DAP_ADMIN_TIMELINE_FIXTURES,
} from '@/lib/cb-control-center/dapAdminEventTimeline'
import type {
  DapAdminTimelineEntry,
  DapAdminTimelineSeverity,
  DapAdminTimelineSource,
} from '@/lib/cb-control-center/dapAdminEventTimeline'

export const dynamic = 'force-dynamic'

function severityClass(severity: DapAdminTimelineSeverity): string {
  switch (severity) {
    case 'success': return 'text-green-700 bg-green-50 border-green-200'
    case 'warning': return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'blocked': return 'text-red-700 bg-red-50 border-red-200'
    case 'info':    return 'text-blue-700 bg-blue-50 border-blue-200'
  }
}

function sourcePillClass(source: DapAdminTimelineSource): string {
  switch (source) {
    case 'dap':                 return 'bg-gray-100 text-gray-600'
    case 'client_builder_pro':  return 'bg-violet-50 text-violet-700'
    case 'mkcrm_shadow':        return 'bg-amber-50 text-amber-700'
  }
}

function TimelineRow({ entry }: { entry: DapAdminTimelineEntry }) {
  return (
    <div
      className="flex gap-4 py-3 border-t border-gray-100 first:border-t-0"
      data-timeline-entry
      data-severity={entry.severity}
      data-source={entry.source}
    >
      <div className="w-36 shrink-0 text-xs text-gray-400 font-mono pt-0.5">
        {new Date(entry.occurredAt).toLocaleString()}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${severityClass(entry.severity)}`}
          >
            {entry.severity}
          </span>
          <span className="text-sm font-mono text-gray-800">{entry.label}</span>
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-mono ${sourcePillClass(entry.source)}`}>
            {entry.source}
          </span>
          <span className="text-xs text-gray-400">actor: {entry.actorType}</span>
        </div>
        <p className="text-xs text-gray-600">{entry.description}</p>
        {entry.source === 'mkcrm_shadow' && (
          <p className="text-xs text-amber-600 italic" data-shadow-notice>
            Shadow event — not authoritative
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdminTimelinePreviewPage() {
  const entries = formatDapAdminTimeline(DAP_ADMIN_TIMELINE_FIXTURES)

  return (
    <main
      className="max-w-3xl mx-auto px-4 py-8 space-y-8"
      data-admin-timeline-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="admin-timeline"
        >
          Admin Event Timeline
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only</p>
      </div>

      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-1"
        data-authority-notice
      >
        <p className="text-xs font-semibold text-blue-800">Source Authority</p>
        <p className="text-xs text-blue-700">
          Events are sorted chronologically. MKCRM shadow events are labeled
          and non-authoritative. Client Builder Pro events are billing-derived.
          No PHI is surfaced. No payment actions are available here.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5" data-timeline>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
          {entries.length} events
        </p>
        {entries.map(entry => (
          <TimelineRow key={entry.id} entry={entry} />
        ))}
      </section>

      <section
        className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-0.5 text-xs font-mono text-gray-600"
        data-safety-flags
      >
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safety</p>
        <div>all entries: displaySafe: <span className="text-green-700 font-semibold">true</span></div>
        <div>all entries: includesPhi: <span className="text-green-700 font-semibold">false</span></div>
      </section>
    </main>
  )
}
