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

// Codes that represent expected non-error outcomes (repeated clicks, stale ids).
// These redirect gracefully rather than throwing — no misleading error state, no duplicate events.
const GRACEFUL_CODES = new Set(['invalid_transition', 'request_not_found'])

function handleResult(
  ok: boolean,
  code: string | undefined,
  message: string | undefined,
  actionName: string,
): void {
  if (!ok && code && !GRACEFUL_CODES.has(code)) {
    throw new Error(`[${code}] ${message ?? actionName + ' failed'}`)
  }
  // invalid_transition and request_not_found: fall through to redirect below
}

export async function approveRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await approveDapRequest({ requestId, note })
  handleResult(result.ok, result.ok ? undefined : result.code, result.ok ? undefined : result.message, 'approveDapRequest')

  revalidatePath(LIST_PATH)
  revalidatePath(`${DETAIL_BASE}/${requestId}`)
  redirect(`${DETAIL_BASE}/${requestId}`)
}

export async function rejectRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await rejectDapRequest({ requestId, note })
  handleResult(result.ok, result.ok ? undefined : result.code, result.ok ? undefined : result.message, 'rejectDapRequest')

  revalidatePath(LIST_PATH)
  revalidatePath(`${DETAIL_BASE}/${requestId}`)
  redirect(`${DETAIL_BASE}/${requestId}`)
}

export async function needsReviewRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await markDapRequestNeedsReview({ requestId, note })
  handleResult(result.ok, result.ok ? undefined : result.code, result.ok ? undefined : result.message, 'markDapRequestNeedsReview')

  revalidatePath(LIST_PATH)
  revalidatePath(`${DETAIL_BASE}/${requestId}`)
  redirect(`${DETAIL_BASE}/${requestId}`)
}
