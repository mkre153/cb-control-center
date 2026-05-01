// CBCC generic engine — AI review contract (Part 4A)
//
// Pure functions only. No external API calls, no persistence, no UI, no
// vertical-specific logic. The contract layer represents an AI
// recommendation as advisory data: a CbccAiReviewResult is produced,
// surfaced to the owner, and never mutates engine state automatically.
//
// Two functions:
//
//   buildCbccAiReviewPromptPacket(input)
//     Pure. Produces the structured packet a future provider (Part 4B) will
//     send to a model. Scopes evidence to the current stage and copies
//     guardrails verbatim. The engine does not invent guardrails — callers
//     supply them per project.
//
//   normalizeCbccAiReviewResult(raw, context)
//     Pure. Accepts either a JSON string or an already-parsed object as the
//     model's output, validates the shape, and returns a typed result or a
//     structured error. This is the safety boundary: malformed model output
//     never reaches downstream code as a typed value.

import type {
  CbccAiReviewDecision,
  CbccAiReviewPromptPacket,
  CbccAiReviewRecommendation,
  CbccAiReviewRecommendationAction,
  CbccAiReviewResult,
  CbccAiReviewRisk,
  CbccAiReviewRiskSeverity,
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccStageId,
} from './types'

// ─── Validation tables ────────────────────────────────────────────────────────

const VALID_DECISIONS: ReadonlySet<CbccAiReviewDecision> = new Set([
  'pass',
  'pass_with_concerns',
  'fail',
  'inconclusive',
])

const VALID_SEVERITIES: ReadonlySet<CbccAiReviewRiskSeverity> = new Set([
  'low',
  'medium',
  'high',
  'critical',
])

const VALID_ACTIONS: ReadonlySet<CbccAiReviewRecommendationAction> = new Set([
  'request_more_evidence',
  'revise_artifact',
  'rerun_tests',
  'address_risks',
  'proceed_to_owner_review',
  'no_action',
])

// ─── Prompt packet builder ────────────────────────────────────────────────────

export interface BuildAiReviewPromptPacketInput {
  projectId: string
  stageId: CbccStageId
  stageTitle: string
  stageDescription?: string
  stagePurpose?: string
  // Whole ledger — the builder scopes to (projectId, stageId) so callers
  // don't need to pre-filter.
  evidenceLedger: CbccEvidenceLedger
  evidenceRequirements: ReadonlyArray<CbccEvidenceRequirement>
  guardrails: ReadonlyArray<string>
  priorReview?: CbccAiReviewResult
  promptVersion?: string
}

export function buildCbccAiReviewPromptPacket(
  input: BuildAiReviewPromptPacketInput,
): CbccAiReviewPromptPacket {
  const evidence = input.evidenceLedger.filter(
    e => e.projectId === input.projectId && e.stageId === input.stageId,
  )
  return {
    projectId: input.projectId,
    stageId: input.stageId,
    stageTitle: input.stageTitle,
    stageDescription: input.stageDescription,
    stagePurpose: input.stagePurpose,
    evidence,
    evidenceRequirements: input.evidenceRequirements,
    priorReview: input.priorReview,
    guardrails: input.guardrails,
    promptVersion: input.promptVersion,
  }
}

// ─── Result normalization ─────────────────────────────────────────────────────

export type NormalizeCbccAiReviewResultOutput =
  | { ok: true; result: CbccAiReviewResult }
  | { ok: false; reason: string; errors: ReadonlyArray<string> }

export interface NormalizeContext {
  projectId: string
  stageId: CbccStageId
  // When the model didn't supply a reviewedAt, the caller's clock is used.
  // Defaults to current ISO when undefined.
  reviewedAt?: string
}

