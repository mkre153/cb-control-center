// CBCC generic engine — agent runtime (Part 5)
//
// Deterministic executor for registered agents. Given an input and a runtime
// context, produces a structured CbccAgentRunOutput. The runtime is the
// **only** place agent behaviour is gated — and it gates strictly:
//
//   - locked stages → status: 'blocked' (no proposed artifact, no evidence)
//   - approved stages + work-producing agent → 'no_change' (idempotent)
//   - allowedStages mismatch → status: 'failed'
//   - unknown agent id → throw CbccAgentNotFoundError
//
// No agent return shape can express "approved" or "unlocked". Approval and
// unlocking are owner concerns; the runtime carries no authority over them.

import type {
  CbccAgentDefinition,
  CbccAgentRunInput,
  CbccAgentRunOutput,
  CbccAgentRuntimeContext,
} from './types'
import { CBCC_DEFAULT_AGENT_REGISTRY, getCbccAgent } from './agentRegistry'

// ─── Errors ───────────────────────────────────────────────────────────────────

export class CbccAgentNotFoundError extends Error {
  readonly agentId: string
  constructor(agentId: string) {
    super(`agent "${agentId}" is not registered`)
    this.name = 'CbccAgentNotFoundError'
    this.agentId = agentId
  }
}

// ─── Executor ─────────────────────────────────────────────────────────────────

export interface RunCbccAgentOptions {
  // Inject a custom registry for tests / staged rollouts. Defaults to the
  // engine's default registry.
  registry?: ReadonlyArray<CbccAgentDefinition>
  // Inject a clock for deterministic completedAt in tests.
  now?: () => string
}

export function runCbccAgent(
  input: CbccAgentRunInput,
  context: CbccAgentRuntimeContext,
  options: RunCbccAgentOptions = {},
): CbccAgentRunOutput {
  const registry = options.registry ?? CBCC_DEFAULT_AGENT_REGISTRY
  const now = options.now ?? (() => new Date().toISOString())

  const agent = getCbccAgent(registry, input.agentId)
  if (!agent) throw new CbccAgentNotFoundError(input.agentId)

  // 1. allowedStages whitelist (if defined).
  if (agent.allowedStages && !agent.allowedStages.includes(input.stageNumber)) {
    return {
      status: 'failed',
      decision: 'no_change',
      summary: `Agent "${agent.id}" is not allowed to run on stage ${input.stageNumber}.`,
      error: `agent.allowedStages=[${agent.allowedStages.join(',')}] does not include ${input.stageNumber}`,
      completedAt: now(),
    }
  }

  // 2. Locked stages block all agents — even reviewers — from doing work.
  // The runtime returns a structured 'blocked' result so callers can still
  // render the lock reason without having computed it.
  if (context.stageLocked) {
    return {
      status: 'blocked',
      decision: 'blocked',
      summary: `Stage ${input.stageNumber} is locked and cannot be worked until prerequisites are approved.`,
      blockers: context.lockReason ? [context.lockReason] : ['stage is locked'],
      completedAt: now(),
    }
  }

  // 3. Approved stages: stage_worker / adapter_worker idempotently no-op.
  // Reviewers and evidence_collectors may still inspect after approval (e.g.
  // a post-hoc audit), so they fall through to the kind dispatcher.
  if (
    context.stageApproved &&
    (agent.kind === 'stage_worker' || agent.kind === 'adapter_worker')
  ) {
    return {
      status: 'completed',
      decision: 'no_change',
      summary: `Stage ${input.stageNumber} is already approved; no work needed from ${agent.name}.`,
      completedAt: now(),
    }
  }

  // 4. Dispatch by capability flags. The runtime decides decision shape from
  // producesArtifact / producesEvidence — `kind` mostly governs whether an
  // agent runs on approved stages (handled above).
  return dispatch(agent, input, context, now())
}

// ─── Capability dispatch ──────────────────────────────────────────────────────

function dispatch(
  agent: CbccAgentDefinition,
  input: CbccAgentRunInput,
  context: CbccAgentRuntimeContext,
  completedAt: string,
): CbccAgentRunOutput {
  const stageLabel = context.stageTitle
    ? `stage ${input.stageNumber} (${context.stageTitle})`
    : `stage ${input.stageNumber}`

  // Artifact-producing agents always require owner review. The proposed
  // artifact is a placeholder — Part 5 is the deterministic contract layer.
  if (agent.producesArtifact) {
    return {
      status: 'completed',
      decision: 'owner_review_required',
      summary: `${agent.name} produced a draft artifact for ${stageLabel}. Owner review required before approval.`,
      proposedArtifact: {
        agentId: agent.id,
        stageNumber: input.stageNumber,
        kind: 'placeholder_draft',
        prompt: input.prompt,
      },
      proposedEvidence: agent.producesEvidence
        ? [
            {
              type: 'note',
              title: `${agent.name} draft evidence`,
              description: `Agent ${agent.id} proposed a draft artifact awaiting owner review.`,
            },
          ]
        : undefined,
      recommendation: 'Owner should review the proposed artifact before approving the stage.',
      completedAt,
    }
  }

  // Evidence-only agents propose evidence; never an artifact.
  if (agent.producesEvidence) {
    return {
      status: 'completed',
      decision: 'evidence_proposed',
      summary: `${agent.name} proposed evidence entries for ${stageLabel}.`,
      proposedEvidence: [
        {
          type: 'note',
          title: `${agent.name} suggestion`,
          description: 'Evidence placeholder — owner review required before append to ledger.',
        },
      ],
      recommendation: 'Owner should review proposed evidence before appending to the ledger.',
      completedAt,
    }
  }

  // Reviewer / context reader: read-only summary, no proposals.
  return {
    status: 'completed',
    decision: 'no_change',
    summary: `${agent.name} summarized ${stageLabel}.`,
    recommendation: agent.kind === 'reviewer'
      ? 'Owner should consider this review when deciding whether to approve.'
      : undefined,
    completedAt,
  }
}
