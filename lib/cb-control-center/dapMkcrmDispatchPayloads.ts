// MKCRM shadow dispatch payloads are previews only.
// No delivery. No send. No MKCRM calls. No Supabase mutations.
// MKCRM does not decide eligibility, practice status, payment status,
// membership standing, or dispatch approval.

import type { DapMkcrmDispatchShadowPayload }    from './dapMkcrmDispatchPayloadTypes'
import type { DapCommunicationDispatchEvent }     from './dapCommunicationDispatchEventTypes'
import {
  getAllDapPracticeDecisionDispatchEventPreviews,
  getAllDapMemberStatusDispatchEventPreviews,
} from './dapCommunicationDispatchEvents'

// ─── Forbidden payload field names ────────────────────────────────────────────

const FORBIDDEN_PAYLOAD_FIELDS = new Set([
  'body', 'emailBody', 'html', 'text', 'subjectBody',
  'phi', 'patientName', 'diagnosis', 'treatment',
  'paymentCta', 'paymentLink', 'checkoutUrl', 'paymentMethod',
  'standing', 'storedStanding',
  'sentAt', 'deliveredAt', 'failedAt', 'openedAt', 'clickedAt', 'bouncedAt',
])

// ─── Recursive key collector ──────────────────────────────────────────────────

function collectAllKeys(obj: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return out
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    out.add(key)
    collectAllKeys(value, out)
  }
  return out
}

// ─── Runtime field reader (defense-in-depth) ──────────────────────────────────

function field(obj: unknown, key: string): unknown {
  return (obj as Record<string, unknown>)[key]
}

// ─── Core builder ─────────────────────────────────────────────────────────────

export function buildDapMkcrmDispatchShadowPayloadFromEvent(
  event:    DapCommunicationDispatchEvent,
  options?: { createdAt?: string },
): DapMkcrmDispatchShadowPayload {
  return {
    verticalKey:               'dap',
    shadowMode:                true,
    eventType:                 'mkcrm_dispatch_shadow_payload_created',
    communicationType:         event.communicationType,
    templateKey:               event.templateKey,
    audience:                  event.audience,
    channel:                   event.channel,
    dispatchEventType:         event.eventType,
    readinessStatus:           event.readinessStatus,
    eligibleForFutureDispatch: event.eligibleForFutureDispatch,
    blockerCodes:              [...event.blockerCodes],
    source: {
      decisionAuthority: 'cb_control_center',
      crmAuthority:      false,
      paymentAuthority:  false,
      ...(event.source.billingSource
        ? { billingSource: event.source.billingSource }
        : {}),
    },
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
  }
}

// ─── Bulk preview generators ──────────────────────────────────────────────────

export function getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(): DapMkcrmDispatchShadowPayload[] {
  return getAllDapPracticeDecisionDispatchEventPreviews().map(e =>
    buildDapMkcrmDispatchShadowPayloadFromEvent(e)
  )
}

export function getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(): DapMkcrmDispatchShadowPayload[] {
  return getAllDapMemberStatusDispatchEventPreviews().map(e =>
    buildDapMkcrmDispatchShadowPayloadFromEvent(e)
  )
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateDapMkcrmDispatchShadowPayload(payload: unknown): void {
  if (field(payload, 'shadowMode') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have shadowMode: true.')
  }
  if (field(field(payload, 'source'), 'crmAuthority') !== false) {
    throw new Error('MKCRM dispatch shadow payload must have source.crmAuthority: false.')
  }
  if (field(field(payload, 'source'), 'paymentAuthority') !== false) {
    throw new Error('MKCRM dispatch shadow payload must have source.paymentAuthority: false.')
  }
  const delivery = field(payload, 'delivery')
  if (field(delivery, 'deliveryDisabled') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have delivery.deliveryDisabled: true.')
  }
  if (field(delivery, 'externalSendDisabled') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have delivery.externalSendDisabled: true.')
  }
  if (field(delivery, 'mkcrmDeliveryDisabled') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have delivery.mkcrmDeliveryDisabled: true.')
  }
  if (field(delivery, 'resendDisabled') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have delivery.resendDisabled: true.')
  }
  const safety = field(payload, 'safety')
  if (field(safety, 'noPhi') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have safety.noPhi: true.')
  }
  if (field(safety, 'noPaymentCta') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have safety.noPaymentCta: true.')
  }
  if (field(safety, 'noEmailBody') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have safety.noEmailBody: true.')
  }
  if (field(safety, 'noStoredStanding') !== true) {
    throw new Error('MKCRM dispatch shadow payload must have safety.noStoredStanding: true.')
  }

  // Scan all nested keys for forbidden fields
  const allKeys = collectAllKeys(payload)
  for (const key of allKeys) {
    if (FORBIDDEN_PAYLOAD_FIELDS.has(key)) {
      throw new Error(`MKCRM dispatch shadow payload contains forbidden field: '${key}'.`)
    }
  }
}
