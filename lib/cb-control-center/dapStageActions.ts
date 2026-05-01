'use server'

// Server actions for the engine-backed DAP path.
//
// approveDapStageAction(stageNumber, approvedBy, notes?)
//   1. Validates inputs at the boundary.
//   2. Loads the current persisted approvals.
//   3. Asks the generic engine whether this stage is currently unlocked
//      (predecessor must be approved — same rule for everyone).
//   4. Persists the approval via DapStageApprovalStore.
//   5. Revalidates the affected routes so refresh sees the new state.
//
// Rules enforced:
//   - decidedBy is required (no anonymous approvals).
//   - Stage must be unlocked per engine locking rules.
//   - Stage must not already be approved (idempotent reject; surfaces a
//     clear message instead of double-writing).
//   - AI review code paths cannot reach this action — there is no path
//     from any AI module into this file. Tests assert engine surface has
//     no approve/unlock/persist API.

import { revalidatePath } from 'next/cache'
import { isStageLocked } from '@/lib/cbcc/index'
import {
  DAP_PROJECT,
  DAP_PROJECT_SLUG,
  DAP_STAGE_DEFINITIONS,
} from '@/lib/cbcc/adapters/dap'
import {
  getDapStageApprovalStore,
  type DapStageApproval,
  type DapStageApprovalStore,
} from './dapStageApprovalStore'
import {
  buildDapEffectiveProject,
} from './dapStageStateResolver'

export type ApproveDapStageResult =
  | { ok: true; approval: DapStageApproval }
  | { ok: false; code: string; message: string }

export interface ApproveDapStageInput {
  stageNumber: number
  approvedBy: string
  notes?: string
}

// Pure-logic core; UI calls the named server action below which delegates
// here so we can unit-test the validation/locking/double-approve paths
// against an in-memory store.
export async function approveDapStage(
  input: ApproveDapStageInput,
  store: DapStageApprovalStore = getDapStageApprovalStore(),
  now: string = new Date().toISOString(),
): Promise<ApproveDapStageResult> {
  const { stageNumber, approvedBy, notes } = input

  if (!Number.isInteger(stageNumber) || stageNumber < 1 || stageNumber > 7) {
    return { ok: false, code: 'invalid_stage', message: `stageNumber must be 1–7, got ${stageNumber}` }
  }
  const trimmedBy = approvedBy?.trim() ?? ''
  if (!trimmedBy) {
    return { ok: false, code: 'missing_approved_by', message: 'approvedBy is required' }
  }

  const def = DAP_STAGE_DEFINITIONS.find(d => d.order === stageNumber)
  if (!def) {
    return { ok: false, code: 'unknown_stage', message: `Stage ${stageNumber} is not defined in the DAP adapter` }
  }

  const persisted = await store.list()

  // Reject double-approval — engine's applyStageApproval would as well, but
  // this gives us a cleaner UI message.
  if (persisted.some(p => p.stageNumber === stageNumber && p.approved)) {
    return {
      ok: false,
      code: 'already_approved',
      message: `Stage ${stageNumber} is already approved (by ${persisted.find(p => p.stageNumber === stageNumber)?.approvedBy ?? 'unknown'})`,
    }
  }

  // Engine locking check: build an effective project where persisted approvals
  // overlay the static baseline, then ask isStageLocked.
  const effectiveProject = buildDapEffectiveProject(DAP_PROJECT, persisted)
  if (isStageLocked(effectiveProject, def.id)) {
    return {
      ok: false,
      code: 'stage_locked',
      message: `Stage ${stageNumber} is locked — predecessor not yet approved`,
    }
  }

  const approval = await store.approve({
    stageNumber,
    approvedBy: trimmedBy,
    notes,
    now,
  })

  return { ok: true, approval }
}

// Server action invoked from the form on the stage detail page. Wraps the
// pure helper above and revalidates the affected routes.
export async function approveDapStageAction(
  prevState: ApproveDapStageResult | null,
  formData: FormData,
): Promise<ApproveDapStageResult> {
  void prevState
  const stageNumberRaw = formData.get('stageNumber')
  const approvedBy = (formData.get('approvedBy') as string | null)?.trim() ?? ''
  const notes = (formData.get('notes') as string | null)?.trim() || undefined

  const stageNumber = Number(stageNumberRaw)
  const result = await approveDapStage({ stageNumber, approvedBy, notes })

  if (result.ok) {
    revalidatePath(`/projects/${DAP_PROJECT_SLUG}`)
    revalidatePath(`/projects/${DAP_PROJECT_SLUG}/stages/${stageNumber}`)
    if (stageNumber < 7) {
      revalidatePath(`/projects/${DAP_PROJECT_SLUG}/stages/${stageNumber + 1}`)
    }
    revalidatePath('/')
  }

  return result
}
