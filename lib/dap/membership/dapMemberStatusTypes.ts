// DAP member standing is a read model derived from append-only billing events.
// Client Builder Pro originates billing events.
// MKCRM receives lifecycle sync signals only.
// The read model does not store standing.

export type DapMemberStanding =
  | 'unknown'
  | 'pending'
  | 'active'
  | 'past_due'
  | 'payment_failed'
  | 'canceled'
  | 'refunded'
  | 'chargeback'

export interface DapMemberBillingEventForStatus {
  verticalKey:  'dap'
  sourceSystem: 'client_builder_pro'
  eventType:
    | 'client_builder_subscription_created'
    | 'client_builder_subscription_activated'
    | 'client_builder_subscription_renewed'
    | 'client_builder_subscription_past_due'
    | 'client_builder_subscription_canceled'
    | 'client_builder_payment_succeeded'
    | 'client_builder_payment_failed'
    | 'client_builder_refund_recorded'
    | 'client_builder_chargeback_recorded'
  membershipId: string
  occurredAt:   string
  receivedAt?:  string
}

export interface DapMemberStatusReadModel {
  verticalKey:              'dap'
  membershipId:             string
  standing:                 DapMemberStanding
  derivedFromBillingEvents: true
  lastBillingEventType?:    DapMemberBillingEventForStatus['eventType']
  lastBillingEventAt?:      string
  eventCount:               number
  reasons:                  string[]
}
