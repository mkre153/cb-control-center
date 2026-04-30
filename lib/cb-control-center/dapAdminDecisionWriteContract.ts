// DAP Admin Decision Write Contract — Phase 14 validation-only contract builder.
// Takes a Phase 13 ledger event and produces the write contract that a future
// mutation endpoint must satisfy before appending a decision event.
// No Supabase insert. No status mutation. No email. No payment. No MKCRM live sync.

import type { DapAdminDecisionLedgerEvent } from './dapAdminDecisionLedgerTypes'
import type {
  DapAdminDecisionWriteContract,
  DapAdminDecisionWriteContractKey,
  DapAdminDecisionWriteContractSafetyFlags,
  DapAdminDecisionWriteEligibility,
} from './dapAdminDecisionWriteContractTypes'
import type { DapAdminDecisionEntityType } from './dapAdminDecisionLedgerTypes'
import type { DapActionAuthoritySource } from './dapActionCatalogTypes'
import {
  buildDapAdminDecisionLedger,
  DAP_LEDGER_CONTEXT_DEMO,
  DAP_LEDGER_CONTEXT_APPROVED,
  DAP_LEDGER_CONTEXT_EMPTY,
} from './dapAdminDecisionLedger'

export type { DapAdminDecisionLedgerEvent }

// ─── Safety constant ──────────────────────────────────────────────────────────

export const WRITE_CONTRACT_SAFETY: DapAdminDecisionWriteContractSafetyFlags = {
  readOnly:              true,
  previewOnly:           true,
  validatesOnly:         true,
  appendsToSupabase:     false,
  mutatesStatus:         false,
  sendsEmail:            false,
  queuesEmail:           false,
  triggersPayment:       false,
  triggersMkcrmLiveSync: false,
  callsWebhook:          false,
}

// ─── Forbidden fields (universal) ────────────────────────────────────────────
// These field names must never appear in a write payload for any event type.

export const WRITE_CONTRACT_FORBIDDEN_FIELDS: string[] = [
  'mutate',
  'execute',
  'syncNow',
  'sendEmail',
  'queueEmail',
  'triggerPayment',
  'webhook',
  'post',
  'patch',
  'insert',
  'update',
  'delete',
]

// ─── Event key → contract key mapping ────────────────────────────────────────

const EVENT_TO_CONTRACT_KEY: Record<
  DapAdminDecisionLedgerEvent['eventKey'],
  DapAdminDecisionWriteContractKey
> = {
  practice_request_approved_preview:
    'write_contract_practice_request_approved',
  practice_request_rejected_preview:
    'write_contract_practice_request_rejected',
  offer_terms_review_passed_preview:
    'write_contract_offer_terms_review_passed',
  offer_terms_review_failed_preview:
    'write_contract_offer_terms_review_failed',
  provider_participation_confirmed_preview:
    'write_contract_provider_participation_confirmed',
  provider_participation_declined_preview:
    'write_contract_provider_participation_declined',
  communication_approved_for_future_send_preview:
    'write_contract_communication_approved_for_future_send',
  communication_rejected_preview:
    'write_contract_communication_rejected',
  mkcrm_shadow_payload_approved_for_future_sync_preview:
    'write_contract_mkcrm_shadow_payload_approved_for_future_sync',
}

// ─── Required fields per entity type ─────────────────────────────────────────

const REQUIRED_FIELDS_BY_ENTITY: Record<DapAdminDecisionEntityType, string[]> = {
  practice_request: [
    'requestId',
    'adminUserId',
    'decisionOutcome',
    'reasonCode',
    'reasonLabel',
    'decidedAt',
    'requiredGatesSatisfied',
  ],
  offer_terms_review: [
    'requestId',
    'adminUserId',
    'reviewOutcome',
    'reasonCode',
    'reviewedAt',
    'requiredGatesSatisfied',
  ],
  provider_participation: [
    'practiceId',
    'providerUserId',
    'participationDecision',
    'decidedAt',
    'requiredGatesSatisfied',
  ],
  communication_dispatch: [
    'communicationId',
    'adminUserId',
    'approvalOutcome',
    'reasonCode',
    'approvedAt',
    'requiredGatesSatisfied',
  ],
  mkcrm_shadow_payload: [
    'shadowPayloadId',
    'adminUserId',
    'approvalOutcome',
    'approvedAt',
    'requiredGatesSatisfied',
  ],
}

// ─── Authority checks per authoritySource ────────────────────────────────────

