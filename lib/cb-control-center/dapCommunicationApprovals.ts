// Admin approval is not delivery.
// An approved communication is approved for future sending only.
// CB Control Center determines approval. MKCRM does not.
// No email sending, no MKCRM calls, no Supabase mutations in this module.

import { randomUUID } from 'crypto'

import type {
  DapCommunicationApprovalDecision,
  DapCommunicationApprovalStatus,
  DapCommunicationApprovalEventType,
  DapCommunicationApprovalActorType,
} from './dapCommunicationApprovalTypes'

import type { DapCommunicationDispatchEvent } from './dapCommunicationDispatchEventTypes'
import type { DapMkcrmDispatchShadowPayload }  from './mkcrm/dapMkcrmDispatchPayloadTypes'
import type { DapCommunicationType }           from './dapCommunicationDispatchEventTypes'

import {
  getAllDapPracticeDecisionDispatchEventPreviews,
  getAllDapMemberStatusDispatchEventPreviews,
} from './dapCommunicationDispatchEvents'

import {
  buildDapMkcrmDispatchShadowPayloadFromEvent,
  validateDapMkcrmDispatchShadowPayload,
} from './mkcrm/dapMkcrmDispatchPayloads'

// ─── Approvable event types ───────────────────────────────────────────────────

export const APPROVABLE_DISPATCH_EVENT_TYPES: ReadonlySet<string> = new Set([
  'dispatch_ready_for_review',
  'dispatch_approved_for_future_send',
])

// ─── Approval blocker codes ───────────────────────────────────────────────────

export type DapApprovalBlockerCode =
  | 'shadow_payload_invalid'
  | 'dispatch_event_not_eligible'

// ─── Default actor ────────────────────────────────────────────────────────────

const SYSTEM_ACTOR = { type: 'system' as DapCommunicationApprovalActorType, id: 'dap-approval-system' }

// ─── Options ──────────────────────────────────────────────────────────────────

export interface DapApprovalBuildOptions {
  communicationType?: DapCommunicationType
  approvalStatus?:    DapCommunicationApprovalStatus
  approvalEventType?: DapCommunicationApprovalEventType
  actor?:             { type: DapCommunicationApprovalActorType; id: string }
  createdAt?:         string
  approvalId?:        string
  notes?:             string
}

// ─── Runtime field reader (defense-in-depth) ──────────────────────────────────

function field(obj: unknown, key: string): unknown {
  return (obj as Record<string, unknown>)[key]
}

// ─── Shadow payload validator (returns true/false, does not throw) ────────────

function isShadowPayloadValid(payload: unknown): boolean {
  try {
    validateDapMkcrmDispatchShadowPayload(payload)
    return true
  } catch {
    return false
  }
}

// ─── Core builder ─────────────────────────────────────────────────────────────

