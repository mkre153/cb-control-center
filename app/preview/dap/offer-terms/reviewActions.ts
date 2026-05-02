'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DapOfferTermsReviewCriteria } from '@/lib/dap/registry/dapOfferTermsReviewTypes'
import {
  startOfferTermsReview,
  passOfferTermsReview,
  failOfferTermsReview,
  requestOfferTermsClarification,
  addOfferTermsReviewNote,
} from '@/lib/cb-control-center/dapOfferTermsReview'

const OFFER_TERMS_LIST_PATH = '/preview/dap/offer-terms'

const GRACEFUL_CODES = new Set([
  'invalid_transition',
  'draft_not_found',
  'review_not_found',
  'review_already_exists',
])

function draftDetailPath(draftId: string): string {
  return `${OFFER_TERMS_LIST_PATH}/${draftId}`
}

function parseCriteria(formData: FormData): DapOfferTermsReviewCriteria {
  return {
    planNamePresent:          formData.get('planNamePresent')          === 'on',
    annualFeePresent:         formData.get('annualFeePresent')         === 'on',
    preventiveCareDefined:    formData.get('preventiveCareDefined')    === 'on',
    discountTermsDefined:     formData.get('discountTermsDefined')     === 'on',
    exclusionsDefined:        formData.get('exclusionsDefined')        === 'on',
    cancellationTermsDefined: formData.get('cancellationTermsDefined') === 'on',
    renewalTermsDefined:      formData.get('renewalTermsDefined')      === 'on',
    reviewerNotes:            (formData.get('reviewerNotes') as string) || undefined,
  }
}

// ─── startOfferTermsReviewAction ──────────────────────────────────────────────

export async function startOfferTermsReviewAction(formData: FormData): Promise<void> {
  const draftId = formData.get('draftId') as string
  const note    = (formData.get('note') as string | null)?.trim() || undefined

  const result = await startOfferTermsReview({ draftId, note })

  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(draftDetailPath(draftId))
}

// ─── passOfferTermsReviewAction ───────────────────────────────────────────────

export async function passOfferTermsReviewAction(formData: FormData): Promise<void> {
  const draftId  = formData.get('draftId') as string
  const reviewId = formData.get('reviewId') as string
  const note     = (formData.get('note') as string | null)?.trim() || undefined
  const criteria = parseCriteria(formData)

  const result = await passOfferTermsReview({ reviewId, draftId, criteria, note })

  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(draftDetailPath(draftId))
}

// ─── failOfferTermsReviewAction ───────────────────────────────────────────────

export async function failOfferTermsReviewAction(formData: FormData): Promise<void> {
  const draftId  = formData.get('draftId') as string
  const reviewId = formData.get('reviewId') as string
  const note     = (formData.get('note') as string | null)?.trim() || undefined
  const criteria = parseCriteria(formData)

  const result = await failOfferTermsReview({ reviewId, draftId, criteria, note })

  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(draftDetailPath(draftId))
}

// ─── requestOfferTermsClarificationAction ─────────────────────────────────────

export async function requestOfferTermsClarificationAction(formData: FormData): Promise<void> {
  const draftId  = formData.get('draftId') as string
  const reviewId = formData.get('reviewId') as string
  const note     = (formData.get('note') as string | null)?.trim() || undefined
  const criteria = parseCriteria(formData)

  const result = await requestOfferTermsClarification({ reviewId, draftId, criteria, note })

  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(draftDetailPath(draftId))
}

// ─── addOfferTermsReviewNoteAction ────────────────────────────────────────────

export async function addOfferTermsReviewNoteAction(formData: FormData): Promise<void> {
  const draftId  = formData.get('draftId') as string
  const reviewId = formData.get('reviewId') as string
  const note     = (formData.get('note') as string | null)?.trim() || undefined

  const result = await addOfferTermsReviewNote({ reviewId, draftId, note })

  revalidatePath(OFFER_TERMS_LIST_PATH)
  revalidatePath(draftDetailPath(draftId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(draftDetailPath(draftId))
}
