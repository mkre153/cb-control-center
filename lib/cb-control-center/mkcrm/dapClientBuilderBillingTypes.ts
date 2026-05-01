// Client Builder Pro billing events may feed DAP billing_events.
// DAP standing is derived from billing_events.
// MKCRM may receive lifecycle sync but does not originate billing.

export type DapClientBuilderBillingEventType =
  | 'client_builder_subscription_created'
  | 'client_builder_subscription_activated'
  | 'client_builder_subscription_renewed'
  | 'client_builder_subscription_past_due'
  | 'client_builder_subscription_canceled'
  | 'client_builder_payment_succeeded'
  | 'client_builder_payment_failed'
  | 'client_builder_refund_recorded'
  | 'client_builder_chargeback_recorded'

export type DapBillingEventSourceSystem = 'client_builder_pro'

export type DapClientBuilderBillingStatusHint =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'payment_failed'
  | 'refunded'
  | 'chargeback'
  | 'unknown'

export interface DapClientBuilderBillingShadowPayload {
  verticalKey: 'dap'
  sourceSystem: 'client_builder_pro'
  shadowMode: true
  eventType: DapClientBuilderBillingEventType
  externalAccountId: string
  externalCustomerId?: string
  externalSubscriptionId?: string
  externalInvoiceId?: string
  externalPaymentId?: string
  membershipId?: string
  practiceId?: string
  occurredAt: string
  receivedAt: string
  currency?: 'usd'
  amountCents?: number
  statusHint?: DapClientBuilderBillingStatusHint
  metadata?: Record<string, string>
}

export interface DapClientBuilderBillingPayloadInput {
  eventType: DapClientBuilderBillingEventType
  externalAccountId: string
  externalCustomerId?: string
  externalSubscriptionId?: string
  externalInvoiceId?: string
  externalPaymentId?: string
  membershipId?: string
  practiceId?: string
  occurredAt: string
  receivedAt: string
  currency?: 'usd'
  amountCents?: number
  metadata?: Record<string, string>
}
