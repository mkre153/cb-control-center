// DAP Admin Decision Ledger — Phase 13 preview-only event generator.
// Delegates gate/availability resolution to Phase 12's evaluateDapActionAvailability.
// No Supabase insert. No status mutation. No email. No payment. No MKCRM live sync.

import type {
  DapAdminDecisionLedgerDefinition,
  DapAdminDecisionLedgerEvent,
  DapAdminDecisionLedgerEventKey,
  DapAdminDecisionLedgerSafetyFlags,
} from './dapAdminDecisionLedgerTypes'
import { DAP_ACTION_DEFINITIONS } from './dapActionCatalog'
import {
  evaluateDapActionAvailability,
  DAP_ACTION_CONTEXT_EMPTY,
  DAP_ACTION_CONTEXT_DEMO,
  DAP_ACTION_CONTEXT_APPROVED,
} from './dapActionAvailabilityRules'
import type { DapActionAvailabilityContext } from './dapActionCatalogTypes'

export type { DapActionAvailabilityContext }

// ─── Safety constant ──────────────────────────────────────────────────────────

export const LEDGER_SAFETY: DapAdminDecisionLedgerSafetyFlags = {
  previewOnly:           true,
  appendsToSupabase:     false,
  mutatesStatus:         false,
  sendsEmail:            false,
  queuesEmail:           false,
  triggersPayment:       false,
  triggersMkcrmLiveSync: false,
  includesPhi:           false,
}

// ─── Static definitions ───────────────────────────────────────────────────────

const LEDGER_DEFINITIONS: DapAdminDecisionLedgerDefinition[] = [
  {
    eventKey:        'practice_request_approved_preview',
    eventType:       'dap.practice_request.approved',
    sourceActionKey: 'approve_practice_request',
    entityType:      'practice_request',
    decisionLabel:   'Practice Request Approved',
    decisionOutcome: 'approved',
    reasonCode:      'admin_approved',
    reasonLabel:     'Admin reviewed and approved the practice request',
    wouldAppendTo:   'future_dap_admin_decision_events',
  },
  {
    eventKey:        'practice_request_rejected_preview',
    eventType:       'dap.practice_request.rejected',
    sourceActionKey: 'reject_practice_request',
    entityType:      'practice_request',
    decisionLabel:   'Practice Request Rejected',
    decisionOutcome: 'rejected',
    reasonCode:      'admin_rejected',
    reasonLabel:     'Admin reviewed and rejected the practice request',
    wouldAppendTo:   'future_dap_admin_decision_events',
  },
  {
    eventKey:        'offer_terms_review_passed_preview',
    eventType:       'dap.offer_terms_review.passed',
    sourceActionKey: 'mark_offer_terms_review_passed',
    entityType:      'offer_terms_review',
    decisionLabel:   'Offer Terms Review Passed',
    decisionOutcome: 'passed',
    reasonCode:      'offer_terms_accepted',
    reasonLabel:     'Practice accepted offer terms; review marked passed',
    wouldAppendTo:   'future_dap_admin_decision_events',
  },
  {
    eventKey:        'offer_terms_review_failed_preview',
    eventType:       'dap.offer_terms_review.failed',
    sourceActionKey: 'mark_offer_terms_review_failed',
    entityType:      'offer_terms_review',
    decisionLabel:   'Offer Terms Review Failed',
    decisionOutcome: 'failed',
    reasonCode:      'offer_terms_declined',
    reasonLabel:     'Practice declined offer terms; review marked failed',
    wouldAppendTo:   'future_dap_admin_decision_events',
  },
  {
    eventKey:        'provider_participation_confirmed_preview',
    eventType:       'dap.provider_participation.confirmed',
    sourceActionKey: 'confirm_provider_participation',
    entityType:      'provider_participation',
    decisionLabel:   'Provider Participation Confirmed',
    decisionOutcome: 'confirmed',
    reasonCode:      'provider_confirmed',
    reasonLabel:     'Provider submitted confirmation of participation in DAP',
    wouldAppendTo:   'future_dap_provider_participation_events',
  },
  {
    eventKey:        'provider_participation_declined_preview',
    eventType:       'dap.provider_participation.declined',
    sourceActionKey: 'decline_provider_participation',
    entityType:      'provider_participation',
    decisionLabel:   'Provider Participation Declined',
    decisionOutcome: 'declined',
    reasonCode:      'provider_declined',
    reasonLabel:     'Provider submitted declination of participation in DAP',
    wouldAppendTo:   'future_dap_provider_participation_events',
  },
  {
    eventKey:        'communication_approved_for_future_send_preview',
    eventType:       'dap.communication.approved_for_future_send',
    sourceActionKey: 'approve_communication_for_future_send',
    entityType:      'communication_dispatch',
    decisionLabel:   'Communication Approved for Future Send',
    decisionOutcome: 'approved',
    reasonCode:      'communication_approved',
    reasonLabel:     'Admin approved communication dispatch for future send queue',
    wouldAppendTo:   'future_dap_communication_approval_events',
  },
  {
    eventKey:        'communication_rejected_preview',
    eventType:       'dap.communication.rejected',
    sourceActionKey: 'reject_communication_for_future_send',
    entityType:      'communication_dispatch',
    decisionLabel:   'Communication Rejected',
    decisionOutcome: 'rejected',
    reasonCode:      'communication_rejected',
    reasonLabel:     'Admin rejected communication dispatch',
    wouldAppendTo:   'future_dap_communication_approval_events',
  },
  {
    eventKey:        'mkcrm_shadow_payload_approved_for_future_sync_preview',
    eventType:       'dap.mkcrm_shadow_payload.approved_for_future_sync',
    sourceActionKey: 'approve_mkcrm_shadow_payload_for_future_sync',
    entityType:      'mkcrm_shadow_payload',
    decisionLabel:   'MKCRM Shadow Payload Approved for Future Sync',
    decisionOutcome: 'approved',
    reasonCode:      'shadow_payload_approved',
    reasonLabel:     'Admin approved MKCRM shadow payload for future sync queue',
    wouldAppendTo:   'future_dap_mkcrm_shadow_approval_events',
  },
]

