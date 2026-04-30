// DAP Admin Decision Write Contract — type definitions.
// Phase 14 is validation-only. These types define the contract a future mutation
// endpoint must satisfy before it is ever allowed to append a decision event.
// No Supabase insert. No status mutation. No email. No payment. No MKCRM live sync.

import type {
  DapAdminDecisionLedgerEventKey,
  DapAdminDecisionEntityType,
  DapAdminDecisionWouldAppendTo,
} from './dapAdminDecisionLedgerTypes'

export type { DapAdminDecisionLedgerEventKey, DapAdminDecisionEntityType, DapAdminDecisionWouldAppendTo }

// ─── Contract key ─────────────────────────────────────────────────────────────

export type DapAdminDecisionWriteContractKey =
  | 'write_contract_practice_request_approved'
  | 'write_contract_practice_request_rejected'
  | 'write_contract_offer_terms_review_passed'
  | 'write_contract_offer_terms_review_failed'
  | 'write_contract_provider_participation_confirmed'
  | 'write_contract_provider_participation_declined'
  | 'write_contract_communication_approved_for_future_send'
  | 'write_contract_communication_rejected'
  | 'write_contract_mkcrm_shadow_payload_approved_for_future_sync'

// ─── Write eligibility ────────────────────────────────────────────────────────

export type DapAdminDecisionWriteEligibility =
  | 'eligible_for_future_write'
  | 'blocked'
  | 'preview_only'

// ─── Safety flags ─────────────────────────────────────────────────────────────
// All Phase 14 write contracts are validation-only. These are literal — tests assert them.

export interface DapAdminDecisionWriteContractSafetyFlags {
  readOnly:              true
  previewOnly:           true
  validatesOnly:         true
  appendsToSupabase:     false
  mutatesStatus:         false
  sendsEmail:            false
  queuesEmail:           false
  triggersPayment:       false
  triggersMkcrmLiveSync: false
  callsWebhook:          false
}

// ─── Write contract ───────────────────────────────────────────────────────────
// The full validation contract for a future decision write.
// Produced by buildDapAdminDecisionWriteContract(event: DapAdminDecisionLedgerEvent).

export interface DapAdminDecisionWriteContract {
  contractKey:           DapAdminDecisionWriteContractKey
  sourceEventKey:        DapAdminDecisionLedgerEventKey
  sourceActionKey:       string
  entityType:            DapAdminDecisionEntityType
  entityId:              string
  writeEligibility:      DapAdminDecisionWriteEligibility
  wouldAppendTo:         DapAdminDecisionWouldAppendTo
  requiredFields:        string[]
  forbiddenFields:       string[]
  authorityChecks:       string[]
  idempotencyKeyPreview: string
  validationMessages:    string[]
  blockedBy:             string[]
  safetyFlags:           DapAdminDecisionWriteContractSafetyFlags
}
