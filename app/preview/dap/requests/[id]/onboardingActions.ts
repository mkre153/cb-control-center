'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOnboardingIntakeFromApprovedRequest } from '@/lib/cb-control-center/dapPracticeOnboarding'

const ONBOARDING_LIST_PATH = '/preview/dap/onboarding'
const REQUEST_DETAIL_BASE  = '/preview/dap/requests'

export async function createOnboardingFromRequestAction(formData: FormData): Promise<void> {
  const requestId = formData.get('requestId') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const result = await createOnboardingIntakeFromApprovedRequest({ requestId, note })

  if (!result.ok && result.code !== 'intake_already_exists') {
    throw new Error(`[${result.code}] ${result.message}`)
  }
  // intake_already_exists is graceful — redirect back without error

  revalidatePath(`${REQUEST_DETAIL_BASE}/${requestId}`)
  revalidatePath(ONBOARDING_LIST_PATH)
  redirect(`${REQUEST_DETAIL_BASE}/${requestId}`)
}
