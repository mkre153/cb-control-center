import type { DapMkcrmOutboxPayload, DapMkcrmLifecycleSignalType } from './dapMkcrmOutboxTypes'
import type { DapClientBuilderBillingShadowPayload } from './dapClientBuilderBillingTypes'
import {
  validateDapMkcrmOutboxPayload,
  isDapMkcrmOutboxPayloadSafe,
  mapClientBuilderBillingEventToMkcrmSignal,
  buildDapMkcrmOutboxPayload,
} from './dapMkcrmOutboxRules'

// MKCRM receives lifecycle sync signals.
// Client Builder Pro originates billing events.
// DAP standing is derived from billing_events.
// The MKCRM outbox is shadow-only: no API calls, no database writes, no payment processing.

export interface DapMkcrmOutboxShadowResult {
  ok: boolean
  verticalKey: 'dap'
  destination: 'mkcrm'
  mode: 'shadow'
  signalType?: DapMkcrmLifecycleSignalType
  wouldEnqueueOutboxRecord: boolean
  wouldCallMkcrmApi: false           // literal type — no MKCRM API calls in shadow mode
  wouldUpdateStoredStanding: false   // literal type — standing is always derived, never stored
  wouldProcessPayment: false         // literal type — MKCRM never processes payment
  reason?: string
}

export function prepareDapMkcrmOutboxShadow(
  payload: DapMkcrmOutboxPayload
): DapMkcrmOutboxShadowResult {
  try {
    validateDapMkcrmOutboxPayload(payload)
  } catch (err) {
    return {
      ok:                     false,
      verticalKey:            'dap',
      destination:            'mkcrm',
      mode:                   'shadow',
      wouldEnqueueOutboxRecord: false,
      wouldCallMkcrmApi:      false,
      wouldUpdateStoredStanding: false,
      wouldProcessPayment:    false,
      reason: err instanceof Error ? err.message : 'Validation failed',
    }
  }

  const safe = isDapMkcrmOutboxPayloadSafe(payload)

  return {
    ok:                     safe,
    verticalKey:            'dap',
    destination:            'mkcrm',
    mode:                   'shadow',
    signalType:             payload.signalType,
    wouldEnqueueOutboxRecord: safe,
    wouldCallMkcrmApi:      false,
    wouldUpdateStoredStanding: false,
    wouldProcessPayment:    false,
    reason: safe ? undefined : 'Payload contains unsafe fields',
  }
}

export function prepareDapMkcrmOutboxFromClientBuilderBillingShadow(
  billingPayload: DapClientBuilderBillingShadowPayload
): DapMkcrmOutboxShadowResult {
  const signalType = mapClientBuilderBillingEventToMkcrmSignal(billingPayload.eventType)

  const outboxPayload = buildDapMkcrmOutboxPayload({
    source:                 'client_builder_billing_shadow',
    signalType,
    occurredAt:             billingPayload.occurredAt,
    preparedAt:             billingPayload.receivedAt,
    externalAccountId:      billingPayload.externalAccountId,
    externalCustomerId:     billingPayload.externalCustomerId,
    externalSubscriptionId: billingPayload.externalSubscriptionId,
    externalPaymentId:      billingPayload.externalPaymentId,
    membershipId:           billingPayload.membershipId,
    practiceId:             billingPayload.practiceId,
    statusHint:             billingPayload.statusHint,
    metadata:               billingPayload.metadata,
  })

  return prepareDapMkcrmOutboxShadow(outboxPayload)
}
