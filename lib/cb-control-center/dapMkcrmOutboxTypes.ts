// MKCRM receives lifecycle sync signals.
// Client Builder Pro originates billing events.
// DAP standing is derived from billing_events.
// The MKCRM outbox is shadow-only.

export type DapMkcrmOutboxSource =
  | 'dap_registry'
  | 'client_builder_billing_shadow'
  | 'provider_participation'
  | 'membership_lifecycle'

export type DapMkcrmOutboxDestination = 'mkcrm'
export type DapMkcrmOutboxMode = 'shadow'

export type DapMkcrmLifecycleSignalType =
  | 'practice_enrollment_started'
  | 'practice_enrollment_approved'
  | 'practice_enrollment_rejected'
  | 'provider_participation_confirmed'
  | 'provider_participation_declined'
  | 'member_enrollment_started'
  | 'member_enrollment_confirmed'
  | 'member_membership_activated'
  | 'member_membership_past_due'
  | 'member_membership_canceled'
  | 'member_payment_failed'
  | 'member_refund_recorded'
  | 'member_chargeback_recorded'

export interface DapMkcrmOutboxPayload {
  verticalKey: 'dap'
  destination: 'mkcrm'
  mode: 'shadow'
  source: DapMkcrmOutboxSource
  signalType: DapMkcrmLifecycleSignalType
  occurredAt: string
  preparedAt: string
  practiceId?: string
  membershipId?: string
  externalAccountId?: string
  externalCustomerId?: string
  externalSubscriptionId?: string
  externalPaymentId?: string
  statusHint?: string
  metadata?: Record<string, string>
}

export interface DapMkcrmOutboxPayloadInput {
  source: DapMkcrmOutboxSource
  signalType: DapMkcrmLifecycleSignalType
  occurredAt: string
  preparedAt: string
  practiceId?: string
  membershipId?: string
  externalAccountId?: string
  externalCustomerId?: string
  externalSubscriptionId?: string
  externalPaymentId?: string
  statusHint?: string
  metadata?: Record<string, string>
}
