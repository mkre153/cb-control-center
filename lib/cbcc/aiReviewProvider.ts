// CBCC generic engine — AI review runtime (Part 4B)
//
// The provider boundary. A `CbccAiReviewProvider` knows how to take a
// CbccAiReviewPromptPacket and return raw output. The runner composes the
// provider call with Part 4A's normalize step to produce a typed
// CbccAiReviewResult — or to throw a structured error.
//
// What this module DOES:
//   - defines a minimal injectable provider interface
//   - calls the provider exactly once per run
//   - normalizes the response using the Part 4A contract
//   - throws typed errors when the provider fails or the response is malformed
//
// What this module DOES NOT do:
//   - approve, reject, or unlock stages
//   - mutate evidence or persist anything
//   - call any specific AI SDK (Anthropic, OpenAI, etc.)
//   - depend on Supabase, server actions, routes, or UI
//
// A concrete adapter (e.g. Anthropic) is a separate file — Part 4B keeps the
// runtime generic and the test suite hermetic via mock providers.

import type { CbccAiReviewPromptPacket, CbccAiReviewResult } from './types'
import { normalizeCbccAiReviewResult } from './aiReview'

// ─── Provider interface ───────────────────────────────────────────────────────

export interface CbccAiReviewProvider {
  /**
   * Take the packet, talk to whatever the provider's transport is, and
   * return raw output (a string of JSON or an already-parsed object). The
   * runner does not interpret the value — it hands it to normalize.
   *
   * Providers should resolve with raw output. Reject with an Error when
   * the transport fails (network, auth, etc.); the runner re-throws that
   * as a `CbccAiReviewProviderError`.
   */
  review(packet: CbccAiReviewPromptPacket): Promise<unknown>
}

// ─── Typed errors ─────────────────────────────────────────────────────────────

export class CbccAiReviewProviderError extends Error {
  readonly cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'CbccAiReviewProviderError'
    this.cause = cause
  }
}

export class CbccAiReviewNormalizationError extends Error {
  readonly errors: ReadonlyArray<string>
  readonly reason: string
  constructor(message: string, reason: string, errors: ReadonlyArray<string>) {
    super(message)
    this.name = 'CbccAiReviewNormalizationError'
    this.reason = reason
    this.errors = errors
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export interface RunCbccAiReviewInput {
  packet: CbccAiReviewPromptPacket
  provider: CbccAiReviewProvider
  // Optional fallback `reviewedAt` passed to normalize when the provider
  // output omits it. If neither is present, normalize uses now().
  reviewedAt?: string
}

export async function runCbccAiReview(
  input: RunCbccAiReviewInput,
): Promise<CbccAiReviewResult> {
  const { packet, provider, reviewedAt } = input

  let raw: unknown
  try {
    raw = await provider.review(packet)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    throw new CbccAiReviewProviderError(
      `provider.review() rejected: ${message}`,
      e,
    )
  }

  const normalized = normalizeCbccAiReviewResult(raw, {
    projectId: packet.projectId,
    stageId: packet.stageId,
    reviewedAt,
  })

  if (!normalized.ok) {
    throw new CbccAiReviewNormalizationError(
      `provider output failed normalization: ${normalized.reason}`,
      normalized.reason,
      normalized.errors,
    )
  }

  return normalized.result
}

// ─── Test-only helper ─────────────────────────────────────────────────────────
//
// `createMockCbccAiReviewProvider` is exported so callers (especially tests)
// can wire a deterministic provider without touching real transports. It
// captures the last packet for assertions and supports either a fixed raw
// value or a function that derives one from the packet.

export interface CreateMockProviderOptions {
  // Raw value to return. May be an object, string of JSON, or anything
  // normalize would accept (or reject — useful for sad-path tests).
  raw?: unknown
  // Function form — receives the packet and returns the raw value. Mutually
  // exclusive with `raw` (function takes precedence when both are supplied).
  rawFn?: (packet: CbccAiReviewPromptPacket) => unknown | Promise<unknown>
  // When set, the provider rejects with this Error instead of returning.
  reject?: Error
}

export interface MockCbccAiReviewProvider extends CbccAiReviewProvider {
  calls: ReadonlyArray<CbccAiReviewPromptPacket>
}

export function createMockCbccAiReviewProvider(
  options: CreateMockProviderOptions = {},
): MockCbccAiReviewProvider {
  const calls: CbccAiReviewPromptPacket[] = []
  return {
    calls,
    async review(packet) {
      calls.push(packet)
      if (options.reject) throw options.reject
      if (options.rawFn) return options.rawFn(packet)
      return options.raw
    },
  }
}
