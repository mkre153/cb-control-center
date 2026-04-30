'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  markOutreachNeeded,
  markOutreachStarted,
  recordPracticeResponded,
  markPracticeInterested,
  markPracticeNotInterested,
  markTermsNeeded,
  addOnboardingNote,
} from '@/lib/cb-control-center/dapPracticeOnboardingActions'

const ONBOARDING_LIST_PATH = '/preview/dap/onboarding'

const GRACEFUL_CODES = new Set(['invalid_transition', 'intake_not_found'])

function intakeDetailPath(intakeId: string): string {
  return `${ONBOARDING_LIST_PATH}/${intakeId}`
}

async function handleOnboardingAction(
  formData: FormData,
  actionFn: (input: { intakeId: string; note?: string }) => Promise<{ ok: boolean; code?: string }>,
): Promise<void> {
  const intakeId = formData.get('intakeId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined
  const requestId = formData.get('requestId') as string | null

  const result = await actionFn({ intakeId, note })

  if (!result.ok && !GRACEFUL_CODES.has((result as { code?: string }).code ?? '')) {
    throw new Error(`Onboarding action failed`)
  }

  revalidatePath(ONBOARDING_LIST_PATH)
  revalidatePath(intakeDetailPath(intakeId))
  if (requestId) {
    revalidatePath(`/preview/dap/requests/${requestId}`)
  }
  redirect(intakeDetailPath(intakeId))
}

export async function markOutreachNeededAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, markOutreachNeeded)
}

export async function markOutreachStartedAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, markOutreachStarted)
}

export async function recordPracticeRespondedAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, recordPracticeResponded)
}

export async function markPracticeInterestedAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, markPracticeInterested)
}

export async function markPracticeNotInterestedAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, markPracticeNotInterested)
}

export async function markTermsNeededAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, markTermsNeeded)
}

export async function addOnboardingNoteAction(formData: FormData): Promise<void> {
  return handleOnboardingAction(formData, addOnboardingNote)
}
