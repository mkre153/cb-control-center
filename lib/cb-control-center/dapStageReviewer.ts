/**
 * DAP Stage Reviewer — Opus 4.7 AI-assisted stage review (runtime layer).
 *
 * Calls claude-opus-4-7 via the Claude Code CLI (same Max subscription used
 * by the AI chat panel) to review a stage artifact against the prompt packet
 * built by the adapter zone, parses the JSON response, and returns the
 * legacy `StageAiReview` shape the UI panel renders.
 *
 * CRITICAL: This is advisory only. The AI does NOT approve stages.
 * Owner approval requires editing dapStageGates.ts and committing.
 */

import { spawn } from 'child_process'
import type { DapStageGate } from './dapStageGates'
import { buildDapStageReviewPromptPacket } from '@/lib/cbcc/adapters/dap/dapStageReviewPrompt'

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? '/Users/mike/.local/bin/claude'

// ─── Legacy UI shape ──────────────────────────────────────────────────────────

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

// ─── Review (CLI transport) ───────────────────────────────────────────────────

export async function reviewStage(stage: DapStageGate): Promise<StageAiReview> {
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

  // Combine system + user into one prompt for the CLI -p flag.
  // The system prompt instructs the model to respond with JSON only.
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`

  return new Promise(resolve => {
    const child = spawn(
      CLAUDE_BIN,
      ['-p', combinedPrompt, '--model', 'claude-sonnet-4-6'],
      { env: { ...process.env, PATH: `/Users/mike/.local/bin:${process.env.PATH ?? ''}` } },
    )

    let stdout = ''
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr.on('data', () => {})
    child.stdin.end()

    const fail = (reason: string): StageAiReview => ({
      recommendation: 'request_revision',
      confidence: 'low',
      reasoning: `Review could not be completed — error: ${reason}`,
      checklistResults: [],
    })

    child.on('error', err => resolve(fail(err.message)))

    child.on('close', () => {
      try {
        // Extract the first complete JSON object from stdout —
        // the CLI may include trailing newlines or preamble text.
        const match = stdout.match(/\{[\s\S]*\}/)
        if (!match) {
          resolve(fail(`No JSON found in output. Raw: ${stdout.slice(0, 300)}`))
          return
        }
        const parsed = JSON.parse(match[0]) as StageAiReview
        resolve(parsed)
      } catch (err) {
        resolve(fail(err instanceof Error ? err.message : String(err)))
      }
    })
  })
}
