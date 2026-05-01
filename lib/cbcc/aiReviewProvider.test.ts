import { describe, it, expect } from 'vitest'
import {
  runCbccAiReview,
  createMockCbccAiReviewProvider,
  CbccAiReviewProviderError,
  CbccAiReviewNormalizationError,
  type CbccAiReviewProvider,
} from './aiReviewProvider'
import type { CbccAiReviewPromptPacket } from './types'

const NOW = '2026-05-01T00:00:00Z'
const PROJECT = 'project-1'
const STAGE = 'stage-3'

function makePacket(over: Partial<CbccAiReviewPromptPacket> = {}): CbccAiReviewPromptPacket {
  return {
    projectId: PROJECT,
    stageId: STAGE,
    stageTitle: 'Stage Three',
    evidence: [],
    evidenceRequirements: [],
    guardrails: [],
    ...over,
  }
}

function validRaw(over: Partial<Record<string, unknown>> = {}) {
  return {
    decision: 'pass',
    summary: 'All required evidence is in place.',
    recommendation: { action: 'proceed_to_owner_review', rationale: 'all checks satisfied' },
    risks: [],
    ...over,
  }
}

// ─── Happy path ──────────────────────────────────────────────────────────────

describe('runCbccAiReview — happy path', () => {
  it('returns a typed CbccAiReviewResult on a well-formed object response', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: validRaw() })
    const result = await runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW })
    expect(result.projectId).toBe(PROJECT)
    expect(result.stageId).toBe(STAGE)
    expect(result.decision).toBe('pass')
    expect(result.summary).toMatch(/required evidence/i)
    expect(result.recommendation.action).toBe('proceed_to_owner_review')
    expect(result.reviewedAt).toBe(NOW)
  })

  it('accepts a JSON-string response (provider returns raw text)', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: JSON.stringify(validRaw()) })
    const result = await runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW })
    expect(result.decision).toBe('pass')
  })

  it('passes the exact packet to the provider (no rewriting)', async () => {
    const packet = makePacket({
      stageDescription: 'desc',
      stagePurpose: 'purpose',
      guardrails: ['rule a', 'rule b'],
      promptVersion: 'v1',
    })
    const provider = createMockCbccAiReviewProvider({ raw: validRaw() })
    await runCbccAiReview({ packet, provider, reviewedAt: NOW })
    expect(provider.calls).toHaveLength(1)
    expect(provider.calls[0]).toBe(packet)
  })

  it('lets the provider derive output from the packet via rawFn', async () => {
    const provider = createMockCbccAiReviewProvider({
      rawFn: (p) =>
        validRaw({ summary: `reviewed ${p.stageTitle}` }),
    })
    const result = await runCbccAiReview({ packet: makePacket(), provider })
    expect(result.summary).toBe('reviewed Stage Three')
  })

  it('uses provider-supplied reviewedAt when present', async () => {
    const modelTime = '2030-01-01T00:00:00Z'
    const provider = createMockCbccAiReviewProvider({ raw: validRaw({ reviewedAt: modelTime }) })
    const result = await runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW })
    expect(result.reviewedAt).toBe(modelTime)
  })

  it('falls back to runner-supplied reviewedAt when provider omits it', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: validRaw() })
    const result = await runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW })
    expect(result.reviewedAt).toBe(NOW)
  })

  it('falls back to now() when neither provider nor runner supplies reviewedAt', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: validRaw() })
    const result = await runCbccAiReview({ packet: makePacket(), provider })
    expect(result.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('overrides projectId/stageId from the packet, ignoring any in raw output', async () => {
    // Provider tries to claim a different project/stage — runner should
    // pin identity to the packet (the engine is the source of truth).
    const provider = createMockCbccAiReviewProvider({
      raw: { ...validRaw(), projectId: 'WRONG', stageId: 'WRONG' } as Record<string, unknown>,
    })
    const result = await runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW })
    expect(result.projectId).toBe(PROJECT)
    expect(result.stageId).toBe(STAGE)
  })
})

// ─── Provider failures ───────────────────────────────────────────────────────

