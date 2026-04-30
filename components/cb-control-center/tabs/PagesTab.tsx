'use client'

import { useMemo } from 'react'
import { DAP_PAGE_TYPE_SPECS } from '@/lib/cb-control-center/mockData'
import type { PagePlanItem, EnrichedBlocker, DapPageTypeSpec } from '@/lib/cb-control-center/types'

interface PagesTabProps {
  pages: PagePlanItem[]
  blockers: EnrichedBlocker[]
}

type Eligibility = 'eligible' | 'conditional' | 'blocked'

function getTypeEligibility(spec: DapPageTypeSpec, openBlockerIds: Set<string>): Eligibility {
  if (!spec.gateBlocker) return 'eligible'
  if (openBlockerIds.has(spec.gateBlocker)) {
    return spec.conditionalWithoutGate ? 'conditional' : 'blocked'
  }
  return 'eligible'
}

const ELIGIBILITY_CONFIG: Record<Eligibility, { label: string; badge: string }> = {
  eligible:    { label: 'Eligible',    badge: 'bg-green-100 text-green-700' },
  conditional: { label: 'Conditional', badge: 'bg-amber-100 text-amber-700' },
  blocked:     { label: 'Blocked',     badge: 'bg-red-100 text-red-700'     },
}

const TYPE_COLORS = {
  green: { header: 'bg-green-50', border: 'border-green-200', tag: 'bg-green-50 text-green-700 border-green-200' },
  amber: { header: 'bg-amber-50', border: 'border-amber-200', tag: 'bg-amber-50 text-amber-700 border-amber-200' },
  blue:  { header: 'bg-blue-50',  border: 'border-blue-200',  tag: 'bg-blue-50 text-blue-700 border-blue-200'   },
  gray:  { header: 'bg-gray-50',  border: 'border-gray-200',  tag: 'bg-gray-50 text-gray-600 border-gray-200'   },
}

const STATUS_BADGE: Record<string, string> = {
  'Eligible':    'bg-green-100 text-green-700',
  'Conditional': 'bg-amber-100 text-amber-700',
  'Not Ready':   'bg-gray-100 text-gray-500',
}

export function PagesTab({ pages, blockers }: PagesTabProps) {
  const openBlockerIds = useMemo(
    () => new Set(blockers.filter(b => b.resolutionStatus === 'open').map(b => b.id)),
    [blockers]
  )

  return (
    <div className="space-y-6">

      {/* 4 page type summary cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Page Type Eligibility — Gate State</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DAP_PAGE_TYPE_SPECS.map(spec => {
            const eligibility = getTypeEligibility(spec, openBlockerIds)
            const eCfg = ELIGIBILITY_CONFIG[eligibility]
            const colors = TYPE_COLORS[spec.color]
            const typePages = pages.filter(p => p.pageType === spec.id)
            const gateNote = spec.gateBlocker
              ? spec.conditionalWithoutGate
                ? `Conditional without ${spec.gateBlocker}`
                : `Blocked until ${spec.gateBlocker} resolved`
              : 'No gate — eligible immediately'

            return (
              <div key={spec.id} className={`border rounded-lg overflow-hidden ${colors.border}`}>
                <div className={`px-4 py-2.5 border-b ${colors.border} ${colors.header} flex items-center justify-between gap-2`}>
                  <span className="text-sm font-semibold text-gray-800">{spec.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${eCfg.badge}`}>
                    {eCfg.label}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <p className="text-xs text-gray-400">{gateNote}</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Allowed</p>
                      <ul className="space-y-0.5">
                        {spec.allowedClaims.map((claim, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="text-green-500 shrink-0 mt-0.5">✓</span>{claim}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Forbidden</p>
                      <ul className="space-y-0.5">
                        {spec.forbiddenClaims.map((claim, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="text-red-500 shrink-0 mt-0.5">✕</span>{claim}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{typePages.length} page{typePages.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-500 font-medium truncate ml-2">{spec.primaryCta}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Page inventory */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Page Inventory ({pages.length})</p>
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Page</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-36">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-28">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map((p, i) => {
                const spec = DAP_PAGE_TYPE_SPECS.find(s => s.id === p.pageType)
                const colors = spec ? TYPE_COLORS[spec.color] : TYPE_COLORS.gray
                const statusBadge = STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-500'
                return (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.title}</td>
                    <td className="px-4 py-3">
                      {spec && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors.tag}`}>
                          {spec.shortName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadge}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{p.reason}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