export function buildDapCommunicationApprovalFromShadowPayload(
  dispatchEvent: DapCommunicationDispatchEvent,
  shadowPayload: DapMkcrmDispatchShadowPayload,
  options?:      DapApprovalBuildOptions,
): DapCommunicationApprovalDecision {
  const blockerCodes: DapApprovalBlockerCode[] = []

  const shadowValid = isShadowPayloadValid(shadowPayload)
  if (!shadowValid) blockerCodes.push('shadow_payload_invalid')

  const approvableEventType = APPROVABLE_DISPATCH_EVENT_TYPES.has(dispatchEvent.eventType)
  if (!dispatchEvent.eligibleForFutureDispatch || !approvableEventType) {
    blockerCodes.push('dispatch_event_not_eligible')
  }

  const eligibleForApproval = blockerCodes.length === 0

  const approvalStatus: DapCommunicationApprovalStatus =
    options?.approvalStatus ?? 'not_reviewed'

  let approvalEventType: DapCommunicationApprovalEventType
  if (options?.approvalEventType) {
    if (options.approvalEventType === 'approval_revoked') {
      throw new Error(
        `Use revokeDapCommunicationApproval() to create an 'approval_revoked' event — ` +
        `it requires previous approval context.`
      )
    }
    approvalEventType = options.approvalEventType
  } else {
    approvalEventType = 'approval_review_started'
  }

  return {
    approvalId:           options?.approvalId   ?? randomUUID(),
    verticalKey:          'dap',
    communicationType:    options?.communicationType ?? dispatchEvent.communicationType,
    templateKey:          dispatchEvent.templateKey,
    audience:             dispatchEvent.audience,
    channel:              dispatchEvent.channel,
    approvalStatus,
    approvalEventType,
    eligibleForApproval,
    approvalBlockerCodes: [...blockerCodes],
    readinessStatus:      dispatchEvent.readinessStatus,
    dispatchEventType:    dispatchEvent.eventType,
    shadowPayloadValid:   shadowValid,
    source: {
      ...dispatchEvent.source,
    },
    actor: options?.actor ?? SYSTEM_ACTOR,
    delivery: {
      deliveryDisabled:      true,
      externalSendDisabled:  true,
      mkcrmDeliveryDisabled: true,
      resendDisabled:        true,
    },
    safety: {
      noPhi:            true,
      noPaymentCta:     true,
      noEmailBody:      true,
      noStoredStanding: true,
    },
    createdAt: options?.createdAt ?? new Date().toISOString(),
    ...(options?.notes ? { notes: options.notes } : {}),
  }
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export function approveDapCommunicationForFutureSend(
  dispatchEvent: DapCommunicationDispatchEvent,
  shadowPayload: DapMkcrmDispatchShadowPayload,
  options?:      Omit<DapApprovalBuildOptions, 'approvalStatus' | 'approvalEventType'>,
): DapCommunicationApprovalDecision {
  if (!dispatchEvent.eligibleForFutureDispatch) {
    throw new Error(
      `Cannot approve '${dispatchEvent.templateKey}': eligibleForFutureDispatch is false. ` +
      `Blocker codes: ${dispatchEvent.blockerCodes.join(', ') || 'none'}`
    )
  }
  if (!APPROVABLE_DISPATCH_EVENT_TYPES.has(dispatchEvent.eventType)) {
    throw new Error(
      `Cannot approve '${dispatchEvent.templateKey}': eventType '${dispatchEvent.eventType}' ` +
      `is not in APPROVABLE_DISPATCH_EVENT_TYPES.`
    )
  }
  if (!isShadowPayloadValid(shadowPayload)) {
    throw new Error(
      `Cannot approve '${dispatchEvent.templateKey}': shadow payload failed validation.`
    )
  }
  return buildDapCommunicationApprovalFromShadowPayload(dispatchEvent, shadowPayload, {
    ...options,
    approvalStatus:    'approved_for_future_send',
    approvalEventType: 'approval_granted_for_future_send',
  })
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export function rejectDapCommunicationForFutureSend(
  dispatchEvent: DapCommunicationDispatchEvent,
  shadowPayload: DapMkcrmDispatchShadowPayload,
  options?:      Omit<DapApprovalBuildOptions, 'approvalStatus' | 'approvalEventType'>,
): DapCommunicationApprovalDecision {
  return buildDapCommunicationApprovalFromShadowPayload(dispatchEvent, shadowPayload, {
    ...options,
    approvalStatus:    'rejected_for_future_send',
    approvalEventType: 'approval_rejected_for_future_send',
  })
}

// ─── Revoke ───────────────────────────────────────────────────────────────────

export function revokeDapCommunicationApproval(
  previousApproval: DapCommunicationApprovalDecision,
  options?:         Pick<DapApprovalBuildOptions, 'actor' | 'createdAt' | 'approvalId' | 'notes'>,
): DapCommunicationApprovalDecision {
  if (field(previousApproval, 'approvalStatus') !== 'approved_for_future_send') {
    throw new Error(
      `Cannot revoke approval for '${previousApproval.templateKey}': ` +
      `approvalStatus is '${previousApproval.approvalStatus}', expected 'approved_for_future_send'.`
    )
  }
  return {
    approvalId:           options?.approvalId   ?? randomUUID(),
    verticalKey:          'dap',
    communicationType:    previousApproval.communicationType,
    templateKey:          previousApproval.templateKey,
    audience:             previousApproval.audience,
    channel:              previousApproval.channel,
    approvalStatus:       'approval_revoked',
    approvalEventType:    'approval_revoked',
    eligibleForApproval:  false,
    approvalBlockerCodes: [],
    readinessStatus:      previousApproval.readinessStatus,
    dispatchEventType:    previousApproval.dispatchEventType,
    shadowPayloadValid:   previousApproval.shadowPayloadValid,
    source:               { ...previousApproval.source },
    actor:                options?.actor ?? SYSTEM_ACTOR,
    delivery: {
      deliveryDisabled:      true,
      externalSendDisabled:  true,
      mkcrmDeliveryDisabled: true,
      resendDisabled:        true,
    },
    safety: {
      noPhi:            true,
      noPaymentCta:     true,
      noEmailBody:      true,
      noStoredStanding: true,
    },
    createdAt: options?.createdAt ?? new Date().toISOString(),
    ...(options?.notes ? { notes: options.notes } : {}),
  }
}

// ─── Bulk preview generators ──────────────────────────────────────────────────

export function getAllDapPracticeDecisionCommunicationApprovalPreviews(): DapCommunicationApprovalDecision[] {
  return getAllDapPracticeDecisionDispatchEventPreviews().map(event => {
    const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    return buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload, {
      communicationType: 'practice_decision_email',
    })
  })
}

export function getAllDapMemberStatusCommunicationApprovalPreviews(): DapCommunicationApprovalDecision[] {
  return getAllDapMemberStatusDispatchEventPreviews().map(event => {
    const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    return buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload, {
      communicationType: 'member_status_email',
    })
  })
}
