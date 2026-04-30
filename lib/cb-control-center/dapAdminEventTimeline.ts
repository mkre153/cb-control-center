// Admin event timeline formatter.
// Pure — does not mutate source events.
// Does not infer payment success unless derived from billing_events.
// Does not treat MKCRM shadow events as authoritative.
// No PHI surfaced.

export type DapAdminTimelineSource   = 'dap' | 'client_builder_pro' | 'mkcrm_shadow'
export type DapAdminTimelineActorType = 'system' | 'admin' | 'provider' | 'member' | 'unknown'
export type DapAdminTimelineSeverity  = 'info' | 'success' | 'warning' | 'blocked'

export interface DapAdminTimelineEventInput {
  id:          string
  occurredAt:  string
  eventType:   string
  actorType?:  string | null
  note?:       string | null
  source:      DapAdminTimelineSource
  metadata?:   Record<string, unknown> | null
}

export interface DapAdminTimelineEntry {
  id:          string
  occurredAt:  string
  label:       string
  description: string
  actorType:   DapAdminTimelineActorType
  severity:    DapAdminTimelineSeverity
  source:      DapAdminTimelineSource
  safety: {
    displaySafe: true
    includesPhi: false
  }
}

// ─── Severity map ─────────────────────────────────────────────────────────────

const EVENT_SEVERITY: Record<string, DapAdminTimelineSeverity> = {
  // DAP request events
  request_created:                'info',
  consent_captured:               'info',
  request_validated:              'success',
  duplicate_detected:             'warning',
  queued_for_manual_review:       'info',
  marked_outreach_ready:          'info',
  request_approved:               'success',
  request_rejected:               'blocked',
  request_needs_review:           'warning',
  practice_contacted:             'info',
  practice_response_received:     'info',
  provider_onboarding_started:    'info',
  provider_confirmation_linked:   'success',
  user_contacted:                 'info',
  user_opted_out:                 'warning',
  request_closed:                 'info',
  // Client Builder Pro billing events
  client_builder_subscription_created:    'info',
  client_builder_subscription_activated:  'success',
  client_builder_subscription_renewed:    'success',
  client_builder_subscription_past_due:   'warning',
  client_builder_subscription_canceled:   'blocked',
  client_builder_payment_succeeded:       'success',
  client_builder_payment_failed:          'warning',
  client_builder_refund_recorded:         'warning',
  client_builder_chargeback_recorded:     'blocked',
  // MKCRM shadow events (not authoritative)
  mkcrm_shadow_sync:     'info',
  mkcrm_shadow_dispatch: 'info',
  mkcrm_dispatch_ready:  'info',
}

// ─── Actor type normalizer ────────────────────────────────────────────────────

function normalizeActorType(
  actorType: string | null | undefined,
  source: DapAdminTimelineSource,
): DapAdminTimelineActorType {
  if (source === 'client_builder_pro') return 'system'
  if (source === 'mkcrm_shadow') return 'system'
  switch (actorType) {
    case 'admin':    return 'admin'
    case 'patient':  return 'member'
    case 'practice': return 'provider'
    case 'system':   return 'system'
    default:         return 'unknown'
  }
}

// ─── Label formatter ─────────────────────────────────────────────────────────

function formatEventLabel(eventType: string, source: DapAdminTimelineSource): string {
  if (source === 'mkcrm_shadow') return `[shadow] ${eventType}`
  return eventType.replace(/_/g, ' ')
}

// ─── Description builder ─────────────────────────────────────────────────────

function buildDescription(event: DapAdminTimelineEventInput): string {
  if (event.note) return String(event.note)
  if (event.source === 'mkcrm_shadow') return 'MKCRM shadow event — not authoritative.'
  if (event.source === 'client_builder_pro') return 'Client Builder Pro billing event.'
  return event.eventType.replace(/_/g, ' ')
}

const SAFETY = { displaySafe: true as const, includesPhi: false as const }

// ─── Core formatter ───────────────────────────────────────────────────────────

export function formatDapAdminTimelineEntry(
  event: DapAdminTimelineEventInput,
): DapAdminTimelineEntry {
  return {
    id:          event.id,
    occurredAt:  event.occurredAt,
    label:       formatEventLabel(event.eventType, event.source),
    description: buildDescription(event),
    actorType:   normalizeActorType(event.actorType, event.source),
    severity:    EVENT_SEVERITY[event.eventType] ?? 'info',
    source:      event.source,
    safety:      SAFETY,
  }
}

export function formatDapAdminTimeline(
  events: DapAdminTimelineEventInput[],
): DapAdminTimelineEntry[] {
  return [...events]
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map(formatDapAdminTimelineEntry)
}

// ─── Fixture events ───────────────────────────────────────────────────────────

export const DAP_ADMIN_TIMELINE_FIXTURES: DapAdminTimelineEventInput[] = [
  {
    id:         'evt-001',
    occurredAt: '2026-04-01T10:00:00Z',
    eventType:  'request_created',
    actorType:  'patient',
    source:     'dap',
  },
  {
    id:         'evt-002',
    occurredAt: '2026-04-01T10:01:00Z',
    eventType:  'consent_captured',
    actorType:  'system',
    source:     'dap',
    note:       'Consent text snapshot captured.',
  },
  {
    id:         'evt-003',
    occurredAt: '2026-04-01T10:02:00Z',
    eventType:  'request_validated',
    actorType:  'system',
    source:     'dap',
  },
  {
    id:         'evt-004',
    occurredAt: '2026-04-01T10:05:00Z',
    eventType:  'client_builder_subscription_created',
    actorType:  null,
    source:     'client_builder_pro',
  },
  {
    id:         'evt-005',
    occurredAt: '2026-04-01T10:06:00Z',
    eventType:  'client_builder_subscription_activated',
    actorType:  null,
    source:     'client_builder_pro',
  },
  {
    id:         'evt-006',
    occurredAt: '2026-04-02T09:00:00Z',
    eventType:  'queued_for_manual_review',
    actorType:  'system',
    source:     'dap',
  },
  {
    id:         'evt-007',
    occurredAt: '2026-04-03T14:00:00Z',
    eventType:  'request_approved',
    actorType:  'admin',
    source:     'dap',
    note:       'Practice meets criteria.',
  },
  {
    id:         'evt-008',
    occurredAt: '2026-04-03T14:05:00Z',
    eventType:  'mkcrm_shadow_dispatch',
    actorType:  null,
    source:     'mkcrm_shadow',
  },
]
