import { describe, it, expect } from 'vitest'
import {
  buildCbccAiReviewPromptPacket,
  normalizeCbccAiReviewResult,
  CBCC_AI_REVIEW_NOT_REQUESTED,
  type BuildAiReviewPromptPacketInput,
} from './aiReview'
import type {
  CbccAiReviewResult,
  CbccEvidenceEntry,
  CbccEvidenceRequirement,
} from './types'

const NOW = '2026-05-01T00:00:00Z'
const PROJECT = 'project-1'
const STAGE = 'stage-3'

function makeEvidence(over: Partial<CbccEvidenceEntry> = {}): CbccEvidenceEntry {
  return {
    id: 'e-1',
    projectId: PROJECT,
    stageId: STAGE,
    type: 'file',
    status: 'valid',
    title: 'Some file',
    ref: 'src/foo.ts',
    createdAt: NOW,
    metadata: {},
    ...over,
  }
}

function makeBuildInput(over: Partial<BuildAiReviewPromptPacketInput> = {}): BuildAiReviewPromptPacketInput {
  return {
    projectId: PROJECT,
    stageId: STAGE,
    stageTitle: 'Stage Three',
    evidenceLedger: [],
    evidenceRequirements: [],
    guardrails: [],
    ...over,
  }
}

// ─── buildCbccAiReviewPromptPacket ───────────────────────────────────────────

describe('buildCbccAiReviewPromptPacket', () => {
  it('returns a packet keyed to the requested project + stage', () => {
    const p = buildCbccAiReviewPromptPacket(makeBuildInput())
    expect(p.projectId).toBe(PROJECT)
    expect(p.stageId).toBe(STAGE)
    expect(p.stageTitle).toBe('Stage Three')
  })

  it('passes through stageDescription, stagePurpose, and promptVersion', () => {
    const p = buildCbccAiReviewPromptPacket(makeBuildInput({
      stageDescription: 'desc',
      stagePurpose: 'purpose',
      promptVersion: 'v1',
    }))
    expect(p.stageDescription).toBe('desc')
    expect(p.stagePurpose).toBe('purpose')
    expect(p.promptVersion).toBe('v1')
  })

  it('scopes evidence to (projectId, stageId) — drops other-project and other-stage', () => {
    const ledger = [
      makeEvidence({ id: 'a' }),                                      // matches
      makeEvidence({ id: 'b', stageId: 'other-stage' }),              // wrong stage
      makeEvidence({ id: 'c', projectId: 'other-project' }),          // wrong project
      makeEvidence({ id: 'd' }),                                      // matches
    ]
    const p = buildCbccAiReviewPromptPacket(makeBuildInput({ evidenceLedger: ledger }))
    expect(p.evidence.map(e => e.id)).toEqual(['a', 'd'])
  })

  it('passes evidence requirements through verbatim', () => {
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r-test', type: 'test', title: 'Tests passing', required: true },
    ]
    const p = buildCbccAiReviewPromptPacket(makeBuildInput({ evidenceRequirements: reqs }))
    expect(p.evidenceRequirements).toEqual(reqs)
  })

  it('passes guardrails through verbatim (engine does not invent them)', () => {
    const guardrails = [
      'Do not approve. Recommend only.',
      'Cite evidence ids when raising risks.',
    ]
    const p = buildCbccAiReviewPromptPacket(makeBuildInput({ guardrails }))
    expect(p.guardrails).toEqual(guardrails)
  })

  it('passes priorReview through when supplied', () => {
    const prior: CbccAiReviewResult = {
      projectId: PROJECT,
      stageId: STAGE,
      decision: 'pass_with_concerns',
      summary: 'first pass',
      recommendation: { action: 'address_risks', rationale: 'two risks open' },
      risks: [],
      reviewedAt: NOW,
    }
    const p = buildCbccAiReviewPromptPacket(makeBuildInput({ priorReview: prior }))
    expect(p.priorReview).toEqual(prior)
  })

  it('does not mutate input arrays', () => {
    const ledger = [makeEvidence()]
    const reqs: CbccEvidenceRequirement[] = [
      { id: 'r1', type: 'test', title: 't', required: true },
    ]
    const guardrails = ['rule a']
    const ledgerSnap = JSON.stringify(ledger)
    const reqsSnap = JSON.stringify(reqs)
    const guardrailsSnap = JSON.stringify(guardrails)
    buildCbccAiReviewPromptPacket(makeBuildInput({
      evidenceLedger: ledger,
      evidenceRequirements: reqs,
      guardrails,
    }))
    expect(JSON.stringify(ledger)).toBe(ledgerSnap)
    expect(JSON.stringify(reqs)).toBe(reqsSnap)
    expect(JSON.stringify(guardrails)).toBe(guardrailsSnap)
  })
})