function getAuthorityChecks(authoritySource: DapActionAuthoritySource): string[] {
  switch (authoritySource) {
    case 'cb_control_center':
      return [
        'cb_control_center must be the decision authority',
        'client_builder_pro must not be the write authority for this event',
        'mkcrm must not be the decision authority — it is shadow/reference only',
        'admin user must have cb_control_center role',
      ]
    case 'provider_submission':
      return [
        'provider must have submitted the participation decision themselves',
        'cb_control_center records the outcome but does not decide it on behalf of the provider',
        'mkcrm must not be the decision authority — it is shadow/reference only',
      ]
    case 'mkcrm_shadow':
      return [
        'cb_control_center must approve the shadow payload — mkcrm does not self-approve',
        'mkcrm is shadow/reference only — it is not a write authority',
        'admin user must have cb_control_center role',
      ]
    case 'client_builder_pro':
      return [
        'client_builder_pro is the payment/market authority — not an admin decision authority',
      ]
    case 'public_member_page':
      return [
        'public_member_page is a read-only surface — not an admin decision authority',
      ]
  }
}

// ─── Write eligibility ────────────────────────────────────────────────────────

function deriveWriteEligibility(
  event: DapAdminDecisionLedgerEvent,
): DapAdminDecisionWriteEligibility {
  switch (event.actionAvailability) {
    case 'available':     return 'eligible_for_future_write'
    case 'blocked':       return 'blocked'
    case 'future_only':   return 'preview_only'
    case 'preview_only':  return 'preview_only'
  }
}

// ─── Validation messages ──────────────────────────────────────────────────────

function buildValidationMessages(
  event: DapAdminDecisionLedgerEvent,
  eligibility: DapAdminDecisionWriteEligibility,
): string[] {
  switch (eligibility) {
    case 'eligible_for_future_write':
      return [
        'All required gates are satisfied — write is eligible',
        'Entity ID must be present and non-empty',
        'All required fields must be present in the write payload',
        'No forbidden fields may appear in the write payload',
        'Authority checks must pass before write is accepted',
        'Idempotency key must be unique per (sourceActionKey, entityId) pair',
        'decidedAt must be a valid ISO 8601 timestamp',
        'decisionOutcome must match the event definition — no override allowed',
      ]
    case 'blocked':
      return [
        `Write is blocked — required gates not satisfied: ${event.blockedBy.join(', ')}`,
        'All required gates must be satisfied before this write is eligible',
        'Resolve blockers first, then re-evaluate write eligibility',
      ]
    case 'preview_only':
      return [
        'This event type is future-only — no write path exists yet',
        'A future phase will wire up this write path behind appropriate guardrails',
        'No write will be accepted for this event until the future phase is implemented',
      ]
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildDapAdminDecisionWriteContract(
  event: DapAdminDecisionLedgerEvent,
): DapAdminDecisionWriteContract {
  const contractKey = EVENT_TO_CONTRACT_KEY[event.eventKey]
  if (!contractKey) throw new Error(`No contract key for event: ${event.eventKey}`)

  const writeEligibility = deriveWriteEligibility(event)

  return {
    contractKey,
    sourceEventKey:        event.eventKey,
    sourceActionKey:       event.sourceActionKey,
    entityType:            event.entityType,
    entityId:              event.entityId,
    writeEligibility,
    wouldAppendTo:         event.wouldAppendTo,
    requiredFields:        REQUIRED_FIELDS_BY_ENTITY[event.entityType],
    forbiddenFields:       WRITE_CONTRACT_FORBIDDEN_FIELDS,
    authorityChecks:       getAuthorityChecks(event.authoritySource),
    idempotencyKeyPreview: `preview:${event.sourceActionKey}:${event.entityId}`,
    validationMessages:    buildValidationMessages(event, writeEligibility),
    blockedBy:             event.blockedBy,
    safetyFlags:           WRITE_CONTRACT_SAFETY,
  }
}

export function buildDapAdminDecisionWriteContracts(
  events: DapAdminDecisionLedgerEvent[],
): DapAdminDecisionWriteContract[] {
  return events.map(buildDapAdminDecisionWriteContract)
}

// ─── Fixture contexts ─────────────────────────────────────────────────────────

export function buildWriteContractsFromDemoContext(): DapAdminDecisionWriteContract[] {
  return buildDapAdminDecisionWriteContracts(
    buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO),
  )
}

export function buildWriteContractsFromApprovedContext(): DapAdminDecisionWriteContract[] {
  return buildDapAdminDecisionWriteContracts(
    buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_APPROVED),
  )
}

export function buildWriteContractsFromEmptyContext(): DapAdminDecisionWriteContract[] {
  return buildDapAdminDecisionWriteContracts(
    buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_EMPTY),
  )
}

export {
  DAP_LEDGER_CONTEXT_DEMO   as DAP_WRITE_CONTRACT_CONTEXT_DEMO,
  DAP_LEDGER_CONTEXT_APPROVED as DAP_WRITE_CONTRACT_CONTEXT_APPROVED,
  DAP_LEDGER_CONTEXT_EMPTY  as DAP_WRITE_CONTRACT_CONTEXT_EMPTY,
}