const DEFINITION_BY_KEY = new Map(
  LEDGER_DEFINITIONS.map(d => [d.eventKey, d])
)

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildDapAdminDecisionLedgerEvent(
  eventKey: DapAdminDecisionLedgerEventKey,
  ctx: DapActionAvailabilityContext,
  entityId = 'preview-entity-id',
): DapAdminDecisionLedgerEvent {
  const def = DEFINITION_BY_KEY.get(eventKey)
  if (!def) throw new Error(`Unknown ledger event key: ${eventKey}`)

  const actionDef = DAP_ACTION_DEFINITIONS.find(a => a.actionKey === def.sourceActionKey)
  if (!actionDef) throw new Error(`Unknown source action key: ${def.sourceActionKey}`)

  const evaluated = evaluateDapActionAvailability(actionDef, ctx)

  return {
    eventKey:           def.eventKey,
    eventType:          def.eventType,
    sourceActionKey:    def.sourceActionKey,
    entityType:         def.entityType,
    entityId,
    decisionLabel:      def.decisionLabel,
    decisionOutcome:    def.decisionOutcome,
    authoritySource:    actionDef.authoritySource,
    createdByRole:      'admin',
    createdAtPreview:   'preview — not a real timestamp',
    reasonCode:         def.reasonCode,
    reasonLabel:        def.reasonLabel,
    requiredGates:      evaluated.requiredGates,
    satisfiedGates:     evaluated.satisfiedGates,
    blockedBy:          evaluated.blockedBy,
    wouldAppendTo:      def.wouldAppendTo,
    actionAvailability: evaluated.availability,
    safetyFlags:        LEDGER_SAFETY,
  }
}

export function buildDapAdminDecisionLedger(
  ctx: DapActionAvailabilityContext,
  entityId = 'preview-entity-id',
): DapAdminDecisionLedgerEvent[] {
  return LEDGER_DEFINITIONS.map(def =>
    buildDapAdminDecisionLedgerEvent(def.eventKey, ctx, entityId)
  )
}

// ─── Fixture contexts (re-exported from Phase 12 for convenience) ─────────────

export {
  DAP_ACTION_CONTEXT_EMPTY  as DAP_LEDGER_CONTEXT_EMPTY,
  DAP_ACTION_CONTEXT_DEMO   as DAP_LEDGER_CONTEXT_DEMO,
  DAP_ACTION_CONTEXT_APPROVED as DAP_LEDGER_CONTEXT_APPROVED,
}

export { LEDGER_DEFINITIONS as DAP_LEDGER_DEFINITIONS }
