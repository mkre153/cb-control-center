import {
  DAP_BUILD_LEDGER,
  getCompletedCount,
  type DapBuildLedgerEntry,
  type DapBuildEvidence,
  type DapBuildStatus,
  type DapBuildVerification,
} from '@/lib/cb-control-center/dapBuildLedger'

// ─── Pills + labels ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DapBuildStatus, string> = {
  complete:    'bg-green-100 text-green-700 border border-green-200',
  in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
  blocked:     'bg-red-100 text-red-700 border border-red-200',
  pending:     'bg-gray-100 text-gray-500 border border-gray-200',
}

const STATUS_LABELS: Record<DapBuildStatus, string> = {
  complete:    'Complete',
  in_progress: 'In Progress',
  blocked:     'Blocked',
  pending:     'Pending',
}

const VERIFICATION_LABELS: Record<DapBuildVerification, string> = {
  verified_in_repo:             'Verified in repo',
  verified_by_test:             'Verified by test',
  verified_by_deployment:       'Verified by deployment',
  recorded_from_operator_report: 'Recorded from operator report',
}

const VERIFICATION_STYLES: Record<DapBuildVerification, string> = {
  verified_in_repo:             'text-green-600',
  verified_by_test:             'text-green-600',
  verified_by_deployment:       'text-blue-600',
  recorded_from_operator_report: 'text-amber-600',
}

// ─── Evidence item ────────────────────────────────────────────────────────────

function EvidenceItem({ item }: { item: DapBuildEvidence }) {
  if (item.type === 'git_tag') {
    return <span className="font-mono text-purple-700">tag: {item.ref}</span>
  }
  if (item.type === 'git_branch') {
    return <span className="font-mono text-blue-700">branch: {item.name}</span>
  }
  if (item.type === 'git_commit') {
    return (
      <span className="font-mono text-gray-600">
        {item.hash.slice(0, 7)} — {item.message}
      </span>
    )
  }
  if (item.type === 'vercel_url') {
    return <span className="font-mono text-indigo-600">{item.url}</span>
  }
  if (item.type === 'file') {
    return <span className="font-mono text-gray-600">{item.path}</span>
  }
  if (item.type === 'test_suite') {
    return (
      <span className="font-mono text-green-700">
        {`${item.name} · ${item.passing} passing`}
      </span>
    )
  }
  return null
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function LedgerEntryCard({ entry }: { entry: DapBuildLedgerEntry }) {
  return (
    <div
      data-ledger-entry={entry.id}
      className={`bg-white border rounded-lg px-5 py-4 space-y-3 ${
        entry.status === 'in_progress'
          ? 'border-blue-200 shadow-sm'
          : 'border-gray-200'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[entry.status]}`}
        >
          {STATUS_LABELS[entry.status]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
          <p className={`text-xs mt-0.5 ${VERIFICATION_STYLES[entry.verification]}`}>
            {VERIFICATION_LABELS[entry.verification]}
            {entry.completedAt && (
              <span className="text-gray-400 ml-2">· {entry.completedAt}</span>
            )}
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 leading-relaxed">{entry.summary}</p>

      {/* Evidence */}
      {entry.evidence.length > 0 && (
        <div className="bg-gray-50 rounded-md px-3 py-2 space-y-1">
          {entry.evidence.map((item, i) => (
            <div key={i} className="text-xs flex gap-1.5 items-start">
              <span className="shrink-0 text-gray-300 mt-0.5">↳</span>
              <EvidenceItem item={item} />
            </div>
          ))}
        </div>
      )}

      {/* Next action */}
      {entry.nextAction && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Next action
          </p>
          <p className="text-sm text-gray-700">{entry.nextAction}</p>
        </div>
      )}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function DapBuildLedgerPanel() {
  const completedCount = getCompletedCount()
  const total = DAP_BUILD_LEDGER.length

  return (
    <div data-dap-build-ledger className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">DAP Build Ledger</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {completedCount} of {total} phases complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-ledger-mode-badge
            className="text-xs font-mono font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5"
          >
            Operator Updated
          </span>
          <span className="text-xs text-gray-400">Not live synced</span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        This ledger is updated manually at the end of each completed phase. It does not
        auto-read from GitHub, Vercel, Supabase, or any external system.
        CB Control Center SimulationShell (above) shows forward-looking pipeline state.
        This ledger shows backward-looking completion evidence.
      </p>

      {/* Entries */}
      <div className="space-y-3">
        {(DAP_BUILD_LEDGER as readonly DapBuildLedgerEntry[]).map(entry => (
          <LedgerEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