describe('runCbccAiReview — provider errors', () => {
  it('wraps a thrown provider error in CbccAiReviewProviderError with cause', async () => {
    const original = new Error('network down')
    const provider = createMockCbccAiReviewProvider({ reject: original })
    await expect(runCbccAiReview({ packet: makePacket(), provider }))
      .rejects.toBeInstanceOf(CbccAiReviewProviderError)
    try {
      await runCbccAiReview({ packet: makePacket(), provider })
    } catch (e) {
      expect(e).toBeInstanceOf(CbccAiReviewProviderError)
      const err = e as CbccAiReviewProviderError
      expect(err.message).toMatch(/network down/)
      expect(err.cause).toBe(original)
    }
  })

  it('wraps a non-Error rejection (string) without crashing', async () => {
    const provider: CbccAiReviewProvider = {
      review: async () => {
        // eslint-disable-next-line no-throw-literal
        throw 'some string'
      },
    }
    try {
      await runCbccAiReview({ packet: makePacket(), provider })
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(CbccAiReviewProviderError)
      expect((e as CbccAiReviewProviderError).cause).toBe('some string')
    }
  })

  it('does not call normalize when the provider rejects', async () => {
    // Implicit: a normalize call would have been a no-op on undefined,
    // which would still throw — but the throw site should be the
    // provider error, not the normalization error.
    const provider = createMockCbccAiReviewProvider({ reject: new Error('boom') })
    try {
      await runCbccAiReview({ packet: makePacket(), provider })
    } catch (e) {
      expect(e).toBeInstanceOf(CbccAiReviewProviderError)
      expect(e).not.toBeInstanceOf(CbccAiReviewNormalizationError)
    }
  })
})

// ─── Normalization failures ──────────────────────────────────────────────────

describe('runCbccAiReview — normalization errors', () => {
  it('throws CbccAiReviewNormalizationError when raw is malformed', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: { decision: 'banana' } })
    await expect(runCbccAiReview({ packet: makePacket(), provider }))
      .rejects.toBeInstanceOf(CbccAiReviewNormalizationError)
  })

  it('exposes errors[] and reason on the thrown normalization error', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: {} })
    try {
      await runCbccAiReview({ packet: makePacket(), provider })
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(CbccAiReviewNormalizationError)
      const err = e as CbccAiReviewNormalizationError
      expect(err.errors.length).toBeGreaterThan(0)
      expect(err.reason).toBeTruthy()
    }
  })

  it('throws CbccAiReviewNormalizationError on a non-JSON string response', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: 'not json' })
    await expect(runCbccAiReview({ packet: makePacket(), provider }))
      .rejects.toBeInstanceOf(CbccAiReviewNormalizationError)
  })
})

// ─── Provider invocation count ───────────────────────────────────────────────

describe('runCbccAiReview — provider call count', () => {
  it('calls provider.review exactly once per run on the happy path', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: validRaw() })
    await runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW })
    expect(provider.calls).toHaveLength(1)
  })

  it('calls provider.review exactly once even when normalize fails', async () => {
    const provider = createMockCbccAiReviewProvider({ raw: { decision: 'banana' } })
    await expect(runCbccAiReview({ packet: makePacket(), provider, reviewedAt: NOW }))
      .rejects.toThrow()
    expect(provider.calls).toHaveLength(1)
  })

  it('calls provider.review exactly once even when provider rejects', async () => {
    const calls: CbccAiReviewPromptPacket[] = []
    const provider: CbccAiReviewProvider = {
      review: async (packet) => {
        calls.push(packet)
        throw new Error('boom')
      },
    }
    await expect(runCbccAiReview({ packet: makePacket(), provider }))
      .rejects.toThrow()
    expect(calls).toHaveLength(1)
  })
})

// ─── Engine boundary ─────────────────────────────────────────────────────────

describe('runtime contains no engine state mutation surface', () => {
  it('module exports do not include mutation-style names', async () => {
    const mod = await import('./aiReviewProvider')
    const exports = Object.keys(mod)
    const FORBIDDEN = ['approve', 'unlock', 'persist', 'commit', 'write', 'updateStage']
    for (const name of exports) {
      const lower = name.toLowerCase()
      for (const f of FORBIDDEN) {
        expect(lower, `forbidden mutation-style export: ${name}`).not.toContain(f.toLowerCase())
      }
    }
  })
})

// ─── Source-level guards ─────────────────────────────────────────────────────

describe('aiReviewProvider source has no AI SDK imports / vertical leakage', () => {
  async function read(rel: string) {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    return readFileSync(resolve(__dirname, rel), 'utf-8')
  }

  it('aiReviewProvider.ts does not import a real AI SDK', async () => {
    const src = await read('aiReviewProvider.ts')
    expect(src).not.toMatch(/@anthropic-ai\/sdk/)
    expect(src).not.toMatch(/['"]openai['"]/i)
    expect(src).not.toMatch(/getAnthropicClient/)
    expect(src).not.toMatch(/fetch\(/)
  })

  it('aiReviewProvider.ts does not import server actions, supabase, or next', async () => {
    const src = await read('aiReviewProvider.ts')
    expect(src).not.toMatch(/['"]use server['"]/)
    expect(src).not.toMatch(/from ['"]@supabase/)
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

  for (const file of ['aiReviewProvider.ts', 'aiReviewProvider.test.ts']) {
    it(`lib/cbcc/${file} is generic`, async () => {
      const src = await read(file)
      for (const re of FORBIDDEN) {
        expect(src, `${file} matched ${re}`).not.toMatch(re)
      }
    })
  }
})
