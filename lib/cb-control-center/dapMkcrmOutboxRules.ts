import type {
  DapMkcrmOutboxPayload,
  DapMkcrmOutboxPayloadInput,
  DapMkcrmLifecycleSignalType,
} from './dapMkcrmOutboxTypes'
import type {
  DapClientBuilderBillingEventType,
  DapClientBuilderBillingStatusHint,
} from './dapClientBuilderBillingTypes'

// ─── Billing event → MKCRM lifecycle signal ────────────────────────────────────

const BILLING_EVENT_TO_SIGNAL: Record<DapClientBuilderBillingEventType, DapMkcrmLifecycleSignalType> = {
  client_builder_subscription_created:  'member_enrollment_started',
  client_builder_subscription_activated: 'member_membership_activated',
  client_builder_subscription_renewed:  'member_membership_activated',
  client_builder_payment_succeeded:     'member_membership_activated',
  client_builder_subscription_past_due: 'member_membership_past_due',
  client_builder_payment_failed:        'member_payment_failed',
  client_builder_subscription_canceled: 'member_membership_canceled',
  client_builder_refund_recorded:       'member_refund_recorded',
  client_builder_chargeback_recorded:   'member_chargeback_recorded',
}

// ─── Billing status hint → MKCRM lifecycle signal ─────────────────────────────

const STATUS_HINT_TO_SIGNAL: Record<DapClientBuilderBillingStatusHint, DapMkcrmLifecycleSignalType> = {
  active:         'member_membership_activated',
  past_due:       'member_membership_past_due',
  canceled:       'member_membership_canceled',
  payment_failed: 'member_payment_failed',
  refunded:       'member_refund_recorded',
  chargeback:     'member_chargeback_recorded',
  unknown:        'member_enrollment_started',
}

// ─── Unsafe key scanner ────────────────────────────────────────────────────────

const UNSAFE_KEYS = new Set([
  'patientname', 'membername', 'diagnosis', 'treatment', 'procedure',
  'cardnumber', 'paymentmethod', 'ssn', 'dob', 'dateofbirth',
  'insuranceclaim', 'claimnumber', 'address',
])

// ─── Pure rule functions ───────────────────────────────────────────────────────

export function mapClientBuilderBillingEventToMkcrmSignal(
  eventType: DapClientBuilderBillingEventType
): DapMkcrmLifecycleSignalType {
  return BILLING_EVENT_TO_SIGNAL[eventType]
}

export function mapBillingStatusHintToMkcrmSignal(
  statusHint: DapClientBuilderBillingStatusHint
): DapMkcrmLifecycleSignalType {
  return STATUS_HINT_TO_SIGNAL[statusHint]
}

export function buildDapMkcrmOutboxPayload(
  input: DapMkcrmOutboxPayloadInput
): DapMkcrmOutboxPayload {
  return {
    verticalKey:            'dap',
    destination:            'mkcrm',
    mode:                   'shadow',
    source:                 input.source,
    signalType:             input.signalType,
    occurredAt:             input.occurredAt,
    preparedAt:             input.preparedAt,
    practiceId:             input.practiceId,
    membershipId:           input.membershipId,
    externalAccountId:      input.externalAccountId,
    externalCustomerId:     input.externalCustomerId,
    externalSubscriptionId: input.externalSubscriptionId,
    externalPaymentId:      input.externalPaymentId,
    statusHint:             input.statusHint,
    metadata:               input.metadata,
  }
}

export function assertDapMkcrmOutboxDestination(
  payload: DapMkcrmOutboxPayload
): void {
  const dest = (payload as { destination: unknown }).destination
  if (dest !== 'mkcrm') {
    throw new Error(
      `Invalid outbox destination: '${String(dest)}'. ` +
      `MKCRM is the only valid outbox destination. ` +
      `Client Builder Pro originates billing — it is not an outbox destination.`
    )
  }
}

export function validateDapMkcrmOutboxPayload(
  payload: DapMkcrmOutboxPayload
): void {
  assertDapMkcrmOutboxDestination(payload)

  const p = payload as unknown as Record<string, unknown>

  if (p['verticalKey'] !== 'dap') {
    throw new Error(`Invalid verticalKey: '${String(p['verticalKey'])}' — must be 'dap'`)
  }
  if (p['mode'] !== 'shadow') {
    throw new Error('Invalid mode: outbox must operate in shadow mode only')
  }
  if (!p['signalType']) {
    throw new Error('Invalid payload: missing signalType')
  }
  if (!p['occurredAt']) {
    throw new Error('Invalid payload: missing occurredAt')
  }
  if (!p['preparedAt']) {
    throw new Error('Invalid payload: missing preparedAt')
  }
  if (!p['source']) {
    throw new Error('Invalid payload: missing source')
  }
}

export function isDapMkcrmOutboxPayloadSafe(
  payload: DapMkcrmOutboxPayload
): boolean {
  if (payload.metadata) {
    for (const key of Object.keys(payload.metadata)) {
      if (UNSAFE_KEYS.has(key.toLowerCase())) {
        return false
      }
    }
  }
  for (const key of Object.keys(payload)) {
    if (UNSAFE_KEYS.has(key.toLowerCase())) {
      return false
    }
  }
  return true
}
