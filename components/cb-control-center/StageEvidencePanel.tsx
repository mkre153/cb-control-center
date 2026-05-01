import type { DapStageEvidence } from '@/lib/cb-control-center/dapStageGates'

export function StageEvidencePanel({ evidence }: { evidence: DapStageEvidence }) {
  const hasAny =
    evidence.branch ||
    evidence.commit ||
    evidence.tests ||
    evidence.previewUrl ||
    (evidence.filesChanged && evidence.filesChanged.length > 0)

  if (!hasAny) {
    return (
      <div data-stage-evidence-panel className="text-xs text-gray-400 italic">
        No evidence submitted yet.
      </div>
    )
  }

  return (
    <div data-stage-evidence-panel className="space-y-2">
      {evidence.branch && (
        <div className="flex gap-3 text-sm">
          <span className="w-16 shrink-0 text-gray-400 text-xs pt-0.5">Branch</span>
          <span className="font-mono text-gray-800">{evidence.branch}</span>
        </div>
      )}
      {evidence.commit && (
        <div className="flex gap-3 text-sm">
          <span className="w-16 shrink-0 text-gray-400 text-xs pt-0.5">Commit</span>
          <span className="font-mono text-gray-800">{evidence.commit}</span>
        </div>
      )}
      {evidence.tests && (
        <div className="flex gap-3 text-sm">
          <span className="w-16 shrink-0 text-gray-400 text-xs pt-0.5">Tests</span>
          <span className="font-mono text-green-700">{evidence.tests}</span>
        </div>
      )}
      {evidence.previewUrl && (
        <div className="flex gap-3 text-sm">
          <span className="w-16 shrink-0 text-gray-400 text-xs pt-0.5">Preview</span>
          <span className="font-mono text-indigo-600">{evidence.previewUrl}</span>
        </div>
      )}
      {evidence.filesChanged && evidence.filesChanged.length > 0 && (
        <div className="flex gap-3 text-sm items-start">
          <span className="w-16 shrink-0 text-gray-400 text-xs pt-0.5">Files</span>
          <ul className="space-y-0.5">
            {evidence.filesChanged.map(f => (
              <li key={f} className="font-mono text-xs text-gray-600">{f}</li>
            ))}
          </ul>
        </div>
      )}
      {evidence.unresolvedIssues && evidence.unresolvedIssues.length > 0 && (
        <div className="mt-2 flex gap-3 items-start">
          <span className="w-16 shrink-0 text-red-400 text-xs pt-0.5">Unresolved</span>
          <ul className="space-y-0.5">
            {evidence.unresolvedIssues.map(i => (
              <li key={i} className="text-xs text-red-600">{i}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
