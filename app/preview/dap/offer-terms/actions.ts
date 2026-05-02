'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DapOfferTermsDraftFields } from '@/lib/dap/registry/dapOfferTermsTypes'
import {
  createOfferTermsDraftFromOnboarding,
  updateOfferTermsDraft,
  submitOfferTermsDraftForReview,
  markOfferTermsDraftNeedsClarification,
  markOfferTermsDraftCollecting,
  addOfferTermsNote,
} from '@/lib/cb-control-center/dapOfferTerms'

const OFFER_TERMS_LIST_PATH  = '/preview/dap/offer-terms'
const ONBOARDING_DETAIL_BASE = '/preview/dap/onboarding'

const GRACEFUL_CODES = new Set(['invalid_transition', 'draft_not_found', 'draft_already_exists'])

function draftDetailPath(draftId: string): string {
  return `${OFFER_TERMS_LIST_PATH}/${draftId}`
}

function onboardingDetailPath(intakeId: string): string {
  return `${ONBOARDING_DETAIL_BASE}/${intakeId}`
}

// ─── createOfferTermsDraftAction ──────────────────────────────────────────────

export async function createOfferTermsDraftAction(formData: FormData): Promise<void> {
  const onboardingIntakeId = formData.get('onboardingIntakeId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await createOfferTermsDraftFromOnboarding({ onboardingIntakeId, note })

  revalidatePath(onboardingDetailPath(onboardingIntakeId))
  revalidatePath(OFFER_TERMS_LIST_PATH)

  if (!result.ok) {
    if (result.code === 'draft_already_exists') {
      redirect(onboardingDetailPath(onboardingIntakeId))
    }
    throw new Error(`[${result.code}] ${result.message}`)
  }

  revalidatePath(draftDetailPath(result.draft.id))
  redirect(draftDetailPath(result.draft.id))
}

// ─── updateOfferTermsDraftAction ──────────────────────────────────────────────

export async function updateOfferTermsDraftAction(formData: FormData): Promise<void> {
  const draftId            = formData.get('draftId') as string
  const onboardingIntakeId = formData.get('onboardingIntakeId') as string | null
  const note               = (formData.get('note') as string | null)?.trim() || undefined

  const parseNum = (key: string): number | undefined => {
    const v = formData.get(key) as string | null
    if (!v || v.trim() === '') return undefined
    const n = parseFloat(v)
    return isNaN(n) ? undefined : n
  }

  const parseExcluded = (key: string): string[] | undefined => {
    const v = formData.get(key) as string | null
    if (!v || v.trim() === '') return undefined
    return v.split('\n').map(s => s.trim()).filter(Boolean)
  }

  const fields: DapOfferTermsDraftFields = {
    planName:                (formData.get('planName') as string) || undefined,
    annualMembershipFee:     parseNum('annualMembershipFee'),
    includedCleaningsPerYear: parseNum('includedCleaningsPerYear'),
    includedExamsPerYear:    parseNum('includedExamsPerYear'),
    includedXraysPerYear:    parseNum('includedXraysPerYear'),
    preventiveCareSummary:   (formData.get('preventiveCareSummary') as string) || undefined,
    discountPercentage:      parseNum('discountPercentage'),
    excludedServices:        parseExcluded('excludedServices'),
    waitingPeriod:           (formData.get('waitingPeriod') as string) || undefined,
    cancellationTerms:       (formData.get('cancellationTerms') as string) || undefined,
    renewalTerms:            (formData.get('renewalTerms') as string) || undefined,
    notes:                   (formData.get('fieldNotes') as string) || undefined,
  }

  const result = await updateOfferTermsDraft({ draftId, fields, note })

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  if (onboardingIntakeId) revalidatePath(onboardingDetailPath(onboardingIntakeId))
  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))
  redirect(draftDetailPath(draftId))
}

// ─── submitOfferTermsDraftForReviewAction ─────────────────────────────────────

export async function submitOfferTermsDraftForReviewAction(formData: FormData): Promise<void> {
  const draftId            = formData.get('draftId') as string
  const onboardingIntakeId = formData.get('onboardingIntakeId') as string | null
  const note               = (formData.get('note') as string | null)?.trim() || undefined

  const result = await submitOfferTermsDraftForReview({ draftId, note })

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  if (onboardingIntakeId) revalidatePath(onboardingDetailPath(onboardingIntakeId))
  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))
  redirect(draftDetailPath(draftId))
}

// ─── markOfferTermsDraftNeedsClarificationAction ──────────────────────────────

export async function markOfferTermsDraftNeedsClarificationAction(
  formData: FormData,
): Promise<void> {
  const draftId            = formData.get('draftId') as string
  const onboardingIntakeId = formData.get('onboardingIntakeId') as string | null
  const note               = (formData.get('note') as string | null)?.trim() || undefined

  const result = await markOfferTermsDraftNeedsClarification({ draftId, note })

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  if (onboardingIntakeId) revalidatePath(onboardingDetailPath(onboardingIntakeId))
  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))
  redirect(draftDetailPath(draftId))
}

// ─── markOfferTermsDraftCollectingAction ──────────────────────────────────────

export async function markOfferTermsDraftCollectingAction(formData: FormData): Promise<void> {
  const draftId            = formData.get('draftId') as string
  const onboardingIntakeId = formData.get('onboardingIntakeId') as string | null
  const note               = (formData.get('note') as string | null)?.trim() || undefined

  const result = await markOfferTermsDraftCollecting({ draftId, note })

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  if (onboardingIntakeId) revalidatePath(onboardingDetailPath(onboardingIntakeId))
  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))
  redirect(draftDetailPath(draftId))
}

// ─── addOfferTermsNoteAction ──────────────────────────────────────────────────

export async function addOfferTermsNoteAction(formData: FormData): Promise<void> {
  const draftId            = formData.get('draftId') as string
  const onboardingIntakeId = formData.get('onboardingIntakeId') as string | null
  const note               = (formData.get('note') as string | null)?.trim() || undefined

  const result = await addOfferTermsNote({ draftId, note })

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  if (onboardingIntakeId) revalidatePath(onboardingDetailPath(onboardingIntakeId))
  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))
  redirect(draftDetailPath(draftId))
}
