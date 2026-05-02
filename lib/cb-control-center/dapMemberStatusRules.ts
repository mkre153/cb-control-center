import type {
  DapMemberStanding,
  DapMemberBillingEventForStatus,
  DapMemberStatusReadModel,
} from '../dap/membership/dapMemberStatusTypes'

// DAP member standing is a read model derived from append-only billing events.
// Client Builder Pro originates billing events.
// MKCRM receives lifecycle sync signals only.
// The read model does not store standing.

// ─── Unsafe key scanner ────────────────────────────────────────────────────────

const UNSAFE_KEYS = new Set([
  'patientname', 'membername', 'diagnosis', 'treatment', 'procedure',
  'cardnumber', 'paymentmethod', 'ssn', 'dob', 'dateofbirth',
  'insuranceclaim', 'claimnumber', 'address',
])

// ─── Event → standing map ──────────────────────────────────────────────────────

const EVENT_TO_STANDING: Record<DapMemberBillingEventForStatus['eventType'], DapMemberStanding> = {
  client_builder_subscription_created:  'pending',
  client_builder_subscription_activated: 'active',
  client_builder_subscription_renewed:  'active',
  client_builder_payment_succeeded:     'active',
  client_builder_subscription_past_due: 'past_due',
  client_builder_payment_failed:        'payment_failed',
  client_builder_subscription_canceled: 'canceled',
  client_builder_refund_recorded:       'refunded',
  client_builder_chargeback_recorded:   'chargeback',
}

// ─── Terminal standings ────────────────────────────────────────────────────────

const TERMINAL_STANDINGS = new Set<DapMemberStanding>(['canceled', 'refunded', 'chargeback'])

// ─── Pure rule functions ───────────────────────────────────────────────────────

export function mapBillingEventToMemberStanding(
  eventType: DapMemberBillingEventForStatus['eventType']
): DapMemberStanding {
  return EVENT_TO_STANDING[eventType]
}

export function isTerminalDapMemberStanding(standing: DapMemberStanding): boolean {
  return TERMINAL_STANDINGS.has(standing)
}

export function sortDapBillingEventsForStatus(
  events: DapMemberBillingEventForStatus[]
): DapMemberBillingEventForStatus[] {
  return [...events].sort((a, b) => {
    const byOccurredAt = a.occurredAt.localeCompare(b.occurredAt)
    if (byOccurredAt !== 0) return byOccurredAt
    const aReceived = a.receivedAt ?? ''
    const bReceived = b.receivedAt ?? ''
    return aReceived.localeCompare(bReceived)
  })
}

export function assertDapStatusEventsAreSafe(
  events: DapMemberBillingEventForStatus[]
): void {
  for (const event of events) {
    if ((event as unknown as Record<string, unknown>)['verticalKey'] !== 'dap') {
      throw new Error(
        `Invalid verticalKey: '${String((event as unknown as Record<string, unknown>)['verticalKey'])}' — must be 'dap'`
      )
    }
    if ((event as unknown as Record<string, unknown>)['sourceSystem'] !== 'client_builder_pro') {
      throw new Error(
        `Invalid sourceSystem: '${String((event as unknown as Record<string, unknown>)['sourceSystem'])}' — ` +
        `must be 'client_builder_pro'. Client Builder Pro originates billing events. ` +
        `MKCRM receives lifecycle sync signals only.`
      )
    }
    for (const key of Object.keys(event)) {
      if (UNSAFE_KEYS.has(key.toLowerCase())) {
        throw new Error(`Unsafe field in billing event: '${key}'`)
      }
    }
  }
}

export function deriveDapMemberStandingFromBillingEvents(
  events: DapMemberBillingEventForStatus[]
): DapMemberStanding {
  if (events.length === 0) return 'unknown'
  const sorted = sortDapBillingEventsForStatus(events)
  return mapBillingEventToMemberStanding(sorted[sorted.length - 1].eventType)
}

export function deriveDapMemberStatusReadModel(
  membershipId: string,
  events: DapMemberBillingEventForStatus[]
): DapMemberStatusReadModel {
  const scoped = events.filter(e => e.membershipId === membershipId)
  assertDapStatusEventsAreSafe(scoped)

  const sorted  = sortDapBillingEventsForStatus(scoped)
  const latest  = sorted[sorted.length - 1]
  const standing: DapMemberStanding = latest
    ? mapBillingEventToMemberStanding(latest.eventType)
    : 'unknown'

  const reasons: string[] = latest
    ? [
        `derived from ${scoped.length} billing event${scoped.length === 1 ? '' : 's'}`,
        `latest event: ${latest.eventType} at ${latest.occurredAt}`,
      ]
    : ['no billing events recorded for this membership']

  return {
    verticalKey:              'dap',
    membershipId,
    standing,
    derivedFromBillingEvents: true,
    lastBillingEventType:     latest?.eventType,
    lastBillingEventAt:       latest?.occurredAt,
    eventCount:               scoped.length,
    reasons,
  }
}
