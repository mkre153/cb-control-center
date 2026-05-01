import type {
  DapClientBuilderBillingEventType,
  DapClientBuilderBillingPayloadInput,
  DapClientBuilderBillingShadowPayload,
  DapClientBuilderBillingStatusHint,
} from './dapClientBuilderBillingTypes'

// ─── Event → status hint map ───────────────────────────────────────────────────

const EVENT_TO_STATUS_HINT: Record<DapClientBuilderBillingEventType, DapClientBuilderBillingStatusHint> = {
  client_builder_subscription_created:  'unknown',
  client_builder_subscription_activated: 'active',
  client_builder_subscription_renewed:  'active',
  client_builder_payment_succeeded:     'active',
  client_builder_subscription_past_due: 'past_due',
  client_builder_payment_failed:        'payment_failed',
  client_builder_subscription_canceled: 'canceled',
  client_builder_refund_recorded:       'refunded',
  client_builder_chargeback_recorded:   'chargeback',
}

// ─── Unsafe metadata key scanner ──────────────────────────────────────────────

const UNSAFE_KEYS = new Set([
  'patientname', 'membername', 'diagnosis', 'treatment', 'procedure',
  'cardnumber', 'paymentmethod', 'ssn', 'dob', 'dateofbirth',
  'insuranceclaim', 'claimnumber', 'address',
])

// ─── Pure rule functions ───────────────────────────────────────────────────────

export function mapClientBuilderBillingEventToStatusHint(
  eventType: DapClientBuilderBillingEventType
): DapClientBuilderBillingStatusHint {
  return EVENT_TO_STATUS_HINT[eventType]
}

export function buildDapClientBuilderBillingPayload(
  input: DapClientBuilderBillingPayloadInput
): DapClientBuilderBillingShadowPayload {
  return {
    verticalKey:            'dap',
    sourceSystem:           'client_builder_pro',
    shadowMode:             true,
    eventType:              input.eventType,
    externalAccountId:      input.externalAccountId,
    externalCustomerId:     input.externalCustomerId,
    externalSubscriptionId: input.externalSubscriptionId,
    externalInvoiceId:      input.externalInvoiceId,
    externalPaymentId:      input.externalPaymentId,
    membershipId:           input.membershipId,
    practiceId:             input.practiceId,
    occurredAt:             input.occurredAt,
    receivedAt:             input.receivedAt,
    currency:               input.currency,
    amountCents:            input.amountCents,
    statusHint:             mapClientBuilderBillingEventToStatusHint(input.eventType),
    metadata:               input.metadata,
  }
}

export function assertClientBuilderBillingSource(
  payload: DapClientBuilderBillingShadowPayload
): void {
  const src = (payload as { sourceSystem: unknown }).sourceSystem
  if (src !== 'client_builder_pro') {
    throw new Error(
      `Invalid billing source: '${String(src)}'. ` +
      `Client Builder Pro is the only accepted billing source for DAP. ` +
      `MKCRM does not originate billing events.`
    )
  }
}

export function validateDapClientBuilderBillingPayload(
  payload: DapClientBuilderBillingShadowPayload
): void {
  assertClientBuilderBillingSource(payload)

  const p = payload as unknown as Record<string, unknown>

  if (p['verticalKey'] !== 'dap') {
    throw new Error(`Invalid verticalKey: '${String(p['verticalKey'])}' — must be 'dap'`)
  }
  if (p['shadowMode'] !== true) {
    throw new Error('Invalid payload: shadowMode must be true — Phase 9O is shadow-only')
  }
  if (!p['eventType']) {
    throw new Error('Invalid payload: missing eventType')
  }
  if (!p['externalAccountId']) {
    throw new Error('Invalid payload: missing externalAccountId')
  }
  if (!p['occurredAt']) {
    throw new Error('Invalid payload: missing occurredAt')
  }
  if (!p['receivedAt']) {
    throw new Error('Invalid payload: missing receivedAt')
  }
}

export function isClientBuilderBillingPayloadSafe(
  payload: DapClientBuilderBillingShadowPayload
): boolean {
  // Scan metadata keys for PHI or unsafe payment data
  if (payload.metadata) {
    for (const key of Object.keys(payload.metadata)) {
      if (UNSAFE_KEYS.has(key.toLowerCase())) {
        return false
      }
    }
  }
  // Scan top-level payload keys for any unsafe field names that bypassed typing
  for (const key of Object.keys(payload)) {
    if (UNSAFE_KEYS.has(key.toLowerCase())) {
      return false
    }
  }
  return true
}
