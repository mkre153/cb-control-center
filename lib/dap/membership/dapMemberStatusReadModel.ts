// Public-safe member status read model.
// The page displays status. It does not decide status.
// standing is derived from append-only Client Builder Pro billing events.
// No PHI. No payment CTAs. No raw billing events. No MKCRM authority.
// No email sending. No Supabase mutations.

import type { DapMemberStanding, DapMemberBillingEventForStatus } from './dapMemberStatusTypes'
import type {
  DapMemberPublicStatus,
  DapMemberStatusPublicReadModel,
} from './dapMemberStatusPublicTypes'
import { deriveDapMemberStatusReadModel } from '../registry/dapMemberStatusRules'

// ─── Forbidden field names (public read model must never contain these) ────────

export const FORBIDDEN_PUBLIC_READ_MODEL_FIELDS = new Set([
  // Payment URLs — never exposed on public surface
  'paymentUrl', 'checkoutUrl', 'invoiceUrl', 'billingPortalUrl', 'paymentLink',
  // Delivery status fields
  'queued', 'scheduled', 'sent', 'sentAt', 'deliveredAt', 'openedAt', 'clickedAt', 'bouncedAt',
  // PHI
  'phi', 'patientName', 'diagnosis', 'treatment', 'procedure', 'ssn', 'dob', 'dateOfBirth',
  // Payment data
  'cardNumber', 'paymentMethod', 'paymentToken', 'stripeCustomerId',
  // Raw billing data (internal only)
  'billingEvents', 'rawBillingEvents', 'rawEvents',
  // Internal read model fields
  'lastBillingEventType', 'lastBillingEventAt', 'eventCount', 'reasons',
  // Contact info
  'memberEmail', 'email', 'phone',
  // MKCRM decision fields
  'mkcrmDecision', 'mkcrmStatus', 'mkcrmId',
  // Notes/free text
  'notes', 'internalNotes',
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

// ─── Standing → publicStatus map ──────────────────────────────────────────────

const STANDING_TO_PUBLIC_STATUS: Record<DapMemberStanding, DapMemberPublicStatus> = {
  active:         'active',
  pending:        'pending',
  past_due:       'attention_needed',
  payment_failed: 'attention_needed',
  canceled:       'inactive',
  refunded:       'inactive',
  chargeback:     'inactive',
  unknown:        'unknown',
}

// ─── Display copy ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DapMemberStanding, string> = {
  unknown:        'Unknown',
  pending:        'Pending',
  active:         'Active',
  past_due:       'Past Due',
  payment_failed: 'Payment Failed',
  canceled:       'Canceled',
  refunded:       'Refunded',
  chargeback:     'Chargeback',
}

const STATUS_SUMMARIES: Record<DapMemberStanding, string> = {
  unknown:        'Membership status could not be determined from available billing events.',
  pending:        'Your membership is pending activation through Client Builder Pro.',
  active:         'Your Dental Advantage Plan membership is active.',
  past_due:       'Your membership has a past-due payment balance.',
  payment_failed: 'A payment attempt failed for your membership.',
  canceled:       'Your membership has been canceled.',
  refunded:       'Your membership has been refunded and is no longer active.',
  chargeback:     'A chargeback has been recorded against your membership.',
}

const NEXT_STEPS: Record<DapMemberStanding, string> = {
  unknown:        'Membership status could not be determined. Contact support for assistance.',
  pending:        'Your membership is being processed. Check back shortly.',
  active:         'Your membership is active. No action needed.',
  past_due:       'Your account has a past-due balance. Please update your payment method through Client Builder Pro.',
  payment_failed: 'A recent payment was unsuccessful. Please update your payment method through Client Builder Pro.',
  canceled:       'Your membership has ended. Contact support to discuss reactivation.',
  refunded:       'Your membership has been refunded. Contact support for further assistance.',
  chargeback:     'A chargeback has been recorded. Contact support for assistance.',
}

// ─── Fixture billing events (all 8 standings, read-only) ─────────────────────

const FIXTURE_BILLING_EVENTS: Record<string, DapMemberBillingEventForStatus[]> = {
  'dap-p10-unknown': [],
  'dap-p10-pending': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-pending',
      occurredAt:   '2026-04-29T10:00:00Z',
    },
  ],
  'dap-p10-active': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-active',
      occurredAt:   '2026-04-01T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'dap-p10-active',
      occurredAt:   '2026-04-01T10:05:00Z',
    },
  ],
  'dap-p10-past-due': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-past-due',
      occurredAt:   '2026-03-01T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'dap-p10-past-due',
      occurredAt:   '2026-03-01T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_past_due',
      membershipId: 'dap-p10-past-due',
      occurredAt:   '2026-04-01T08:00:00Z',
    },
  ],
  'dap-p10-payment-failed': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-payment-failed',
      occurredAt:   '2026-03-15T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'dap-p10-payment-failed',
      occurredAt:   '2026-03-15T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_payment_failed',
      membershipId: 'dap-p10-payment-failed',
      occurredAt:   '2026-04-15T09:00:00Z',
    },
  ],
  'dap-p10-canceled': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-canceled',
      occurredAt:   '2026-02-01T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'dap-p10-canceled',
      occurredAt:   '2026-02-01T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_canceled',
      membershipId: 'dap-p10-canceled',
      occurredAt:   '2026-03-15T10:00:00Z',
    },
  ],
  'dap-p10-refunded': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-refunded',
      occurredAt:   '2026-01-15T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'dap-p10-refunded',
      occurredAt:   '2026-01-15T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_refund_recorded',
      membershipId: 'dap-p10-refunded',
      occurredAt:   '2026-02-01T12:00:00Z',
    },
  ],
  'dap-p10-chargeback': [
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_created',
      membershipId: 'dap-p10-chargeback',
      occurredAt:   '2026-01-01T10:00:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_subscription_activated',
      membershipId: 'dap-p10-chargeback',
      occurredAt:   '2026-01-01T10:05:00Z',
    },
    {
      verticalKey:  'dap',
      sourceSystem: 'client_builder_pro',
      eventType:    'client_builder_chargeback_recorded',
      membershipId: 'dap-p10-chargeback',
      occurredAt:   '2026-02-10T15:00:00Z',
    },
  ],
}

