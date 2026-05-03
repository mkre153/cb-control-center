// DAP member standing is a read model derived from append-only billing events.
// Client Builder Pro originates billing events.
// MKCRM receives lifecycle sync signals only.
// The read model does not store standing.

import type {
  DapMemberBillingEventForStatus,
  DapMemberStatusReadModel,
  DapMemberStanding,
} from './dapMemberStatusTypes'
import { deriveDapMemberStatusReadModel } from '../registry/dapMemberStatusRules'

// ─── Fixture billing events (read-only, no Supabase, no mutations) ─────────────

const FIXTURE_EVENTS: Record<string, DapMemberBillingEventForStatus[]> = {
  'mem-preview-active': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'mem-preview-active',
      occurredAt:   '2026-04-01T10:00:00Z',
      receivedAt:   '2026-04-01T10:00:05Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'mem-preview-active',
      occurredAt:   '2026-04-01T10:05:00Z',
      receivedAt:   '2026-04-01T10:05:03Z',
    },
  ],
  'mem-preview-past-due': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'mem-preview-past-due',
      occurredAt:   '2026-03-01T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'mem-preview-past-due',
      occurredAt:   '2026-03-01T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_past_due',
      membershipId: 'mem-preview-past-due',
      occurredAt:   '2026-04-01T08:00:00Z',
    },
  ],
  'mem-preview-canceled': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'mem-preview-canceled',
      occurredAt:   '2026-02-01T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'mem-preview-canceled',
      occurredAt:   '2026-02-01T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_canceled',
      membershipId: 'mem-preview-canceled',
      occurredAt:   '2026-03-15T10:00:00Z',
    },
  ],
  'mem-preview-pending': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'mem-preview-pending',
      occurredAt:   '2026-04-30T09:00:00Z',
    },
  ],
}

// ─── Display maps ─────────────────────────────────────────────────────────────

const STANDING_LABELS: Record<DapMemberStanding, string> = {
  unknown:        'Unknown',
  pending:        'Pending',
  active:         'Active',
  past_due:       'Past Due',
  payment_failed: 'Payment Failed',
  canceled:       'Canceled',
  refunded:       'Refunded',
  chargeback:     'Chargeback',
}

const STANDING_DESCRIPTIONS: Record<DapMemberStanding, string> = {
  unknown:        'No Client Builder Pro billing events were found for this membership.',
  pending:        'Membership has been started but not yet activated.',
  active:         'Latest billing event indicates active standing.',
  past_due:       'Latest billing event indicates the subscription is past due.',
  payment_failed: 'Latest billing event indicates payment failed.',
  canceled:       'Latest billing event indicates cancellation.',
  refunded:       'Latest billing event indicates a refund was recorded.',
  chargeback:     'Latest billing event indicates a chargeback was recorded.',
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface DapMemberStatusPreviewResult {
  membershipId:  string
  readModel:     DapMemberStatusReadModel
  billingEvents: DapMemberBillingEventForStatus[]
  display: {
    label:           string
    description:     string
    lastEventLabel?: string
  }
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function formatDapMemberStandingLabel(standing: DapMemberStanding): string {
  return STANDING_LABELS[standing]
}

export function formatDapMemberStandingDescription(readModel: DapMemberStatusReadModel): string {
  return STANDING_DESCRIPTIONS[readModel.standing]
}

export function getDapMemberStatusPreviewEvents(membershipId: string): DapMemberBillingEventForStatus[] {
  return FIXTURE_EVENTS[membershipId] ?? []
}

export function getDapMemberStatusPreview(membershipId: string): DapMemberStatusPreviewResult {
  const billingEvents = getDapMemberStatusPreviewEvents(membershipId)
  const readModel     = deriveDapMemberStatusReadModel(membershipId, billingEvents)
  const label         = formatDapMemberStandingLabel(readModel.standing)
  const description   = formatDapMemberStandingDescription(readModel)

  const lastEventLabel = readModel.lastBillingEventType
    ? `${readModel.lastBillingEventType} at ${readModel.lastBillingEventAt}`
    : undefined

  return {
    membershipId,
    readModel,
    billingEvents,
    display: { label, description, lastEventLabel },
  }
}
