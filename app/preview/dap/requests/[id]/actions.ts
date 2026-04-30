'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  approveDapRequest,
  rejectDapRequest,
  markDapRequestNeedsReview,
} from '@/lib/cb-control-center/dapRequestActions'

const LIST_PATH   = '/preview/dap/requests'
const DETAIL_BASE = '/preview/dap/requests'

export async function approveRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await approveDapRequest({ requestId, note })
  if (!result.success) throw new Error(result.error ?? 'approveDapRequest failed')

  revalidatePath(LIST_PATH)
  revalidatePath(`${DETAIL_BASE}/${requestId}`)
  redirect(`${DETAIL_BASE}/${requestId}`)
}

export async function rejectRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await rejectDapRequest({ requestId, note })
  if (!result.success) throw new Error(result.error ?? 'rejectDapRequest failed')

  revalidatePath(LIST_PATH)
  revalidatePath(`${DETAIL_BASE}/${requestId}`)
  redirect(`${DETAIL_BASE}/${requestId}`)
}

export async function needsReviewRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await markDapRequestNeedsReview({ requestId, note })
  if (!result.success) throw new Error(result.error ?? 'markDapRequestNeedsReview failed')

  revalidatePath(LIST_PATH)
  revalidatePath(`${DETAIL_BASE}/${requestId}`)
  redirect(`${DETAIL_BASE}/${requestId}`)
}
