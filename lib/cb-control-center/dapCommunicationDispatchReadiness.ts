// Dispatch readiness is computed from existing preview/source/safety data.
// No email sending, no MKCRM calls, no Supabase mutations.
// Previewable does not mean sendable.
// CB Control Center determines eligibility. MKCRM does not.

import type { DapCommunicationDispatchReadiness, DapCommunicationDispatchBlocker, DapCommunicationDispatchAudience } from './dapCommunicationDispatchTypes'
import type { DapPracticeDecisionEmailPreview }  from './dapPracticeDecisionEmailPreview'
import type { DapMemberStatusEmailPreview }       from './dapMemberStatusEmailPreview'
import type { DapAdminRejectionEmailPreview }     from './dapAdminRejectionEmailPreview'
import type { DapRejectionEmailQueueEntry }       from './dapRejectionEmailQueue'
import { getAllDapPracticeDecisionEmailPreviews } from './dapPracticeDecisionEmailPreview'
import { getAllDapMemberStatusEmailPreviews }     from './dapMemberStatusEmailPreview'
import { getAllDapAdminRejectionEmailPreviews }   from './dapAdminRejectionEmailPreview'
import { isDapPracticeDecisionEmailCopySafe }     from './dapPracticeDecisionEmailCopy'
import { isDapMemberStatusEmailCopySafe }         from './dapMemberStatusEmailCopy'
import { isDapAdminRejectionEmailCopySafe }       from './dapAdminRejectionEmailCopy'

// ─── Runtime field reader (defense-in-depth against cast-injected bad data) ───

function field(obj: unknown, key: string): unknown {
  return (obj as Record<string, unknown>)[key]
}

// ─── Audience mapping ─────────────────────────────────────────────────────────

function mapPracticeAudience(
  audience: 'practice_admin' | 'provider' | 'internal_admin'
): DapCommunicationDispatchAudience {
  switch (audience) {
    case 'practice_admin': return 'practice'
    case 'provider':       return 'practice'
    case 'internal_admin': return 'admin'
  }
}

// ─── Readiness builder ────────────────────────────────────────────────────────

function resolveReadiness(
  templateKey:  string,
  audience:     DapCommunicationDispatchAudience,
  blockers:     DapCommunicationDispatchBlocker[],
  copySafe:     boolean,
  billingSource?: 'client_builder_pro',
): DapCommunicationDispatchReadiness {
  const hasBlocking = blockers.some(b => b.severity === 'blocking')
  return {
    templateKey,
    audience,
    channel:                   'email',
    status:                    hasBlocking ? 'blocked' : 'ready_for_review',
    eligibleForFutureDispatch: !hasBlocking,
    blockers,
    source: {
      decisionAuthority: 'cb_control_center',
      crmAuthority:      false,
      paymentAuthority:  false,
      ...(billingSource ? { billingSource } : {}),
    },
    safety: {
      copySafe,
      includesPaymentCta:       false,
      includesPhi:              false,
      decidedByMkcrm:           false,
      decidedByCbControlCenter: true,
    },
  }
}

// ─── Practice decision email dispatch readiness ───────────────────────────────

