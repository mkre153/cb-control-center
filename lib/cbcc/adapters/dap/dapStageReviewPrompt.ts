// CBCC adapter — DAP stage AI review prompt assembly (Part 20).
//
// Pure prompt construction for the DAP advisory stage review. Owns:
//   - the immutable DAP truth-rule list,
//   - the structural shape of the gate fields the prompt consumes,
//   - the system + user prompt strings produced from a gate input
//     and the per-stage rubric.
//
// What this file does NOT own:
//   - any Anthropic SDK call (lives in `lib/cb-control-center/`)
//   - any HTTP / network IO
//   - any persistence
//   - the legacy `StageAiReview` UI shape (lives next to the reviewer)
//
// Why a structural input type:
//   the reviewer's `DapStageGate` type lives in `lib/cb-control-center/`,
//   which the adapter zone is forbidden from importing. Rather than
//   moving the gate type (out of scope for Part 20), this module declares
//   the minimal shape it actually reads. The legacy reviewer adapts a
//   full `DapStageGate` to this shape at the call site — a one-way safe
//   data flow.
//
// Architecture invariants (asserted by Part 20 boundary tests):
//   - No `@anthropic-ai/sdk`, `getAnthropicClient`, `fetch(`, `supabase`,
//     `next/`, `react`, `'use server'`, `'use client'`.
//   - No imports from `lib/cb-control-center/`.
//   - Allowed imports: pure adapter siblings (currently only the rubric
//     module).

import {
  getDapStageRubric,
  formatDapStageRubricForPrompt,
} from './dapStageRubrics'

// ─── Truth rules ──────────────────────────────────────────────────────────────
//
// The "DAP does not …" assertions every advisory review must respect. These
// are review-context phrasings; a richer normative truth schema (with `is` /
// `isNot` / forbidden implications) lives in
// `lib/cb-control-center/cbSeoAeoLlmFormatting.ts` for SEO/LLM formatting
// concerns. Both shapes are intentionally separate — the review prompt only
// needs the flat assertion list.

export const DAP_TRUTH_RULES: readonly string[] = [
  'DAP is not dental insurance',
  'DAP does not process claims',
  'DAP does not collect PHI',
  'DAP does not set practice pricing',
  'DAP does not guarantee savings',
  'DAP does not guarantee universal availability',
  'DAP does not pay dental providers',
]

// ─── Structural input ─────────────────────────────────────────────────────────
//
// Minimal shape the prompt builder reads from a stage. Mirrors the
// corresponding fields on `DapStageGate` (in `lib/cb-control-center/`),
// but is declared structurally so the adapter zone never imports the
// legacy folder. Any caller passing a `DapStageGate` automatically
// satisfies this interface via TypeScript's structural typing.

export interface DapStageReviewPromptInput {
  readonly stageId: string
  readonly stageNumber: number
  readonly title: string
  readonly status: string
  readonly requirements: readonly string[]
  readonly requiredApprovals: readonly string[]
  readonly blockers: readonly string[]
  readonly implementationEvidence: unknown
  readonly artifact?: unknown
}

// ─── Output packet ────────────────────────────────────────────────────────────

export interface DapStageReviewPromptPacket {
  readonly systemPrompt: string
  readonly userPrompt: string
}

// ─── Builder ──────────────────────────────────────────────────────────────────
//
// Pure function. Given the gate-shaped input, returns the exact
// (systemPrompt, userPrompt) pair the reviewer hands to the Anthropic
// SDK. Behavior must match the pre-Part-20 in-reviewer assembly so the
// transport layer's request shape is identical.

export function buildDapStageReviewPromptPacket(
  input: DapStageReviewPromptInput,
): DapStageReviewPromptPacket {
  const rubric = getDapStageRubric(input.stageNumber)
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
    stageId: input.stageId,
    stageNumber: input.stageNumber,
    title: input.title,
    status: input.status,
    requirements: input.requirements,
    requiredApprovals: input.requiredApprovals,
    blockers: input.blockers,
    implementationEvidence: input.implementationEvidence,
    artifact: input.artifact ?? null,
    truthRules: DAP_TRUTH_RULES,
    rubric: rubric ?? null,
  }, null, 2)

  return { systemPrompt, userPrompt }
}
