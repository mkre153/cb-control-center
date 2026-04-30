// Practice and provider participation decisions are reviewed and managed by CB Control Center.
// MKCRM does not determine practice approval, rejection, public listing status,
// offer-term validation, or Join Plan CTA eligibility.
// Preview-only — no email sending.

import type { DapPracticeDecisionEmailCopy, DapPracticeDecisionEmailTemplateKey } from './dapPracticeDecisionEmailTypes'
import { getDapPracticeDecisionEmailCopy, getAllDapPracticeDecisionEmailCopy } from './dapPracticeDecisionEmailCopy'

// ─── Result type ──────────────────────────────────────────────────────────────

export interface DapPracticeDecisionEmailPreview {
  templateKey: DapPracticeDecisionEmailTemplateKey
  copy:        DapPracticeDecisionEmailCopy
  source: {
    decisionAuthority:  'cb_control_center'
    crmAuthority:       false
    paymentAuthority:   false
    includesPaymentCta: false
    includesPhi:        false
  }
}

// ─── Preview for a single template ───────────────────────────────────────────

export function getDapPracticeDecisionEmailPreview(
  templateKey: DapPracticeDecisionEmailTemplateKey
): DapPracticeDecisionEmailPreview {
  const copy = getDapPracticeDecisionEmailCopy(templateKey)
  return {
    templateKey,
    copy,
    source: {
      decisionAuthority:  'cb_control_center',
      crmAuthority:       false,
      paymentAuthority:   false,
      includesPaymentCta: false,
      includesPhi:        false,
    },
  }
}

// ─── All eight template previews ──────────────────────────────────────────────

export function getAllDapPracticeDecisionEmailPreviews(): DapPracticeDecisionEmailPreview[] {
  return getAllDapPracticeDecisionEmailCopy().map(copy => ({
    templateKey: copy.templateKey,
    copy,
    source: {
      decisionAuthority:  'cb_control_center' as const,
      crmAuthority:       false as const,
      paymentAuthority:   false as const,
      includesPaymentCta: false as const,
      includesPhi:        false as const,
    },
  }))
}
