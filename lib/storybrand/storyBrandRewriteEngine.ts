// StoryBrand Rewrite Engine
//
// Transforms raw content from the Content Engine into StoryBrand-shaped
// messaging: customer as hero, guide as business, villain named, plan given,
// CTA clear, success and failure both present.
//
// Integration flow:
//   Content Engine → rawContent → storyBrandRewriteEngine() → StoryBrandRewriteOutput
//   → homepage / landing page / email / ad / brief builder

import { getAnthropicClient } from '../cb-control-center/anthropicClient'
import {
  buildStoryBrandRewritePrompt,
  STORYBRAND_SYSTEM_PROMPT,
} from './storyBrandRewritePrompt'
import {
  validateStoryBrandRewrite,
  isStoryBrandRewriteOutput,
} from './storyBrandRewriteValidation'
import type {
  StoryBrandRewriteInput,
  StoryBrandRewriteOutput,
  StoryBrandRewriteResult,
} from './storyBrandRewriteTypes'

export async function storyBrandRewriteEngine(
  input: StoryBrandRewriteInput,
): Promise<StoryBrandRewriteResult> {
  const client = getAnthropicClient()
  const userPrompt = buildStoryBrandRewritePrompt(input)

  let text: string
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: STORYBRAND_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: string; text: string }).text)
      .join('')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'api_error', message }
  }

  let parsed: unknown
  try {
    // Strip markdown code fences if the model wrapped its JSON.
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return { ok: false, code: 'parse_error', message: 'Model response was not valid JSON' }
  }

  if (!isStoryBrandRewriteOutput(parsed)) {
    return {
      ok: false,
      code: 'invalid_shape',
      message: 'Model response did not match the required StoryBrandRewriteOutput shape',
    }
  }

  const output = parsed as StoryBrandRewriteOutput

  const validation = validateStoryBrandRewrite(output, {
    forbiddenClaims: input.forbiddenClaims,
    requiredDisclaimers: input.requiredDisclaimers,
  })

  if (!validation.valid) {
    return {
      ok: false,
      code: 'validation_failed',
      message: `StoryBrand validation failed: ${validation.errors.join('; ')}`,
    }
  }

  return { ok: true, output }
}

// Re-export as alias per directive.
export { storyBrandRewriteEngine as rewriteWithStoryBrand }
