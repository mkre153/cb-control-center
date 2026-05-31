'use server'

import { revalidatePath } from 'next/cache'
import { activateRecipe } from './prcPlatform'

export type ActivateResult =
  | { ok: true; slug: string }
  | { ok: false; message: string }

/**
 * Approve + activate a gated recipe draft from the dashboard.
 * This is the human-in-the-loop gesture: the draft has already passed the
 * adversarial verify gate (active=false); a person reviews it and flips it live.
 * Live on premiumroast.coffee via ISR — no deploy needed.
 */
export async function activateRecipeAction(slug: string): Promise<ActivateResult> {
  const trimmed = slug?.trim()
  if (!trimmed) return { ok: false, message: 'Missing recipe slug' }
  try {
    const changed = await activateRecipe(trimmed)
    if (changed === 0) {
      return { ok: false, message: 'No draft found for that slug (already active, or removed).' }
    }
    revalidatePath('/platform')
    return { ok: true, slug: trimmed }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Activation failed' }
  }
}
