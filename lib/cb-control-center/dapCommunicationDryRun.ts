// Dry-run delivery is not delivery.
// A dry-run simulates what would happen if an approved communication were
// handed to a delivery layer, while preserving all delivery-disabled constraints.
// No email sending. No MKCRM calls. No Resend calls. No Supabase mutations.
// CB Control Center is the authority. MKCRM is not.

import { randomUUID } from 'crypto'

import type { DapCommunicationDryRunResult } from './dapCommunicationDryRunTypes'
import type { DapCommunicationApprovalDecision } from './dapCommunicationApprovalTypes'

import {
  getAllDapPracticeDecisionCommunicationApprovalPreviews,
  getAllDapMemberStatusCommunicationApprovalPreviews,
} from './dapCommunicationApprovals'

// ─── Dry-run blocker codes ────────────────────────────────────────────────────

export type DapDryRunBlockerCode =
  | 'approval_not_granted'
  | 'approval_event_not_granted'
  | 'approval_not_eligible'
  | 'shadow_payload_invalid'
  | 'invalid_decision_authority'
  | 'crm_authority_detected'
  | 'payment_authority_detected'
  | 'delivery_flags_unsafe'
  | 'safety_flags_unsafe'

// ─── Forbidden result field names ─────────────────────────────────────────────

const FORBIDDEN_DRY_RUN_FIELDS = new Set([
  'body', 'emailBody', 'html', 'text', 'subjectBody',
  'phi', 'patientName', 'diagnosis', 'treatment',
  'paymentCta', 'paymentLink', 'checkoutUrl', 'paymentMethod',
  'standing', 'storedStanding',
  'sentAt', 'deliveredAt', 'failedAt', 'openedAt', 'clickedAt', 'bouncedAt',
  'queuedAt', 'scheduledAt',
])

// ─── Runtime field reader (defense-in-depth) ──────────────────────────────────

function field(obj: unknown, key: string): unknown {
  return (obj as Record<string, unknown>)[key]
}

// ─── Recursive key collector ──────────────────────────────────────────────────

function collectAllKeys(obj: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return out
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    out.add(key)
    collectAllKeys(value, out)
  }
  return out
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface DapDryRunBuildOptions {
  adapter?:    'mkcrm_shadow' | 'resend_disabled'
  actor?:      { type: string; id: string }
  createdAt?:  string
  dryRunId?:   string
}

// ─── Core builder ─────────────────────────────────────────────────────────────

export function buildDapCommunicationDryRunFromApproval(
  approval: DapCommunicationApprovalDecision,
  options?: DapDryRunBuildOptions,
): DapCommunicationDryRunResult {
  const blockerCodes: DapDryRunBlockerCode[] = []

  // Approval status checks
  if (field(approval, 'approvalStatus') !== 'approved_for_future_send') {
    blockerCodes.push('approval_not_granted')
  }
  if (field(approval, 'approvalEventType') !== 'approval_granted_for_future_send') {
    blockerCodes.push('approval_event_not_granted')
  }
  if (field(approval, 'eligibleForApproval') !== true) {
    blockerCodes.push('approval_not_eligible')
  }
  if (field(approval, 'shadowPayloadValid') !== true) {
    blockerCodes.push('shadow_payload_invalid')
  }

  // Authority checks
  const src = field(approval, 'source') as Record<string, unknown>
  if (field(src, 'decisionAuthority') !== 'cb_control_center') {
    blockerCodes.push('invalid_decision_authority')
  }
  if (field(src, 'crmAuthority') !== false) {
    blockerCodes.push('crm_authority_detected')
  }
  if (field(src, 'paymentAuthority') !== false) {
    blockerCodes.push('payment_authority_detected')
  }

  // Delivery flag checks
  const del = field(approval, 'delivery') as Record<string, unknown>
  const deliveryFlagsOk =
    field(del, 'deliveryDisabled')      === true &&
    field(del, 'externalSendDisabled')  === true &&
    field(del, 'mkcrmDeliveryDisabled') === true &&
    field(del, 'resendDisabled')        === true
  if (!deliveryFlagsOk) {
    blockerCodes.push('delivery_flags_unsafe')
  }

  // Safety flag checks
  const saf = field(approval, 'safety') as Record<string, unknown>
  const safetyFlagsOk =
    field(saf, 'noPhi')            === true &&
    field(saf, 'noPaymentCta')     === true &&
    field(saf, 'noEmailBody')      === true &&
    field(saf, 'noStoredStanding') === true
  if (!safetyFlagsOk) {
    blockerCodes.push('safety_flags_unsafe')
  }

  const eligibleForDryRunDelivery = blockerCodes.length === 0

  const dryRunStatus: DapCommunicationDryRunResult['dryRunStatus'] =
    eligibleForDryRunDelivery ? 'dry_run_ready' : 'dry_run_blocked'

  const dryRunEventType: DapCommunicationDryRunResult['dryRunEventType'] =
    eligibleForDryRunDelivery ? 'dry_run_delivery_ready' : 'dry_run_delivery_blocked'

  return {
    dryRunId:                  options?.dryRunId  ?? randomUUID(),
    verticalKey:               'dap',
    communicationType:         approval.communicationType,
    templateKey:               approval.templateKey,
    audience:                  approval.audience,
    channel:                   approval.channel,
    adapter:                   options?.adapter ?? 'mkcrm_shadow',
    dryRunStatus,
    dryRunEventType,
    eligibleForDryRunDelivery,
    dryRunBlockerCodes:        [...blockerCodes],
    approvalStatus:            approval.approvalStatus,
    approvalEventType:         approval.approvalEventType,
    dispatchEventType:         approval.dispatchEventType,
    readinessStatus:           approval.readinessStatus,
    shadowPayloadValid:        approval.shadowPayloadValid,
    source: {
      decisionAuthority: 'cb_control_center',
      crmAuthority:      false,
      paymentAuthority:  false,
      ...(approval.source.billingSource
        ? { billingSource: approval.source.billingSource }
        : {}),
    },
    delivery: {
      dryRunOnly:            true,
      deliveryDisabled:      true,
      externalSendDisabled:  true,
      mkcrmDeliveryDisabled: true,
      resendDisabled:        true,
      queued:                false,
      scheduled:             false,
      sent:                  false,
    },
    safety: {
      noPhi:            true,
      noPaymentCta:     true,
      noEmailBody:      true,
      noStoredStanding: true,
    },
    createdAt: options?.createdAt ?? new Date().toISOString(),
  }
}