// ─── normalizeCbccAiReviewResult ─────────────────────────────────────────────

const BASE_CONTEXT = { projectId: PROJECT, stageId: STAGE, reviewedAt: NOW }

function validRaw(over: Partial<Record<string, unknown>> = {}) {
  return {
    decision: 'pass',
    summary: 'Looks good.',
    recommendation: { action: 'proceed_to_owner_review', rationale: 'all checks satisfied' },
    risks: [],
    ...over,
  }
}

describe('normalizeCbccAiReviewResult — happy paths', () => {
  it('accepts a fully-shaped object input', () => {
    const r = normalizeCbccAiReviewResult(validRaw(), BASE_CONTEXT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.decision).toBe('pass')
    expect(r.result.summary).toBe('Looks good.')
    expect(r.result.recommendation.action).toBe('proceed_to_owner_review')
    expect(r.result.projectId).toBe(PROJECT)
    expect(r.result.stageId).toBe(STAGE)
    expect(r.result.reviewedAt).toBe(NOW)
  })

  it('parses a JSON string input', () => {
    const r = normalizeCbccAiReviewResult(JSON.stringify(validRaw()), BASE_CONTEXT)
    expect(r.ok).toBe(true)
  })

  it('coerces missing risks to []', () => {
    const raw = validRaw()
    delete (raw as Record<string, unknown>).risks
    const r = normalizeCbccAiReviewResult(raw, BASE_CONTEXT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.risks).toEqual([])
  })

  it('preserves model + promptVersion when supplied', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({ model: 'opus-4-7', promptVersion: 'v1' }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.model).toBe('opus-4-7')
    expect(r.result.promptVersion).toBe('v1')
  })

  it('prefers model-supplied reviewedAt over context.reviewedAt', () => {
    const modelTime = '2030-01-01T00:00:00Z'
    const r = normalizeCbccAiReviewResult(
      validRaw({ reviewedAt: modelTime }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.reviewedAt).toBe(modelTime)
  })

  it('falls back to context.reviewedAt when model omits it', () => {
    const r = normalizeCbccAiReviewResult(validRaw(), BASE_CONTEXT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.reviewedAt).toBe(NOW)
  })

  it('falls back to now() when neither model nor context supplies reviewedAt', () => {
    const r = normalizeCbccAiReviewResult(validRaw(), { projectId: PROJECT, stageId: STAGE })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('preserves recommendation.nextSteps when supplied', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({
        recommendation: {
          action: 'address_risks',
          rationale: 'two risks',
          nextSteps: ['fix A', 'fix B'],
        },
      }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.recommendation.nextSteps).toEqual(['fix A', 'fix B'])
  })

  it('accepts a fully-shaped risk array', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({
        risks: [
          {
            id: 'risk-1',
            severity: 'high',
            category: 'evidence',
            message: 'Test coverage incomplete',
            citations: ['e-1', 'e-3'],
          },
        ],
      }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.result.risks).toHaveLength(1)
    expect(r.result.risks[0].severity).toBe('high')
    expect(r.result.risks[0].citations).toEqual(['e-1', 'e-3'])
  })
})

