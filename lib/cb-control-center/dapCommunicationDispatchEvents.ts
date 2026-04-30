// Dispatch events are append-only. No update. No delete. No overwrite.
// Events record decisions. They do not execute sends.
// CB Control Center is the dispatch authority. MKCRM is not.
// No email sending, no MKCRM calls, no Supabase mutations in this module.

import { randomUUID } from 'crypto'

import type {
  DapCommunicationDispatchEvent,
  DapCommunicationType,
  DapCommunicationDispatchEventType,
  DapCommunicationDispatchActorType,
} from './dapCommunicationDispatchEventTypes'

import type { DapCommunicationDispatchReadiness } from './dapCommunicationDispatchTypes'
import type { DapPracticeDecisionEmailTemplateKey } from './dapPracticeDecisionEmailTypes'
import type { DapMemberStatusEmailTemplateKey }     from './dapMemberStatusEmailTypes'

import {
  getDapPracticeDecisionEmailDispatchReadiness,
  getAllDapPracticeDecisionEmailDispatchReadiness,
  getDapMemberStatusEmailDispatchReadiness,
  getAllDapMemberStatusEmailDispatchReadiness,
} from './dapCommunicationDispatchReadiness'

import { getDapPracticeDecisionEmailPreview }  from './dapPracticeDecisionEmailPreview'
import { getAllDapMemberStatusEmailPreviews }   from './dapMemberStatusEmailPreview'

// ─── Event types that require eligible readiness ──────────────────────────────

const ELIGIBLE_ONLY: ReadonlySet<DapCommunicationDispatchEventType> = new Set([
  'dispatch_approved_for_future_send',
  'dispatch_shadow_payload_created',
])

// ─── Default actor ────────────────────────────────────────────────────────────

const SYSTEM_ACTOR = { type: 'system' as DapCommunicationDispatchActorType, id: 'dap-dispatch-system' }

// ─── Options ──────────────────────────────────────────────────────────────────

export interface DapDispatchEventBuildOptions {
  communicationType: DapCommunicationType
  eventType?:        DapCommunicationDispatchEventType
  actor?:            { type: DapCommunicationDispatchActorType; id: string }
  createdAt?:        string
  eventId?:          string
}

// ─── Core builder ─────────────────────────────────────────────────────────────

export function buildDapDispatchEventFromReadiness(
  readiness: DapCommunicationDispatchReadiness,
  options:   DapDispatchEventBuildOptions,
): DapCommunicationDispatchEvent {
  const { communicationType, actor, createdAt, eventId } = options

  // Derive event type from readiness unless explicitly overridden
  let eventType: DapCommunicationDispatchEventType
  if (options.eventType) {
    if (ELIGIBLE_ONLY.has(options.eventType) && !readiness.eligibleForFutureDispatch) {
      throw new Error(
        `Event type '${options.eventType}' requires eligibleForFutureDispatch: true. ` +
        `Current readiness status: '${readiness.status}'.`
      )
    }
    eventType = options.eventType
  } else {
    eventType = readiness.eligibleForFutureDispatch
      ? 'dispatch_ready_for_review'
      : 'dispatch_blocked'
  }

  return {
    eventId:                   eventId ?? randomUUID(),
    verticalKey:               'dap',
    communicationType,
    templateKey:               readiness.templateKey,
    audience:                  readiness.audience,
    channel:                   readiness.channel,
    eventType,
    readinessStatus:           readiness.status,
    eligibleForFutureDispatch: readiness.eligibleForFutureDispatch,
    blockerCodes:              readiness.blockers.map(b => b.code),
    source: {
      decisionAuthority: 'cb_control_center',
      crmAuthority:      false,
      paymentAuthority:  false,
      ...(readiness.source.billingSource
        ? { billingSource: readiness.source.billingSource }
        : {}),
    },
    actor:    actor ?? SYSTEM_ACTOR,
    createdAt: createdAt ?? new Date().toISOString(),
    metadata: {
      externalSendDisabled:  true,
      mkcrmDeliveryDisabled: true,
      resendDisabled:        true,
      noPhi:                 true,
      noPaymentCta:          true,
    },
  }
}

// ─── Practice decision convenience builder ────────────────────────────────────

export function buildDapPracticeDecisionDispatchEvent(
  templateKey: DapPracticeDecisionEmailTemplateKey,
  eventType:   DapCommunicationDispatchEventType,
  options?:    Omit<DapDispatchEventBuildOptions, 'communicationType' | 'eventType'>,
): DapCommunicationDispatchEvent {
  const readiness = getDapPracticeDecisionEmailDispatchReadiness(
    getDapPracticeDecisionEmailPreview(templateKey)
  )
  return buildDapDispatchEventFromReadiness(readiness, {
    communicationType: 'practice_decision_email',
    eventType,
    ...options,
  })
}

// ─── Member status convenience builder ───────────────────────────────────────

export function buildDapMemberStatusDispatchEvent(
  templateKey: DapMemberStatusEmailTemplateKey,
  eventType:   DapCommunicationDispatchEventType,
  options?:    Omit<DapDispatchEventBuildOptions, 'communicationType' | 'eventType'>,
): DapCommunicationDispatchEvent {
  const previews = getAllDapMemberStatusEmailPreviews()
  const preview  = previews.find(p => p.copy.templateKey === templateKey)
  if (!preview) {
    throw new Error(`No member status email preview found for templateKey: ${templateKey}`)
  }
  const readiness = getDapMemberStatusEmailDispatchReadiness(preview)
  return buildDapDispatchEventFromReadiness(readiness, {
    communicationType: 'member_status_email',
    eventType,
    ...options,
  })
}

// ─── Bulk preview generators ──────────────────────────────────────────────────

export function getAllDapPracticeDecisionDispatchEventPreviews(): DapCommunicationDispatchEvent[] {
  return getAllDapPracticeDecisionEmailDispatchReadiness().map(readiness =>
    buildDapDispatchEventFromReadiness(readiness, { communicationType: 'practice_decision_email' })
  )
}

export function getAllDapMemberStatusDispatchEventPreviews(): DapCommunicationDispatchEvent[] {
  return getAllDapMemberStatusEmailDispatchReadiness().map(readiness =>
    buildDapDispatchEventFromReadiness(readiness, { communicationType: 'member_status_email' })
  )
}
