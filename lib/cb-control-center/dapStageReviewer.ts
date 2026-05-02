/**
 * DAP Stage Reviewer — Opus 4.7 AI-assisted stage review
 *
 * Calls claude-opus-4-7 to review a stage artifact against the stage requirements,
 * DAP truth rules, and the anti-bypass rule. Returns a structured recommendation.
 *
 * CRITICAL: This is advisory only. The AI does NOT approve stages.
 * Owner approval requires editing dapStageGates.ts and committing.
 */

import { getAnthropicClient } from './anthropicClient'
import type { DapStageGate } from './dapStageGates'
import { getDapStageRubric, formatDapStageRubricForPrompt } from '@/lib/cbcc/adapters/dap/dapStageRubrics'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── DAP truth rules (immutable) ─────────────────────────────────────────────

const DAP_TRUTH_RULES = [
  'DAP is not dental insurance',
  'DAP does not process claims',
  'DAP does not collect PHI',
  'DAP does not set practice pricing',
  'DAP does not guarantee savings',
  'DAP does not guarantee universal availability',
  'DAP does not pay dental providers',
]

// ─── Review ───────────────────────────────────────────────────────────────────

export async function reviewStage(stage: DapStageGate): Promise<StageAiReview> {
  const client = getAnthropicClient()

  const rubric = getDapStageRubric(stage.stageNumber)
  const rubricBlock = rubric
    ? `\n\n${formatDapStageRubricForPrompt(rubric)}`
    : '\n\n(No stage-specific rubric registered for this stage number — review against requirements and truth rules only.)'

  const systemPrompt = `You are a DAP build process auditor for CB Control Center. Your role is to review stage artifacts and evidence, then recommend whether the owner should approve or not.

ANTI-BYPASS RULE: No DAP implementation phase may begin without a CBCC-issued directive for that stage. Each phase stops at evidence submission. Owner must approve before the next directive is issued.

DAP TRUTH RULES (immutable — no artifact may contradict these):
${DAP_TRUTH_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n')}
${rubricBlock}

CRITICAL: You are advisory only. Your recommendation does not approve anything. Owner approval is a separate, deliberate action — only the owner approves by editing dapStageGates.ts and committing.

Respond with ONLY valid JSON matching this exact shape:
{
  "recommendation": "approve" | "disapprove" | "request_revision",
  "confidence": "high" | "medium" | "low",
  "reasoning": "markdown string explaining your recommendation",
  "checklistResults": [
    { "criterion": "string", "passed": true | false, "note": "optional string" }
  ]
}`

  const userPrompt = JSON.stringify({
    advisoryNotice: 'AI output is advisory only. Owner approval is separate and required before any stage unlocks.',
    projectSlug: 'dental-advantage-plan',
    stageId: stage.stageId,
    stageNumber: stage.stageNumber,
    title: stage.title,
    status: stage.status,
    requirements: stage.requirements,
    requiredApprovals: stage.requiredApprovals,
    blockers: stage.blockers,
    implementationEvidence: stage.implementationEvidence,
    artifact: stage.artifact ?? null,
    truthRules: DAP_TRUTH_RULES,
    rubric: rubric ?? null,
  }, null, 2)

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
