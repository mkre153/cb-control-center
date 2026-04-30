'use client'

import { useState } from 'react'
import type { EnrichedBlocker, BlockerSeverity } from '@/lib/cb-control-center/types'

const severityConfig: Record<BlockerSeverity, { label: string; badge: string }> = {
  high:   { label: 'High',   badge: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    badge: 'bg-gray-100 text-gray-500' },
}

interface BlockerTaskListProps {
  blockers: EnrichedBlocker[]
  onResolveBlocker?: (id: string, type: 'confirm' | 'defer') => void
}

export function BlockerTaskList({ blockers, onResolveBlocker }: BlockerTaskListProps) {
  const openBlockers = blockers.filter(b => b.resolutionStatus === 'open')
  const resolvedBlockers = blockers.filter(b => b.resolutionStatus === 'resolved')

  const [selectedId, setSelectedId] = useState<string | null>(
    openBlockers[0]?.id ?? null
  )

  const selectedBlocker = openBlockers.find(b => b.id === selectedId) ?? null

  function handleSelect(id: string) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  function handleResolve(id: string, type: 'confirm' | 'defer') {
    onResolveBlocker?.(id, type)
    const remaining = openBlockers.filter(b => b.id !== id)
    setSelectedId(remaining[0]?.id ?? null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Required Actions</p>
        {openBlockers.length === 0 ? (
          <span className="text-xs font-semibold text-green-600">All resolved ✓</span>
        ) : (
          <span className="text-xs font-medium text-red-600">{openBlockers.length} open</span>
        )}
      </div>

      {blockers.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-sm text-green-700">No blockers for this stage.</p>
        </div>
      )}

      {/* Compact queue — open blockers */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
        {openBlockers.map((b) => {
          const cfg = severityConfig[b.severity]
          const isSelected = selectedId === b.id
          return (
            <button
              key={b.id}
              onClick={() => handleSelect(b.id)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                isSelected ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <span className={`shrink-0 mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
                {cfg.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{b.title}</p>
                {!isSelected && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-1">{b.description}</p>
                )}
              </div>
              <span className={`shrink-0 text-gray-400 text-xs mt-1 transition-transform ${isSelected ? 'rotate-90' : ''}`}>▶</span>
            </button>
          )
        })}
      </div>

      {/* Detail panel for selected blocker */}
      {selectedBlocker && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Next Evidence Needed — {selectedBlocker.title}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{selectedBlocker.description}</p>
          </div>

          {selectedBlocker.requiredEvidence.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Required</p>
              <ul className="space-y-1">
                {selectedBlocker.requiredEvidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="mt-0.5 w-3 h-3 shrink-0 border border-gray-300 rounded inline-block" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedBlocker.gateCondition && (
            <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-2">
              {selectedBlocker.gateCondition}
            </p>
          )}

          {selectedBlocker.downstreamUnlockImpact.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Unlocks</p>
              <div className="flex flex-wrap gap-1">
                {selectedBlocker.downstreamUnlockImpact.map((impact, i) => (
                  <span key={i} className="text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                    → {impact}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-200">
            <button
              disabled={!onResolveBlocker}
              onClick={() => handleResolve(selectedBlocker.id, 'confirm')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                onResolveBlocker
                  ? 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer'
                  : 'border-green-200 text-green-600 opacity-50 cursor-not-allowed'
              }`}
            >
              Resolve with Evidence
            </button>
            <button
              disabled={!onResolveBlocker}
              onClick={() => handleResolve(selectedBlocker.id, 'defer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                onResolveBlocker
                  ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer'
                  : 'border-amber-200 text-amber-600 opacity-50 cursor-not-allowed'
              }`}
            >
              Defer with Reason
            </button>
            <button
              onClick={() => setSelectedId(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Keep Blocked
            </button>
          </div>

          {!onResolveBlocker && (
            <p className="text-xs text-gray-400">Actions disabled in this simulation state.</p>
          )}
        </div>
      )}

      {/* Resolved blockers — compact, at bottom */}
      {resolvedBlockers.length > 0 && (
        <div className="space-y-1">
          {resolvedBlockers.map((b) => (
            <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded opacity-50">
              <span className="w-4 h-4 shrink-0 border-2 border-green-400 bg-green-50 rounded flex items-center justify-center text-green-600">
                <span className="text-[9px] font-bold">✓</span>
              </span>
              <p className="text-xs text-gray-400 line-through">{b.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
