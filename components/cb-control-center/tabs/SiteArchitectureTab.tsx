import { evaluateSiteArchitecture } from '@/lib/cb-control-center/architecture/siteArchitectureEligibility'
import type { EnrichedBlocker, TruthSection } from '@/lib/cb-control-center/types'
import type { EvaluatedPage, ArchitectureRisk, NextBuildSlice } from '@/lib/cb-control-center/architecture/siteArchitectureTypes'

interface SiteArchitectureTabProps {
  schema: TruthSection[]
  blockers: EnrichedBlocker[]
}

const STATUS_CONFIG = {
  recommended:   { label: 'Recommended',   badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  conditional:   { label: 'Conditional',   badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  blocked:       { label: 'Blocked',       badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500'   },
  internal_only: { label: 'Internal Only', badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'  },
}

const SEVERITY_CONFIG = {
  high:   { label: 'High',   className: 'bg-red-100 text-red-700'    },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-600'  },
}

function GateRow({ label, active, activeLabel, inactiveLabel }: { label: string; active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        active ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
      }`}>
        {active ? activeLabel : inactiveLabel}
      </span>
    </div>
  )
}

function PageCard({ page }: { page: EvaluatedPage }) {
  const cfg = STATUS_CONFIG[page.status]
  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{page.spec.label}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <code className="text-xs font-mono text-gray-400 mt-0.5 block">{page.spec.routePattern}</code>
        </div>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 shrink-0`}>
          {page.spec.audience}
        </span>
      </div>
      <p className="text-xs text-gray-500">{page.reason}</p>
      {page.activeRestrictions.length > 0 && (
        <ul className="space-y-1 mt-1">
          {page.activeRestrictions.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
              <span className="shrink-0 mt-0.5">⚠</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RiskCard({ risk }: { risk: ArchitectureRisk }) {
  const cfg = SEVERITY_CONFIG[risk.severity]
  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.className}`}>
          {cfg.label}
        </span>
        <span className="text-xs font-mono text-gray-400">{risk.id}</span>
      </div>
      <p className="text-xs font-medium text-gray-700">{risk.description}</p>
      <div className="grid grid-cols-1 gap-1 text-xs">
        <div><span className="text-gray-400 font-medium">Condition: </span><span className="text-gray-600">{risk.condition}</span></div>
        <div><span className="text-gray-400 font-medium">Resolution: </span><span className="text-gray-600">{risk.resolution}</span></div>
      </div>
    </div>
  )
}

function NextSliceCard({ slice }: { slice: NextBuildSlice }) {
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Next Build Slice</span>
        <span className="text-sm font-bold text-blue-900">{slice.label}</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <p className="text-xs text-gray-600">{slice.rationale}</p>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Pages in This Slice</p>
          <div className="flex flex-wrap gap-1.5">
            {slice.pages.map(p => (
              <code key={p} className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                {p}
              </code>
            ))}
          </div>
        </div>
        {slice.blockersToClear.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Blockers to Clear First</p>
            <ul className="space-y-1">
              {slice.blockersToClear.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                  <span className="shrink-0">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export function SiteArchitectureTab({ schema, blockers }: SiteArchitectureTabProps) {
  const output = evaluateSiteArchitecture(schema, blockers)
  const { recommendedPages, conditionalPages, blockedPages, internalOnlyRecords, risks, nextBuildSlice } = output

  const openBlockers = blockers.filter(b => b.resolutionStatus === 'open')
  const confirmedProviderExists  = !openBlockers.some(b => b.id === 'eb-001')
  const offerTermsValidated      = !openBlockers.some(b => b.id === 'eb-002')
  const ctaGateUnlocked          = !openBlockers.some(b => b.id === 'eb-004')
  const requestFlowConfirmed     = !openBlockers.some(b => b.id === 'eb-003')
  const declinedRoutingConfirmed = !openBlockers.some(b => b.id === 'eb-005')

  return (
    <div className="space-y-6">

      {/* Planning output banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Planning Output — Not a Site Builder</p>
        <p className="text-xs text-gray-500 mt-0.5">
          This tab evaluates which pages are safe to build given the current gate state. It produces a recommended architecture plan — it does not generate routes, CMS content, or production code.
        </p>
      </div>

      {/* Gate summary */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Architecture Gate State</p>
          <p className="text-xs text-gray-400 mt-0.5">Derived from open blockers in current simulation state</p>
        </div>
        <div className="px-4 py-1 divide-y divide-gray-50">
          <GateRow label="eb-001 — Confirmed provider on record" active={confirmedProviderExists}  activeLabel="Satisfied" inactiveLabel="Open" />
          <GateRow label="eb-002 — Offer terms validated"         active={offerTermsValidated}      activeLabel="Satisfied" inactiveLabel="Open" />
          <GateRow label="eb-003 — Request flow routing confirmed" active={requestFlowConfirmed}    activeLabel="Satisfied" inactiveLabel="Open" />
          <GateRow label="eb-004 — Join CTA gate unlocked"         active={ctaGateUnlocked}         activeLabel="Satisfied" inactiveLabel="Open" />
          <GateRow label="eb-005 — Declined routing confirmed"     active={declinedRoutingConfirmed} activeLabel="Satisfied" inactiveLabel="Open" />
        </div>
      </div>

      {/* Architecture summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Recommended', count: recommendedPages.length,    color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'Conditional', count: conditionalPages.length,    color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Blocked',     count: blockedPages.length,        color: 'text-red-700',   bg: 'bg-red-50 border-red-200'     },
          { label: 'Internal',    count: internalOnlyRecords.length, color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200'   },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-lg border px-3 py-3 text-center ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className={`text-xs font-medium mt-0.5 ${color}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Next build slice */}
      <NextSliceCard slice={nextBuildSlice} />

      {/* Recommended pages */}
      {recommendedPages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recommended Pages ({recommendedPages.length})</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendedPages.map(p => <PageCard key={p.spec.id} page={p} />)}
          </div>
        </div>
      )}

      {/* Conditional pages */}
      {conditionalPages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Conditional Pages ({conditionalPages.length})</p>
            <span className="text-xs text-gray-400">— buildable with active restrictions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conditionalPages.map(p => <PageCard key={p.spec.id} page={p} />)}
          </div>
        </div>
      )}

      {/* Blocked pages */}
      {blockedPages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Blocked Pages ({blockedPages.length})</p>
            <span className="text-xs text-gray-400">— cannot build safely in current state</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blockedPages.map(p => <PageCard key={p.spec.id} page={p} />)}
          </div>
        </div>
      )}

      {/* Internal-only records */}
      {internalOnlyRecords.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Internal-Only Records ({internalOnlyRecords.length})</p>
            <span className="text-xs text-gray-400">— never patient-facing</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {internalOnlyRecords.map(p => <PageCard key={p.spec.id} page={p} />)}
          </div>
        </div>
      )}

      {/* Active risks */}
      {risks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Active Architecture Risks ({risks.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {risks.map(r => <RiskCard key={r.id} risk={r} />)}
          </div>
        </div>
      )}

    </div>
  )
}