// ─── All fixture membershipIds (one per standing) ─────────────────────────────

export const DAP_P10_FIXTURE_MEMBERSHIP_IDS = [
  'dap-p10-unknown',
  'dap-p10-pending',
  'dap-p10-active',
  'dap-p10-past-due',
  'dap-p10-payment-failed',
  'dap-p10-canceled',
  'dap-p10-refunded',
  'dap-p10-chargeback',
] as const

export type DapP10FixtureMembershipId = typeof DAP_P10_FIXTURE_MEMBERSHIP_IDS[number]

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function mapStandingToPublicStatus(standing: DapMemberStanding): DapMemberPublicStatus {
  return STANDING_TO_PUBLIC_STATUS[standing]
}

export function getStatusLabel(standing: DapMemberStanding): string {
  return STATUS_LABELS[standing]
}

export function getStatusSummary(standing: DapMemberStanding): string {
  return STATUS_SUMMARIES[standing]
}

export function getNextStep(standing: DapMemberStanding): string {
  return NEXT_STEPS[standing]
}

// ─── Membership existence check ──────────────────────────────────────────────

export function isDapMembershipKnown(membershipId: string): boolean {
  return Object.prototype.hasOwnProperty.call(FIXTURE_BILLING_EVENTS, membershipId)
}

// ─── Core public read model builder ──────────────────────────────────────────

export function getDapMemberStatusReadModel(
  membershipId: string
): DapMemberStatusPublicReadModel {
  const billingEvents = FIXTURE_BILLING_EVENTS[membershipId] ?? []
  const internal      = deriveDapMemberStatusReadModel(membershipId, billingEvents)

  return {
    membershipId,
    verticalKey:   'dap',
    publicStatus:  mapStandingToPublicStatus(internal.standing),
    standing:      internal.standing,
    statusLabel:   getStatusLabel(internal.standing),
    statusSummary: getStatusSummary(internal.standing),
    nextStep:      getNextStep(internal.standing),
    source: {
      derivedFromBillingEvents: true,
      paymentAuthority:         'client_builder_pro',
      crmAuthority:             false,
      dapAuthority:             'registry_only',
    },
    safety: {
      includesPhi:              false,
      includesPaymentCta:       false,
      includesRawBillingEvents: false,
    },
  }
}

// ─── All 8 fixture read models ────────────────────────────────────────────────

export function getAllDapMemberPublicStatusFixtures(): DapMemberStatusPublicReadModel[] {
  return DAP_P10_FIXTURE_MEMBERSHIP_IDS.map(id => getDapMemberStatusReadModel(id))
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateDapMemberStatusPublicReadModel(model: unknown): void {
  const m = model as Record<string, unknown>

  if (m['verticalKey'] !== 'dap') {
    throw new Error('Public read model must have verticalKey: dap.')
  }

  const safety = m['safety'] as Record<string, unknown> | undefined
  if (!safety || safety['includesPhi'] !== false) {
    throw new Error('Public read model must have safety.includesPhi: false.')
  }
  if (safety['includesPaymentCta'] !== false) {
    throw new Error('Public read model must have safety.includesPaymentCta: false.')
  }
  if (safety['includesRawBillingEvents'] !== false) {
    throw new Error('Public read model must have safety.includesRawBillingEvents: false.')
  }

  const source = m['source'] as Record<string, unknown> | undefined
  if (!source || source['crmAuthority'] !== false) {
    throw new Error('Public read model must have source.crmAuthority: false.')
  }
  if (source['paymentAuthority'] !== 'client_builder_pro') {
    throw new Error('Public read model must have source.paymentAuthority: client_builder_pro.')
  }
  if (source['dapAuthority'] !== 'registry_only') {
    throw new Error('Public read model must have source.dapAuthority: registry_only.')
  }
  if (source['derivedFromBillingEvents'] !== true) {
    throw new Error('Public read model must have source.derivedFromBillingEvents: true.')
  }

  // Scan all nested keys for forbidden fields
  const allKeys = collectAllKeys(model)
  for (const key of allKeys) {
    if (FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has(key)) {
      throw new Error(`Public read model contains forbidden field: '${key}'.`)
    }
  }
}
