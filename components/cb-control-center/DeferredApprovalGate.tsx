import { StageSection } from './StageSection'

// Generic v2 projects don't yet have a per-stage approval action wired up.
// The gate is still rendered so the contract — "approval is required before
// the next stage unlocks" — stays visible. Copy must NOT imply a stage can
// be approved today.
export function DeferredApprovalGate() {
  return (
    <StageSection title="Approval Gate">
      <div data-approval-gate-deferred className="text-sm text-gray-700 leading-relaxed">
        <strong className="text-gray-900">Approval gate</strong> — Required before the next stage unlocks.
        {' '}Approval action will be wired in a later v2 pass.
      </div>
    </StageSection>
  )
}