export function getDapPracticeDecisionEmailDispatchReadiness(
  preview: DapPracticeDecisionEmailPreview
): DapCommunicationDispatchReadiness {
  const { copy, source } = preview
  const blockers: DapCommunicationDispatchBlocker[] = []

  if (field(source, 'decisionAuthority') !== 'cb_control_center') {
    blockers.push({
      code:     'missing_cb_control_center_authority',
      message:  'source.decisionAuthority must be cb_control_center.',
      severity: 'blocking',
    })
  }

  if (field(source, 'crmAuthority') !== false) {
    blockers.push({
      code:     'mkcrm_authority_detected',
      message:  'source.crmAuthority must be false. MKCRM does not determine practice decisions.',
      severity: 'blocking',
    })
  }

  if (field(source, 'paymentAuthority') !== false) {
    blockers.push({
      code:     'payment_authority_detected',
      message:  'source.paymentAuthority must be false.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'includesPaymentCta') !== false) {
    blockers.push({
      code:     'payment_cta_detected',
      message:  'copy.includesPaymentCta must be false.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'includesPhi') !== false) {
    blockers.push({
      code:     'phi_detected',
      message:  'copy.includesPhi must be false. No PHI in practice decision communications.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'decidedByCbControlCenter') !== true) {
    blockers.push({
      code:     'missing_cb_control_center_authority',
      message:  'copy.decidedByCbControlCenter must be true.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'decidedByMkcrm') !== false) {
    blockers.push({
      code:     'mkcrm_authority_detected',
      message:  'copy.decidedByMkcrm must be false. MKCRM does not decide practice communications.',
      severity: 'blocking',
    })
  }

  const copySafe = isDapPracticeDecisionEmailCopySafe(copy)
  if (!copySafe) {
    blockers.push({
      code:     'unsafe_copy',
      message:  'Copy did not pass safety scan (forbidden terms or flags).',
      severity: 'blocking',
    })
  }

  const audience = mapPracticeAudience(copy.audience)
  return resolveReadiness(copy.templateKey, audience, blockers, copySafe)
}

export function getAllDapPracticeDecisionEmailDispatchReadiness(): DapCommunicationDispatchReadiness[] {
  return getAllDapPracticeDecisionEmailPreviews().map(getDapPracticeDecisionEmailDispatchReadiness)
}

// ─── Member status email dispatch readiness ───────────────────────────────────

export function getDapMemberStatusEmailDispatchReadiness(
  preview: DapMemberStatusEmailPreview
): DapCommunicationDispatchReadiness {
  const { copy, source } = preview
  const blockers: DapCommunicationDispatchBlocker[] = []

  if (field(source, 'billingSource') !== 'client_builder_pro') {
    blockers.push({
      code:     'missing_billing_event_source',
      message:  'source.billingSource must be client_builder_pro.',
      severity: 'blocking',
    })
  }

  if (field(source, 'crmAuthority') !== false) {
    blockers.push({
      code:     'mkcrm_authority_detected',
      message:  'source.crmAuthority must be false. MKCRM does not determine member standing.',
      severity: 'blocking',
    })
  }

  if (field(source, 'derivedFromBillingEvents') !== true) {
    blockers.push({
      code:     'standing_not_derived',
      message:  'source.derivedFromBillingEvents must be true. Standing must come from billing events.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'derivedFromBillingEvents') !== true) {
    blockers.push({
      code:     'standing_not_derived',
      message:  'copy.derivedFromBillingEvents must be true. Member standing must be billing-derived.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'includesPaymentCta') !== false) {
    blockers.push({
      code:     'payment_cta_detected',
      message:  'copy.includesPaymentCta must be false.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'includesPhi') !== false) {
    blockers.push({
      code:     'phi_detected',
      message:  'copy.includesPhi must be false. No PHI in member status communications.',
      severity: 'blocking',
    })
  }

  const copySafe = isDapMemberStatusEmailCopySafe(copy)
  if (!copySafe) {
    blockers.push({
      code:     'unsafe_copy',
      message:  'Copy did not pass safety scan (forbidden terms or flags).',
      severity: 'blocking',
    })
  }

  return resolveReadiness(
    copy.templateKey,
    'member',
    blockers,
    copySafe,
    'client_builder_pro',
  )
}

export function getAllDapMemberStatusEmailDispatchReadiness(): DapCommunicationDispatchReadiness[] {
  return getAllDapMemberStatusEmailPreviews().map(getDapMemberStatusEmailDispatchReadiness)
}

// ─── Admin rejection email dispatch readiness ─────────────────────────────────

export function getDapAdminRejectionEmailDispatchReadiness(
  preview: DapAdminRejectionEmailPreview,
  queueEntry: DapRejectionEmailQueueEntry | null,
): DapCommunicationDispatchReadiness {
  const { copy, source } = preview
  const blockers: DapCommunicationDispatchBlocker[] = []

  if (queueEntry === null) {
    blockers.push({
      code:     'missing_operational_decision',
      message:  'No request_rejected event. Rejection email cannot be dispatched without a confirmed rejection decision.',
      severity: 'blocking',
    })
  }

  if (field(source, 'decisionAuthority') !== 'cb_control_center') {
    blockers.push({
      code:     'missing_cb_control_center_authority',
      message:  'source.decisionAuthority must be cb_control_center.',
      severity: 'blocking',
    })
  }

  if (field(source, 'crmAuthority') !== false) {
    blockers.push({
      code:     'mkcrm_authority_detected',
      message:  'source.crmAuthority must be false. MKCRM does not decide rejections.',
      severity: 'blocking',
    })
  }

  if (field(source, 'paymentAuthority') !== false) {
    blockers.push({
      code:     'payment_authority_detected',
      message:  'source.paymentAuthority must be false. Payment systems have no rejection authority.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'includesPaymentCta') !== false) {
    blockers.push({
      code:     'payment_cta_detected',
      message:  'copy.includesPaymentCta must be false.',
      severity: 'blocking',
    })
  }

  if (field(copy, 'includesPhi') !== false) {
    blockers.push({
      code:     'phi_detected',
      message:  'copy.includesPhi must be false. No PHI in rejection communications.',
      severity: 'blocking',
    })
  }

  const copySafe = isDapAdminRejectionEmailCopySafe(copy)
  if (!copySafe) {
    blockers.push({
      code:     'unsafe_copy',
      message:  'Copy did not pass safety scan (forbidden terms or flags).',
      severity: 'blocking',
    })
  }

  const audience = copy.audience === 'member' ? 'member' : 'practice' as DapCommunicationDispatchAudience
  return resolveReadiness(copy.templateKey, audience, blockers, copySafe)
}

export function getAllDapAdminRejectionEmailDispatchReadiness(): DapCommunicationDispatchReadiness[] {
  return getAllDapAdminRejectionEmailPreviews().map(preview =>
    getDapAdminRejectionEmailDispatchReadiness(preview, null)
  )
}
