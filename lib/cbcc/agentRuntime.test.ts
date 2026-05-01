import { describe, it, expect } from 'vitest'
import {
  runCbccAgent,
  CbccAgentNotFoundError,
} from './agentRuntime'
import { CBCC_DEFAULT_AGENT_REGISTRY } from './agentRegistry'
import type {
  CbccAgentDefinition,
  CbccAgentRunInput,
  CbccAgentRuntimeContext,
} from './types'

const NOW = '2026-05-01T00:00:00Z'
const NOW_FN = () => NOW

const PROJECT_ID = 'project-1'
const PROJECT_SLUG = 'p-1'

function makeInput(over: Partial<CbccAgentRunInput> = {}): CbccAgentRunInput {
  return {
    projectId: PROJECT_ID,
    projectSlug: PROJECT_SLUG,
    stageNumber: 3,
    agentId: 'stage-context-reader',
    requestedBy: 'owner@example.com',
    ...over,
  }
}

function makeContext(over: Partial<CbccAgentRuntimeContext> = {}): CbccAgentRuntimeContext {
  return {
    stageLocked: false,
    stageApproved: false,
    stageTitle: 'Some stage',
    ...over,
  }
}

// ─── Lock guard ──────────────────────────────────────────────────────────────

describe('runCbccAgent — locked stages', () => {
  it('returns status=blocked, decision=blocked when stage is locked', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-artifact-draft-agent' }),
      makeContext({ stageLocked: true, lockReason: 'predecessor not approved' }),
      { now: NOW_FN },
    )
    expect(out.status).toBe('blocked')
    expect(out.decision).toBe('blocked')
    expect(out.blockers).toContain('predecessor not approved')
    expect(out.summary).toMatch(/locked/i)
  })

  it('does not produce an artifact when locked, even if agent producesArtifact', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-artifact-draft-agent' }),
      makeContext({ stageLocked: true }),
      { now: NOW_FN },
    )
    expect(out.proposedArtifact).toBeUndefined()
    expect(out.proposedEvidence).toBeUndefined()
  })

  it('blocks even reviewers and evidence collectors when locked', () => {
    for (const agentId of ['stage-reviewer', 'evidence-ledger-assistant']) {
      const out = runCbccAgent(
        makeInput({ agentId }),
        makeContext({ stageLocked: true }),
        { now: NOW_FN },
      )
      expect(out.status, `${agentId} should be blocked`).toBe('blocked')
    }
  })
})

// ─── Approval guard ──────────────────────────────────────────────────────────

describe('runCbccAgent — approved stages', () => {
  it('stage_worker on approved stage returns no_change', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-context-reader' }),
      makeContext({ stageApproved: true }),
      { now: NOW_FN },
    )
    expect(out.status).toBe('completed')
    expect(out.decision).toBe('no_change')
    expect(out.summary).toMatch(/already approved/i)
  })

  it('artifact-producing stage_worker on approved stage returns no_change', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-artifact-draft-agent' }),
      makeContext({ stageApproved: true }),
      { now: NOW_FN },
    )
    expect(out.decision).toBe('no_change')
    expect(out.proposedArtifact).toBeUndefined()
  })

  it('reviewer can still run on approved stages (post-hoc review)', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-reviewer' }),
      makeContext({ stageApproved: true }),
      { now: NOW_FN },
    )
    expect(out.status).toBe('completed')
    expect(out.decision).toBe('no_change') // reviewer doesn't propose anything
  })

  it('evidence_collector can still run on approved stages', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'evidence-ledger-assistant' }),
      makeContext({ stageApproved: true }),
      { now: NOW_FN },
    )
    expect(out.status).toBe('completed')
    expect(out.decision).toBe('evidence_proposed')
  })
})

// ─── Capability dispatch ─────────────────────────────────────────────────────

describe('runCbccAgent — capability dispatch', () => {
  it('artifact-producing agent returns owner_review_required + proposedArtifact', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-artifact-draft-agent', prompt: 'draft this' }),
      makeContext(),
      { now: NOW_FN },
    )
    expect(out.status).toBe('completed')
    expect(out.decision).toBe('owner_review_required')
    expect(out.proposedArtifact).toBeDefined()
    expect((out.proposedArtifact as Record<string, unknown>).agentId).toBe('stage-artifact-draft-agent')
    expect((out.proposedArtifact as Record<string, unknown>).prompt).toBe('draft this')
    expect(out.recommendation).toMatch(/owner/i)
  })

  it('evidence-only agent returns evidence_proposed and no proposedArtifact', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'evidence-ledger-assistant' }),
      makeContext(),
      { now: NOW_FN },
    )
    expect(out.decision).toBe('evidence_proposed')
    expect(out.proposedArtifact).toBeUndefined()
    expect(out.proposedEvidence?.length).toBeGreaterThan(0)
  })

  it('summary-only agent (stage-context-reader) returns no_change', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-context-reader' }),
      makeContext(),
      { now: NOW_FN },
    )
    expect(out.decision).toBe('no_change')
    expect(out.proposedArtifact).toBeUndefined()
    expect(out.proposedEvidence).toBeUndefined()
  })

  it('reviewer attaches an owner-review recommendation', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-reviewer' }),
      makeContext(),
      { now: NOW_FN },
    )
    expect(out.recommendation).toMatch(/owner/i)
  })
})

// ─── Approval invariants ─────────────────────────────────────────────────────

