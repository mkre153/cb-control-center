// DAP Admin Decision Ledger — type definitions.
// Phase 13 is read-only. The ledger previews what append-only events would be produced.
// No Supabase insert. No status update. No email. No payment. No MKCRM live sync.

import type { DapActionAvailability, DapActionAuthoritySource } from './dapActionCatalogTypes'

// ─── Event keys ───────────────────────────────────────────────────────────────

export type DapAdminDecisionLedgerEventKey =
  | 'practice_request_approved_preview'
  | 'practice_request_rejected_preview'
  | 'offer_terms_review_passed_preview'
  | 'offer_terms_review_failed_preview'
  | 'provider_participation_confirmed_preview'
  | 'provider_participation_declined_preview'
  | 'communication_approved_for_future_send_preview'
  | 'communication_rejected_preview'
  | 'mkcrm_shadow_payload_approved_for_future_sync_preview'

// ─── Outcome and entity types ─────────────────────────────────────────────────

export type DapAdminDecisionOutcome =
  | 'approved'
  | 'rejected'
  | 'passed'
  | 'failed'
  | 'confirmed'
  | 'declined'

export type DapAdminDecisionEntityType =
  | 'practice_request'
  | 'offer_terms_review'
  | 'provider_participation'
  | 'communication_dispatch'
  | 'mkcrm_shadow_payload'

// ─── wouldAppendTo ────────────────────────────────────────────────────────────
// Descriptive only — not actual table writes. Describes which future append-only
// event table this event would target if the action were later wired up.

export type DapAdminDecisionWouldAppendTo =
  | 'future_dap_admin_decision_events'
  | 'future_dap_communication_approval_events'
  | 'future_dap_provider_participation_events'
  | 'future_dap_mkcrm_shadow_approval_events'

// ─── Safety flags ─────────────────────────────────────────────────────────────
// All Phase 13 ledger events are preview-only. These are literal — tests assert them.

export interface DapAdminDecisionLedgerSafetyFlags {
  previewOnly:           true
  appendsToSupabase:     false
  mutatesStatus:         false
  sendsEmail:            false
  queuesEmail:           false
  triggersPayment:       false
  triggersMkcrmLiveSync: false
  includesPhi:           false
}

// ─── Ledger event ─────────────────────────────────────────────────────────────
// A simulated append-only decision event. All fields are audit-complete.
// actionAvailability reflects the Phase 12 catalog state for the source action.

export interface DapAdminDecisionLedgerEvent {
  eventKey:            DapAdminDecisionLedgerEventKey
  eventType:           string
  sourceActionKey:     string
  entityType:          DapAdminDecisionEntityType
  entityId:            string
  decisionLabel:       string
  decisionOutcome:     DapAdminDecisionOutcome
  authoritySource:     DapActionAuthoritySource
  createdByRole:       'admin'
  createdAtPreview:    string
  reasonCode:          string
  reasonLabel:         string
  requiredGates:       string[]
  satisfiedGates:      string[]
  blockedBy:           string[]
  wouldAppendTo:       DapAdminDecisionWouldAppendTo
  actionAvailability:  DapActionAvailability
  safetyFlags:         DapAdminDecisionLedgerSafetyFlags
}

// ─── Static ledger event definition ──────────────────────────────────────────
// The fixed, context-independent part of each ledger event.
// Dynamic fields (gates, blockedBy, entityId) are resolved at build time.

export interface DapAdminDecisionLedgerDefinition {
  eventKey:        DapAdminDecisionLedgerEventKey
  eventType:       string
  sourceActionKey: string
  entityType:      DapAdminDecisionEntityType
  decisionLabel:   string
  decisionOutcome: DapAdminDecisionOutcome
  reasonCode:      string
  reasonLabel:     string
  wouldAppendTo:   DapAdminDecisionWouldAppendTo
}
