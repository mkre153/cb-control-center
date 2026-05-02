// Next-allowed-action card.
//
// Read-only surface for the engine's `getNextAllowedAction` decision. The card
// never mutates state, never calls AI, and never advances a stage. It exists
// so the operator can see, on the project page, what the engine has decided
// is the next legal move and (when blocked) why.
//
// Stable test anchors:
//   data-next-allowed-action-card
//   data-next-allowed-action      = action kind
//   data-next-allowed-stage       = stage number (when applicable)
//   data-next-allowed-reason      = blocker reason text (when blocked)
//   data-next-allowed-missing-evidence = required evidence id (when missing)

import type { CbccNextAllowedAction } from '@/lib/cbcc/nextAllowedAction'

export interface NextAllowedActionCardProps {
  action: CbccNextAllowedAction
  // Optional title lookup so the card can show "Stage 4 — Positioning" rather
  // than just "Stage 4". Adapter-supplied; the card is otherwise vertical-neutral.
  stageTitleByNumber?: Readonly<Record<number, string>>
}

interface ActionRender {
  headline: string
  body?: string
}

function renderAction(
  action: CbccNextAllowedAction,
  titles: Readonly<Record<number, string>>,
): ActionRender {
  switch (action.kind) {
    case 'approve_stage': {
      const title = titles[action.stageNumber]
      return {
        headline: `Review Stage ${action.stageNumber} for owner approval`,
        body: title
          ? `${title} is awaiting owner approval. Approval is the next allowed action.`
          : `Stage ${action.stageNumber} is awaiting owner approval.`,
      }
    }
    case 'submit_for_owner_approval': {
      const title = titles[action.stageNumber]
      return {
        headline: `Submit Stage ${action.stageNumber} for owner approval`,
        body: title
          ? `Required evidence for ${title} is satisfied. Move the stage into owner review.`
          : `Required evidence is satisfied. Move Stage ${action.stageNumber} into owner review.`,
      }
    }
    case 'generate_required_artifact': {
      const title = titles[action.stageNumber]
      return {
        headline: `Stage ${action.stageNumber} cannot be approved yet`,
        body: title
          ? `${title} is missing required evidence: ${action.label}.`
          : `Missing required evidence: ${action.label}.`,
      }
    }
    case 'work_blocked': {
      const title = titles[action.stageNumber]
      return {
        headline: `Stage ${action.stageNumber} is blocked`,
        body: title
          ? `${title} is locked. ${action.reason}`
          : action.reason,
      }
    }
    case 'project_complete':
      return {
        headline: 'All stages approved',
        body: 'There is no next allowed action — every stage in this project is owner-approved.',
      }
  }
}

export function NextAllowedActionCard({
  action,
  stageTitleByNumber = {},
}: NextAllowedActionCardProps) {
  const { headline, body } = renderAction(action, stageTitleByNumber)
  const stageNumber = 'stageNumber' in action ? action.stageNumber : undefined
  const reason = action.kind === 'work_blocked' ? action.reason : undefined
  const missingEvidence =
    action.kind === 'generate_required_artifact' ? action.requiredEvidenceId : undefined

  // Action-kind drives the accent so blocked / missing-evidence states stand
  // out vs. routine "submit for approval" prompts. Tailwind classes only —
  // no JS branching beyond the lookup table.
  const accent: string = (() => {
    switch (action.kind) {
      case 'work_blocked':
        return 'border-red-700/40 bg-red-900/20 text-red-300'
      case 'generate_required_artifact':
        return 'border-amber-700/40 bg-amber-900/20 text-amber-200'
      case 'approve_stage':
        return 'border-amber-600/40 bg-amber-900/30 text-amber-200'
      case 'submit_for_owner_approval':
        return 'border-blue-700/40 bg-blue-900/20 text-blue-200'
      case 'project_complete':
        return 'border-green-700/40 bg-green-900/20 text-green-300'
    }
  })()

  return (
    <section
      data-next-allowed-action-card
      data-next-allowed-action={action.kind}
      {...(stageNumber !== undefined ? { 'data-next-allowed-stage': String(stageNumber) } : {})}
      {...(reason !== undefined ? { 'data-next-allowed-reason': reason } : {})}
      {...(missingEvidence !== undefined
        ? { 'data-next-allowed-missing-evidence': missingEvidence }
        : {})}
      className={`rounded-lg border px-4 py-3 ${accent}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
        Next Allowed Action
      </p>
      <p className="mt-1 text-sm font-semibold">{headline}</p>
      {body && <p className="mt-1 text-xs leading-relaxed opacity-90">{body}</p>}
    </section>
  )
}
