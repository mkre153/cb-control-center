import type {
  DapClientBuilderBillingEventType,
  DapClientBuilderBillingStatusHint,
  DapClientBuilderBillingShadowPayload,
} from './dapClientBuilderBillingTypes'
import {
  validateDapClientBuilderBillingPayload,
  isClientBuilderBillingPayloadSafe,
  mapClientBuilderBillingEventToStatusHint,
} from './dapClientBuilderBillingRules'

// Client Builder Pro billing events may feed DAP billing_events.
// DAP standing is derived from billing_events — never stored directly.
// MKCRM may receive lifecycle sync but does not originate billing.
// Phase 9O is shadow-only: no network calls, no database writes.

export interface DapClientBuilderBillingShadowResult {
  ok: boolean
  shadowMode: true
  verticalKey: 'dap'
  sourceSystem: 'client_builder_pro'
  eventType: DapClientBuilderBillingEventType
  statusHint: DapClientBuilderBillingStatusHint
  wouldAppendBillingEvent: boolean
  wouldUpdateStoredStanding: false  // literal type — standing is always derived, never stored
  wouldNotifyMkcrm: boolean
}

export function ingestDapClientBuilderBillingEventShadow(
  payload: DapClientBuilderBillingShadowPayload
): DapClientBuilderBillingShadowResult {
  validateDapClientBuilderBillingPayload(payload)

  const safe = isClientBuilderBillingPayloadSafe(payload)
  const statusHint =
    payload.statusHint ?? mapClientBuilderBillingEventToStatusHint(payload.eventType)

  return {
    ok:                      safe,
    shadowMode:              true,
    verticalKey:             'dap',
    sourceSystem:            'client_builder_pro',
    eventType:               payload.eventType,
    statusHint,
    wouldAppendBillingEvent: safe,
    wouldUpdateStoredStanding: false,
    wouldNotifyMkcrm:        safe,
  }
}