describe('runCbccAgent — agents have no approval/unlock authority', () => {
  it('no agent run output exposes an "approved" status', () => {
    // The output's CbccAgentRunStatus union excludes 'approved' at the type
    // level. This runtime check confirms no path produces it.
    for (const agent of CBCC_DEFAULT_AGENT_REGISTRY) {
      for (const stageApproved of [false, true]) {
        for (const stageLocked of [false]) {
          const out = runCbccAgent(
            makeInput({ agentId: agent.id }),
            makeContext({ stageApproved, stageLocked }),
            { now: NOW_FN },
          )
          // Treat 'approved' as a forbidden status string defensively.
          expect(out.status).not.toBe('approved' as never)
        }
      }
    }
  })

  it('no decision string is "approved" or "unlocked"', () => {
    for (const agent of CBCC_DEFAULT_AGENT_REGISTRY) {
      const out = runCbccAgent(
        makeInput({ agentId: agent.id }),
        makeContext(),
        { now: NOW_FN },
      )
      expect(out.decision).not.toBe('approved' as never)
      expect(out.decision).not.toBe('unlocked' as never)
    }
  })
})

// ─── allowedStages whitelist ─────────────────────────────────────────────────

describe('runCbccAgent — allowedStages restriction', () => {
  const restricted: ReadonlyArray<CbccAgentDefinition> = [
    {
      id: 'only-stage-3',
      kind: 'stage_worker',
      name: 'Stage 3 Only',
      description: 'Test agent restricted to stage 3.',
      allowedStages: [3],
    },
  ]

  it('returns status=failed when invoked on a disallowed stage', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'only-stage-3', stageNumber: 5 }),
      makeContext(),
      { registry: restricted, now: NOW_FN },
    )
    expect(out.status).toBe('failed')
    expect(out.decision).toBe('no_change')
    expect(out.error).toMatch(/allowedStages/)
  })

  it('runs normally when invoked on an allowed stage', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'only-stage-3', stageNumber: 3 }),
      makeContext(),
      { registry: restricted, now: NOW_FN },
    )
    expect(out.status).toBe('completed')
  })

  it('agents without allowedStages run on any stage', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-context-reader', stageNumber: 99 }),
      makeContext(),
      { now: NOW_FN },
    )
    expect(out.status).toBe('completed')
  })
})

// ─── Unknown agent ───────────────────────────────────────────────────────────

describe('runCbccAgent — unknown agent', () => {
  it('throws CbccAgentNotFoundError for an unregistered agent id', () => {
    expect(() =>
      runCbccAgent(makeInput({ agentId: 'who-am-i' }), makeContext()),
    ).toThrow(CbccAgentNotFoundError)
  })

  it('the thrown error carries the agentId', () => {
    try {
      runCbccAgent(makeInput({ agentId: 'who-am-i' }), makeContext())
    } catch (e) {
      expect(e).toBeInstanceOf(CbccAgentNotFoundError)
      expect((e as CbccAgentNotFoundError).agentId).toBe('who-am-i')
    }
  })
})

// ─── Determinism + immutability ──────────────────────────────────────────────

describe('runCbccAgent — determinism and input safety', () => {
  it('does not mutate input or context', () => {
    const input = makeInput()
    const context = makeContext({ requiredEvidence: ['a'], existingEvidence: ['b'] })
    const inputSnap = JSON.stringify(input)
    const contextSnap = JSON.stringify(context)
    runCbccAgent(input, context, { now: NOW_FN })
    expect(JSON.stringify(input)).toBe(inputSnap)
    expect(JSON.stringify(context)).toBe(contextSnap)
  })

  it('returns identical output for identical input when clock is fixed', () => {
    const input = makeInput({ agentId: 'evidence-ledger-assistant' })
    const context = makeContext()
    const a = runCbccAgent(input, context, { now: NOW_FN })
    const b = runCbccAgent(input, context, { now: NOW_FN })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('completedAt is always set on terminal outcomes', () => {
    const out = runCbccAgent(makeInput(), makeContext(), { now: NOW_FN })
    expect(out.completedAt).toBe(NOW)
  })
})

// ─── Identity surfacing ──────────────────────────────────────────────────────

describe('runCbccAgent — identity surfacing in output', () => {
  it('embeds the agentId and stageNumber inside the proposed artifact', () => {
    const out = runCbccAgent(
      makeInput({ agentId: 'stage-artifact-draft-agent', stageNumber: 7 }),
      makeContext(),
      { now: NOW_FN },
    )
    const a = out.proposedArtifact as Record<string, unknown>
    expect(a.agentId).toBe('stage-artifact-draft-agent')
    expect(a.stageNumber).toBe(7)
  })
})

// ─── Source guards ───────────────────────────────────────────────────────────

describe('agent runtime source is generic', () => {
  const FORBIDDEN: ReadonlyArray<RegExp> = [
    /\bdap\b/i,
    /\bdental\b/i,
    /\binsurance\b/i,
    /\bpatient(s)?\b/i,
    /\bpractice(s)?\b/i,
    /\bmembership(s)?\b/i,
  ]

  async function read(rel: string) {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    return readFileSync(resolve(__dirname, rel), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
  }

  it('lib/cbcc/agentRuntime.ts contains no vertical-specific language', async () => {
    const src = await read('agentRuntime.ts')
    for (const re of FORBIDDEN) {
      expect(src, `agentRuntime.ts matched ${re}`).not.toMatch(re)
    }
  })

  it('lib/cbcc/agentRuntime.ts imports no AI SDK or persistence', async () => {
    const src = await read('agentRuntime.ts')
    expect(src).not.toMatch(/@anthropic-ai\/sdk/)
    expect(src).not.toMatch(/from ['"]openai['"]/i)
    expect(src).not.toMatch(/\bsupabase\b/i)
    expect(src).not.toMatch(/from ['"]next\//)
    expect(src).not.toMatch(/['"]use server['"]/)
  })
})
