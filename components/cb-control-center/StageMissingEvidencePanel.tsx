// Missing-required-evidence panel.
//
// Server-only render of a static list — the data is computed by the page
// (via the engine's canApproveStageWithEvidence) and passed in as a prop.
// This component never recomputes, never mutates, never marks evidence
// valid. It just makes the existing derived state visible.
//
// Stable test anchors:
//   data-missing-evidence-panel
//   data-missing-evidence-item
//   data-missing-evidence-id   = required evidence id

import type { CbccEvidenceRequirement } from '@/lib/cbcc/types'

export interface StageMissingEvidencePanelProps {
  items: ReadonlyArray<CbccEvidenceRequirement>
}

export function StageMissingEvidencePanel({ items }: StageMissingEvidencePanelProps) {
  if (items.length === 0) return null

  return (
    <section
      data-missing-evidence-panel
      className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4"
    >
      <h2 className="text-sm font-semibold text-amber-900">Missing Required Evidence</h2>
      <p className="mt-1 text-xs leading-relaxed text-amber-800">
        Owner approval is unavailable until each required evidence item below is present and
        marked valid. The list is derived from the stage&apos;s evidence contract — adding
        evidence here is a separate step, not an approval.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map(item => (
          <li
            key={item.id}
            data-missing-evidence-item
            data-missing-evidence-id={item.id}
            className="rounded-md border border-amber-200 bg-white px-3 py-2"
          >
            <p className="text-xs font-mono text-amber-900">{item.id}</p>
            <p className="mt-0.5 text-sm text-gray-800">{item.title}</p>
            {item.description && (
              <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