describe('normalizeCbccAiReviewResult — sad paths', () => {
  it('rejects a non-JSON string', () => {
    const r = normalizeCbccAiReviewResult('not json', BASE_CONTEXT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toContain('parse_error')
  })

  it('rejects a non-object value (number)', () => {
    const r = normalizeCbccAiReviewResult(42, BASE_CONTEXT)
    expect(r.ok).toBe(false)
  })

  it('rejects an array', () => {
    const r = normalizeCbccAiReviewResult([], BASE_CONTEXT)
    expect(r.ok).toBe(false)
  })

  it('rejects null', () => {
    const r = normalizeCbccAiReviewResult(null, BASE_CONTEXT)
    expect(r.ok).toBe(false)
  })

  it('rejects an unknown decision', () => {
    const r = normalizeCbccAiReviewResult(validRaw({ decision: 'banana' }), BASE_CONTEXT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/decision/)
  })

  it('rejects a missing summary', () => {
    const raw = validRaw()
    delete (raw as Record<string, unknown>).summary
    const r = normalizeCbccAiReviewResult(raw, BASE_CONTEXT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/summary/)
  })

  it('rejects a missing recommendation', () => {
    const raw = validRaw()
    delete (raw as Record<string, unknown>).recommendation
    const r = normalizeCbccAiReviewResult(raw, BASE_CONTEXT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/recommendation/)
  })

  it('rejects an unknown recommendation.action', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({ recommendation: { action: 'do_a_dance', rationale: 'x' } }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/recommendation\.action/)
  })

  it('rejects a missing recommendation.rationale', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({ recommendation: { action: 'no_action' } }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/rationale/)
  })

  it('rejects risks that are not an array', () => {
    const r = normalizeCbccAiReviewResult(validRaw({ risks: 'oops' }), BASE_CONTEXT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/risks/)
  })

  it('rejects a risk with unknown severity', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({ risks: [{ id: 'r1', severity: 'spicy', message: 'm' }] }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/severity/)
  })

  it('rejects a risk missing id or message', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({ risks: [{ severity: 'high', message: 'no id' }] }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/id/)
  })

  it('rejects citations that are not an array of strings', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({
        risks: [
          { id: 'r1', severity: 'low', message: 'm', citations: [1, 2] },
        ],
      }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/citations/)
  })

  it('rejects nextSteps that are not an array of strings', () => {
    const r = normalizeCbccAiReviewResult(
      validRaw({
        recommendation: {
          action: 'proceed_to_owner_review',
          rationale: 'r',
          nextSteps: [1, 2, 3],
        },
      }),
      BASE_CONTEXT,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/nextSteps/)
  })

  it('attaches the first error as the human-readable reason', () => {
    const r = normalizeCbccAiReviewResult({}, BASE_CONTEXT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBeTruthy()
  })
})

// ─── Engine boundary: AI is advisory only ────────────────────────────────────

describe('AI is advisory only — contract surface', () => {
  it('exposes no functions that mutate engine state', async () => {
    const mod = await import('./aiReview')
    const exports = Object.keys(mod)
    // Allow only contract-shaped exports; nothing like "approveStage",
    // "unlockStage", "writeStage", "updateProject", etc.
    const FORBIDDEN = ['approve', 'unlock', 'mutate', 'persist', 'commit', 'write', 'update']
    for (const name of exports) {
      const lower = name.toLowerCase()
      for (const f of FORBIDDEN) {
        expect(lower, `forbidden mutation-style export: ${name}`).not.toContain(f)
      }
    }
  })

  it('exports CBCC_AI_REVIEW_NOT_REQUESTED sentinel', () => {
    expect(CBCC_AI_REVIEW_NOT_REQUESTED).toEqual({ status: 'not_requested' })
  })
})

// ─── Source-level guards ─────────────────────────────────────────────────────

describe('aiReview source has no AI calls / vertical leakage', () => {
  async function read(rel: string) {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    return readFileSync(resolve(__dirname, rel), 'utf-8')
  }

  it('aiReview.ts does not import AI providers', async () => {
    const src = await read('aiReview.ts')
    expect(src).not.toMatch(/@anthropic-ai\/sdk/)
    expect(src).not.toMatch(/openai/i)
    expect(src).not.toMatch(/getAnthropicClient/)
    expect(src).not.toMatch(/fetch\(/)
  })

  it('aiReview.ts does not import server actions, supabase, or next', async () => {
    const src = await read('aiReview.ts')
    expect(src).not.toMatch(/['"]use server['"]/)
    expect(src).not.toMatch(/supabase/i)
    expect(src).not.toMatch(/from ['"]next\//)
  })

  const FORBIDDEN: ReadonlyArray<RegExp> = [
    /\bDAP\b/,
    /\bdental\b/i,
    /\binsurance\b/i,
    /\bpatient(s)?\b/i,
    /\bpractice(s)?\b/i,
    /\bmembership(s)?\b/i,
  ]

  for (const file of ['aiReview.ts', 'aiReview.test.ts']) {
    it(`lib/cbcc/${file} is generic`, async () => {
      const src = await read(file)
      for (const re of FORBIDDEN) {
        expect(src, `${file} matched ${re}`).not.toMatch(re)
      }
    })
  }
})
