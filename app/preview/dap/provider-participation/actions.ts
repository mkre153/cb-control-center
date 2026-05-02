'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DapProviderParticipationFields } from '@/lib/dap/registry/dapProviderParticipationTypes'
import {
  startProviderParticipationConfirmation,
  markAgreementSent,
  markAgreementReceived,
  confirmProviderParticipation,
  declineProviderParticipation,
  voidProviderParticipationConfirmation,
  addProviderParticipationNote,
  updateProviderParticipationFields,
} from '@/lib/cb-control-center/dapProviderParticipation'

const PARTICIPATION_LIST_PATH = '/preview/dap/provider-participation'
const OFFER_TERMS_BASE        = '/preview/dap/offer-terms'

const GRACEFUL_CODES = new Set([
  'invalid_transition',
  'confirmation_not_found',
  'confirmation_already_exists',
  'review_not_found',
])

function participationDetailPath(confirmationId: string): string {
  return `${PARTICIPATION_LIST_PATH}/${confirmationId}`
}

function offerTermsDetailPath(draftId: string): string {
  return `${OFFER_TERMS_BASE}/${draftId}`
}

function parseFields(formData: FormData): DapProviderParticipationFields {
  const str = (key: string): string | undefined => {
    const v = formData.get(key) as string | null
    return v?.trim() || undefined
  }
  return {
    agreementSentAt:      str('agreementSentAt'),
    agreementReceivedAt:  str('agreementReceivedAt'),
    signerName:           str('signerName'),
    signerTitle:          str('signerTitle'),
    signerEmail:          str('signerEmail'),
    agreementVersion:     str('agreementVersion'),
    agreementDocumentUrl: str('agreementDocumentUrl'),
    confirmationNotes:    str('confirmationNotes'),
  }
}

// ─── startProviderParticipationConfirmationAction ─────────────────────────────

export async function startProviderParticipationConfirmationAction(
  formData: FormData,
): Promise<void> {
  const reviewId = formData.get('reviewId') as string
  const draftId  = formData.get('draftId')  as string
  const note     = (formData.get('note') as string | null)?.trim() || undefined

  const result = await startProviderParticipationConfirmation({ reviewId, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)

  if (!result.ok) {
    if (GRACEFUL_CODES.has(result.code)) {
      redirect(draftId ? offerTermsDetailPath(draftId) : PARTICIPATION_LIST_PATH)
    }
    throw new Error(`[${result.code}] ${result.message}`)
  }

  revalidatePath(participationDetailPath(result.confirmation.id))
  redirect(participationDetailPath(result.confirmation.id))
}

// ─── markAgreementSentAction ──────────────────────────────────────────────────

export async function markAgreementSentAction(formData: FormData): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined
  const fields         = parseFields(formData)

  const result = await markAgreementSent({ confirmationId, reviewId, fields, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}

// ─── markAgreementReceivedAction ──────────────────────────────────────────────

export async function markAgreementReceivedAction(formData: FormData): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined
  const fields         = parseFields(formData)

  const result = await markAgreementReceived({ confirmationId, reviewId, fields, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}

// ─── confirmProviderParticipationAction ───────────────────────────────────────

export async function confirmProviderParticipationAction(formData: FormData): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined
  const fields         = parseFields(formData)

  const result = await confirmProviderParticipation({ confirmationId, reviewId, fields, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}

// ─── declineProviderParticipationAction ───────────────────────────────────────

export async function declineProviderParticipationAction(formData: FormData): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined

  const result = await declineProviderParticipation({ confirmationId, reviewId, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}

// ─── voidProviderParticipationConfirmationAction ──────────────────────────────

export async function voidProviderParticipationConfirmationAction(
  formData: FormData,
): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined

  const result = await voidProviderParticipationConfirmation({ confirmationId, reviewId, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}

// ─── addProviderParticipationNoteAction ───────────────────────────────────────

export async function addProviderParticipationNoteAction(formData: FormData): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined

  const result = await addProviderParticipationNote({ confirmationId, reviewId, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}

// ─── updateProviderParticipationFieldsAction ──────────────────────────────────

export async function updateProviderParticipationFieldsAction(
  formData: FormData,
): Promise<void> {
  const confirmationId = formData.get('confirmationId') as string
  const reviewId       = formData.get('reviewId')       as string
  const draftId        = formData.get('draftId')        as string | null
  const note           = (formData.get('note') as string | null)?.trim() || undefined
  const fields         = parseFields(formData)

  const result = await updateProviderParticipationFields({ confirmationId, reviewId, fields, note })

  if (draftId) revalidatePath(offerTermsDetailPath(draftId))
  revalidatePath(PARTICIPATION_LIST_PATH)
  revalidatePath(participationDetailPath(confirmationId))

  if (!result.ok && !GRACEFUL_CODES.has(result.code)) {
    throw new Error(`[${result.code}] ${result.message}`)
  }

  redirect(participationDetailPath(confirmationId))
}