// ─── Bulk preview generators ──────────────────────────────────────────────────

export function getAllDapPracticeDecisionCommunicationDryRunPreviews(): DapCommunicationDryRunResult[] {
  return getAllDapPracticeDecisionCommunicationApprovalPreviews().map(approval =>
    buildDapCommunicationDryRunFromApproval(approval)
  )
}

export function getAllDapMemberStatusCommunicationDryRunPreviews(): DapCommunicationDryRunResult[] {
  return getAllDapMemberStatusCommunicationApprovalPreviews().map(approval =>
    buildDapCommunicationDryRunFromApproval(approval)
  )
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateDapCommunicationDryRunResult(result: unknown): void {
  const del = field(field(result, 'delivery'), 'dryRunOnly')
  if (del !== true) {
    throw new Error('Dry-run result must have delivery.dryRunOnly: true.')
  }
  if (field(field(result, 'delivery'), 'deliveryDisabled') !== true) {
    throw new Error('Dry-run result must have delivery.deliveryDisabled: true.')
  }
  if (field(field(result, 'delivery'), 'externalSendDisabled') !== true) {
    throw new Error('Dry-run result must have delivery.externalSendDisabled: true.')
  }
  if (field(field(result, 'delivery'), 'mkcrmDeliveryDisabled') !== true) {
    throw new Error('Dry-run result must have delivery.mkcrmDeliveryDisabled: true.')
  }
  if (field(field(result, 'delivery'), 'resendDisabled') !== true) {
    throw new Error('Dry-run result must have delivery.resendDisabled: true.')
  }
  if (field(field(result, 'delivery'), 'queued') !== false) {
    throw new Error('Dry-run result must have delivery.queued: false.')
  }
  if (field(field(result, 'delivery'), 'scheduled') !== false) {
    throw new Error('Dry-run result must have delivery.scheduled: false.')
  }
  if (field(field(result, 'delivery'), 'sent') !== false) {
    throw new Error('Dry-run result must have delivery.sent: false.')
  }

  const saf = field(result, 'safety')
  if (field(saf, 'noPhi') !== true) {
    throw new Error('Dry-run result must have safety.noPhi: true.')
  }
  if (field(saf, 'noPaymentCta') !== true) {
    throw new Error('Dry-run result must have safety.noPaymentCta: true.')
  }
  if (field(saf, 'noEmailBody') !== true) {
    throw new Error('Dry-run result must have safety.noEmailBody: true.')
  }
  if (field(saf, 'noStoredStanding') !== true) {
    throw new Error('Dry-run result must have safety.noStoredStanding: true.')
  }

  if (field(field(result, 'source'), 'crmAuthority') !== false) {
    throw new Error('Dry-run result must have source.crmAuthority: false.')
  }
  if (field(field(result, 'source'), 'paymentAuthority') !== false) {
    throw new Error('Dry-run result must have source.paymentAuthority: false.')
  }

  // Scan all nested keys for forbidden fields
  const allKeys = collectAllKeys(result)
  for (const key of allKeys) {
    if (FORBIDDEN_DRY_RUN_FIELDS.has(key)) {
      throw new Error(`Dry-run result contains forbidden field: '${key}'.`)
    }
  }
}
