import { getAnthropicClient } from './anthropicClient'
import { CBCC_STAGE_DEFINITIONS } from './cbccStageDefinitions'
import type { CbccProjectIntake, ProjectCharter } from './cbccProjectTypes'

export type CharterGenerationResult =
  | { ok: true; charter: ProjectCharter }
  | { ok: false; code: 'parse_error' | 'api_error' | 'invalid_shape'; message: string }

const SYSTEM_PROMPT = `You are a project charter author for CB Control Center, a generic SOP-first process governance engine.

Your role is to generate a structured Project Charter based on the intake information provided. The charter defines project scope and governs what the project is and is not.

CRITICAL RULES — the charter approves scope only. It does NOT approve:
- Claims or marketing statements
- Positioning or messaging language
- Compliance assertions
- SEO strategy or page content decisions
- Design decisions or visual direction
- Final build decisions or implementation specifics

The charter is the governing contract that unlocks Stage 1. Subsequent stages each require their own owner approval.

Respond with ONLY valid JSON matching this exact shape:
{
  "whatThisIs": "string — what this project fundamentally is",
  "whatThisIsNot": "string — explicit exclusions to prevent scope creep",
  "whoItServes": "string — the specific audience or end-user",
  "allowedClaims": ["string", ...],
  "forbiddenClaims": ["string", ...],
  "requiredEvidence": ["string", ...],
  "approvalAuthority": "string — who has authority to approve each stage",
  "presetStages": [
    { "number": 1, "key": "string", "title": "string", "description": "string" },
    ...7 stages total...
  ]
}

The presetStages array must contain exactly 7 entries corresponding to the stage definitions provided.`

export async function generateProjectCharter(
  intake: CbccProjectIntake
): Promise<CharterGenerationResult> {
  const client = getAnthropicClient()

  const userPrompt = JSON.stringify(
    {
      projectIntake: intake,
      stageDefinitions: CBCC_STAGE_DEFINITIONS,
    },
    null,
    2
  )

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
      system: SYSTEM_PROMPT,
    })

    const text = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, code: 'parse_error', message: 'Model response was not valid JSON' }
    }

    const charter = parsed as ProjectCharter

    const requiredFields: (keyof ProjectCharter)[] = [
      'whatThisIs',
      'whatThisIsNot',
      'whoItServes',
      'allowedClaims',
      'forbiddenClaims',
      'requiredEvidence',
      'approvalAuthority',
      'presetStages',
    ]

    for (const field of requiredFields) {
      if (charter[field] === undefined || charter[field] === null) {
        return {
          ok: false,
          code: 'invalid_shape',
          message: `Charter missing required field: ${field}`,
        }
      }
    }

    if (!Array.isArray(charter.presetStages) || charter.presetStages.length !== 7) {
      return {
        ok: false,
        code: 'invalid_shape',
        message: `Charter presetStages must be an array of exactly 7 entries, got ${Array.isArray(charter.presetStages) ? charter.presetStages.length : 'non-array'}`,
      }
    }

    return { ok: true, charter }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'api_error', message }
  }
}