export function normalizeCbccAiReviewResult(
  raw: unknown,
  context: NormalizeContext,
): NormalizeCbccAiReviewResultOutput {
  // 1. Parse JSON string if needed.
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, reason: 'raw output is not valid JSON', errors: ['parse_error'] }
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'raw output is not an object', errors: ['shape_error'] }
  }

  const obj = parsed as Record<string, unknown>
  const errors: string[] = []

  // 2. Validate decision.
  const decision = obj.decision
  if (typeof decision !== 'string' || !VALID_DECISIONS.has(decision as CbccAiReviewDecision)) {
    errors.push(`decision must be one of: ${[...VALID_DECISIONS].join(', ')}`)
  }

  // 3. Validate summary.
  const summary = obj.summary
  if (typeof summary !== 'string' || !summary.trim()) {
    errors.push('summary is required and must be a non-empty string')
  }

  // 4. Validate recommendation.
  const recommendation = normalizeRecommendation(obj.recommendation, errors)

  // 5. Validate risks (optional in raw input → defaults to []).
  const risks = normalizeRisks(obj.risks, errors)

  if (errors.length > 0) {
    return { ok: false, reason: errors[0], errors }
  }

  // model / promptVersion are optional pass-throughs.
  const model = typeof obj.model === 'string' ? obj.model : undefined
  const promptVersion = typeof obj.promptVersion === 'string' ? obj.promptVersion : undefined

  // reviewedAt: prefer model output, then context, then now().
  const reviewedAt =
    typeof obj.reviewedAt === 'string' && obj.reviewedAt.trim()
      ? obj.reviewedAt
      : context.reviewedAt ?? new Date().toISOString()

  const result: CbccAiReviewResult = {
    projectId: context.projectId,
    stageId: context.stageId,
    model,
    promptVersion,
    decision: decision as CbccAiReviewDecision,
    summary: summary as string,
    recommendation: recommendation!,
    risks,
    reviewedAt,
  }

  return { ok: true, result }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function normalizeRecommendation(
  raw: unknown,
  errors: string[],
): CbccAiReviewRecommendation | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push('recommendation is required and must be an object')
    return undefined
  }
  const r = raw as Record<string, unknown>
  const action = r.action
  const rationale = r.rationale
  const nextSteps = r.nextSteps

  if (typeof action !== 'string' || !VALID_ACTIONS.has(action as CbccAiReviewRecommendationAction)) {
    errors.push(`recommendation.action must be one of: ${[...VALID_ACTIONS].join(', ')}`)
  }
  if (typeof rationale !== 'string' || !rationale.trim()) {
    errors.push('recommendation.rationale is required and must be a non-empty string')
  }

  let nextStepsArr: ReadonlyArray<string> | undefined
  if (nextSteps !== undefined) {
    if (!Array.isArray(nextSteps) || !nextSteps.every(s => typeof s === 'string')) {
      errors.push('recommendation.nextSteps must be an array of strings when provided')
    } else {
      nextStepsArr = nextSteps as ReadonlyArray<string>
    }
  }

  if (errors.length > 0 && (typeof action !== 'string' || typeof rationale !== 'string')) {
    return undefined
  }

  return {
    action: action as CbccAiReviewRecommendationAction,
    rationale: typeof rationale === 'string' ? rationale : '',
    nextSteps: nextStepsArr,
  }
}

function normalizeRisks(raw: unknown, errors: string[]): ReadonlyArray<CbccAiReviewRisk> {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    errors.push('risks must be an array when provided')
    return []
  }
  const out: CbccAiReviewRisk[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`risks[${i}] must be an object`)
      continue
    }
    const r = item as Record<string, unknown>
    const id = r.id
    const severity = r.severity
    const message = r.message
    const category = r.category
    const citations = r.citations

    if (typeof id !== 'string' || !id.trim()) errors.push(`risks[${i}].id is required`)
    if (typeof severity !== 'string' || !VALID_SEVERITIES.has(severity as CbccAiReviewRiskSeverity)) {
      errors.push(`risks[${i}].severity must be one of: ${[...VALID_SEVERITIES].join(', ')}`)
    }
    if (typeof message !== 'string' || !message.trim()) errors.push(`risks[${i}].message is required`)

    let citationsArr: ReadonlyArray<string> | undefined
    if (citations !== undefined) {
      if (!Array.isArray(citations) || !citations.every(c => typeof c === 'string')) {
        errors.push(`risks[${i}].citations must be an array of strings when provided`)
      } else {
        citationsArr = citations as ReadonlyArray<string>
      }
    }

    if (
      typeof id === 'string' &&
      typeof severity === 'string' &&
      VALID_SEVERITIES.has(severity as CbccAiReviewRiskSeverity) &&
      typeof message === 'string'
    ) {
      out.push({
        id,
        severity: severity as CbccAiReviewRiskSeverity,
        category: typeof category === 'string' ? category : undefined,
        message,
        citations: citationsArr,
      })
    }
  }
  return out
}

// ─── Re-export types for ergonomics ──────────────────────────────────────────

export type {
  CbccAiReviewDecision,
  CbccAiReviewPromptPacket,
  CbccAiReviewRecommendation,
  CbccAiReviewRecommendationAction,
  CbccAiReviewResult,
  CbccAiReviewRisk,
  CbccAiReviewRiskSeverity,
} from './types'

// Convenience: a sentinel for "not yet reviewed". Callers may use this when
// constructing a stage page model that has no review yet, but the engine
// itself never auto-creates results — only normalize does.
export const CBCC_AI_REVIEW_NOT_REQUESTED = Object.freeze({ status: 'not_requested' as const })
