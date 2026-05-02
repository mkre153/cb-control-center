/**
 * DAP Stage Reviewer — Opus 4.7 AI-assisted stage review (runtime layer).
 *
 * Calls claude-opus-4-7 to review a stage artifact against the prompt packet
 * built by the adapter zone, parses the JSON response, and returns the
 * legacy `StageAiReview` shape the UI panel renders.
 *
 * Part 20 split:
 *   - Pure prompt assembly (truth rules, system + user prompt, rubric
 *     threading, gate-shaped input contract) lives in
 *     `lib/cbcc/adapters/dap/dapStageReviewPrompt.ts`.
 *   - This file owns only the Anthropic transport: SDK call, response
 *     text extraction, JSON parse, error fallback, and the legacy
 *     `StageAiReview` UI-compat type.
 *
 * CRITICAL: This is advisory only. The AI does NOT approve stages.
 * Owner approval requires editing dapStageGates.ts and committing.
 */

import { getAnthropicClient } from './anthropicClient'
import type { DapStageGate } from './dapStageGates'
import { buildDapStageReviewPromptPacket } from '@/lib/cbcc/adapters/dap/dapStageReviewPrompt'

// ─── Legacy UI shape ──────────────────────────────────────────────────────────
//
// The shape `StageAiReviewPanel.tsx` and the runtime provider's
// `consumeLastLegacy()` harvester both depend on. Kept here (rather than in
// the adapter) because it's the legacy compatibility contract — the engine
// port already produces a richer `CbccAiReviewResult`; this is the
// pre-engine-port shape.

export interface StageAiChecklistResult {
  criterion: string
  passed: boolean
  note?: string
}

export interface StageAiReview {
  recommendation: 'approve' | 'disapprove' | 'request_revision'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  checklistResults: StageAiChecklistResult[]
}

// ─── Review (Anthropic transport) ─────────────────────────────────────────────

export async function reviewStage(stage: DapStageGate): Promise<StageAiReview> {
  const client = getAnthropicClient()

  // The gate type lives in this folder; the adapter prompt module declares a
  // structural input shape that the gate satisfies via TypeScript's
  // structural typing. This call site is the one-way safe data flow:
  // legacy → adapter, never the reverse.
  const { systemPrompt, userPrompt } = buildDapStageReviewPromptPacket({
    stageId: stage.stageId,
    stageNumber: stage.stageNumber,
    title: stage.title,
    status: stage.status,
    requirements: stage.requirements,
    requiredApprovals: stage.requiredApprovals,
    blockers: stage.blockers,
    implementationEvidence: stage.implementationEvidence,
    artifact: stage.artifact,
  })

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const text = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    const parsed = JSON.parse(text) as StageAiReview
    return parsed
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    return {
      recommendation: 'request_revision',
      confidence: 'low',
      reasoning: `Review could not be completed — error: ${raw}`,
      checklistResults: [],
    }
  }
}
