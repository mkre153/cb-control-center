// Practice and provider participation decisions are reviewed and managed by CB Control Center.
// MKCRM does not determine practice approval, rejection, public listing status,
// offer-term validation, or Join Plan CTA eligibility.
// No email sending, no payment processing, no PHI.

import type { DapPracticeDecisionEmailCopy, DapPracticeDecisionEmailTemplateKey } from './dapPracticeDecisionEmailTypes'

// ─── Required footer note (locked language) ────────────────────────────────────

export const DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE =
  'Practice and provider participation decisions are reviewed and managed by CB Control Center. ' +
  'MKCRM may support communication workflows, but it does not determine practice approval, ' +
  'rejection, public listing status, offer-term validation, or Join Plan CTA eligibility.'

// ─── Forbidden terms ──────────────────────────────────────────────────────────

export const DAP_PRACTICE_DECISION_EMAIL_FORBIDDEN_TERMS = [
  'mkcrm approved',
  'mkcrm rejected',
  'mkcrm declined',
  'mkcrm determines',
  'mkcrm decided',
  'your plan is live',
  'join plan is active',
  'guaranteed listing',
  'guaranteed enrollment',
  'guaranteed pricing',
  'payment processor',
  'process payment',
  'enter card',
  'billing portal',
  'subscribe',
  'checkout',
  'diagnosis',
  'treatment plan',
  'insurance claim',
  'date of birth',
  'ssn',
] as const

// ─── Copy library ─────────────────────────────────────────────────────────────

const FOOTER = DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE

const EMAIL_COPY: Record<DapPracticeDecisionEmailTemplateKey, DapPracticeDecisionEmailCopy> = {
  practice_application_received: {
    templateKey:              'practice_application_received',
    audience:                 'practice_admin',
    subject:                  'Your Dental Advantage Plan application has been received',
    previewText:              'We have received your practice application and it is now in queue for review.',
    headline:                 'Application Received',
    body: [
      'Your Dental Advantage Plan practice application has been received by CB Control Center.',
      'No approval has been granted at this time. Your application will be reviewed and you will be notified of next steps.',
      'Patient-facing actions, public listing, and Join Plan eligibility are not active until CB Control Center completes its review.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_under_review: {
    templateKey:              'practice_under_review',
    audience:                 'practice_admin',
    subject:                  'Your Dental Advantage Plan application is under review',
    previewText:              'CB Control Center is actively reviewing your practice application.',
    headline:                 'Application Under Review',
    body: [
      'CB Control Center is actively reviewing your Dental Advantage Plan application.',
      'No patient-facing actions, public listing, or Join Plan CTA eligibility will be enabled while review is in progress.',
      'You will be contacted when a decision has been made. No action is required from you at this time.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_approved_internal_only: {
    templateKey:              'practice_approved_internal_only',
    audience:                 'internal_admin',
    subject:                  '[Internal] Practice cleared internally — public listing not yet active',
    previewText:              'Internal clearance recorded. This practice is not yet listed publicly.',
    headline:                 'Internal Clearance Recorded — Not Publicly Listed',
    body: [
      'CB Control Center has recorded an internal clearance for this practice.',
      'This is an internal status only. The practice is not yet listed publicly as a DAP provider.',
      'Offer terms must be validated and all required gates must pass before any patient-facing or public listing actions are enabled.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_offer_terms_needed: {
    templateKey:              'practice_offer_terms_needed',
    audience:                 'practice_admin',
    subject:                  'Action needed: Offer terms required for your Dental Advantage Plan participation',
    previewText:              'CB Control Center requires offer terms before enabling patient-facing actions.',
    headline:                 'Offer Terms Required',
    body: [
      'CB Control Center has determined that offer terms are required before your practice can proceed.',
      'Patient-facing actions, public listing, and Join Plan CTA eligibility remain inactive until offer terms are submitted and validated.',
      'Please contact your CB Control Center representative to provide the required offer terms.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_join_cta_blocked: {
    templateKey:              'practice_join_cta_blocked',
    audience:                 'practice_admin',
    subject:                  'Join Plan CTA is currently blocked for your practice',
    previewText:              'Multiple eligibility gates must pass before the Join Plan CTA can be activated.',
    headline:                 'Join Plan CTA Blocked',
    body: [
      'CB Control Center has determined that your practice does not currently meet all requirements for Join Plan CTA eligibility.',
      'The Join Plan CTA will not be displayed to patients until all required gates pass.',
      'This determination is made by CB Control Center and is independent of any CRM communication workflows.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_rejected: {
    templateKey:              'practice_rejected',
    audience:                 'practice_admin',
    subject:                  'Your Dental Advantage Plan application has not been approved',
    previewText:              'CB Control Center has reviewed your application and it has not been approved.',
    headline:                 'Application Not Approved',
    body: [
      'CB Control Center has reviewed your Dental Advantage Plan application and it has not been approved at this time.',
      'This decision was made by CB Control Center and is not determined by any CRM or payment system.',
      'If you have questions about this decision, please contact CB Control Center directly.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_declined: {
    templateKey:              'practice_declined',
    audience:                 'practice_admin',
    subject:                  'Your Dental Advantage Plan participation has been marked declined',
    previewText:              'Your practice has been marked as declined by CB Control Center.',
    headline:                 'Participation Declined',
    body: [
      'CB Control Center has marked your practice as declined for Dental Advantage Plan participation.',
      'Your practice will not be shown as an active DAP provider.',
      'This status was set by CB Control Center. Please contact CB Control Center if you believe this is in error.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },

  practice_participation_paused: {
    templateKey:              'practice_participation_paused',
    audience:                 'practice_admin',
    subject:                  'Your Dental Advantage Plan participation has been paused',
    previewText:              'Patient-facing actions for your practice are temporarily inactive.',
    headline:                 'Participation Paused',
    body: [
      'CB Control Center has paused your Dental Advantage Plan participation.',
      'Patient-facing actions, public listing, and Join Plan CTA eligibility are inactive while participation is paused.',
      'This determination is made by CB Control Center. Contact CB Control Center for more information.',
    ],
    primaryCtaLabel:          null,
    primaryCtaHref:           null,
    footerNote:               FOOTER,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: false,
    decidedByCbControlCenter: true,
    decidedByMkcrm:           false,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function allCopyText(copy: DapPracticeDecisionEmailCopy): string[] {
  return [
    copy.subject,
    copy.previewText,
    copy.headline,
    ...copy.body,
    copy.primaryCtaLabel ?? '',
    copy.primaryCtaHref  ?? '',
    copy.footerNote,
  ]
}

// ─── Exported functions ───────────────────────────────────────────────────────

export function getDapPracticeDecisionEmailCopy(
  templateKey: DapPracticeDecisionEmailTemplateKey
): DapPracticeDecisionEmailCopy {
  return EMAIL_COPY[templateKey]
}

export function getAllDapPracticeDecisionEmailCopy(): DapPracticeDecisionEmailCopy[] {
  return Object.values(EMAIL_COPY)
}

export function isDapPracticeDecisionEmailCopySafe(copy: DapPracticeDecisionEmailCopy): boolean {
  if (copy.includesPaymentCta       !== false) return false
  if (copy.includesPhi              !== false) return false
  if (copy.derivedFromBillingEvents !== false) return false
  if (copy.decidedByCbControlCenter !== true)  return false
  if (copy.decidedByMkcrm           !== false) return false
  const texts = allCopyText(copy)
  return !texts.some(text => {
    const lower = text.toLowerCase()
    return DAP_PRACTICE_DECISION_EMAIL_FORBIDDEN_TERMS.some(term => lower.includes(term))
  })
}

export function assertDapPracticeDecisionEmailCopySafe(
  copy: DapPracticeDecisionEmailCopy
): DapPracticeDecisionEmailCopy {
  if (copy.includesPaymentCta !== false) {
    throw new Error('Practice decision email copy must have includesPaymentCta: false')
  }
  if (copy.includesPhi !== false) {
    throw new Error('Practice decision email copy must have includesPhi: false')
  }
  if (copy.derivedFromBillingEvents !== false) {
    throw new Error('Practice decision email copy must have derivedFromBillingEvents: false')
  }
  if (copy.decidedByCbControlCenter !== true) {
    throw new Error('Practice decision email copy must have decidedByCbControlCenter: true')
  }
  if (copy.decidedByMkcrm !== false) {
    throw new Error('Practice decision email copy must have decidedByMkcrm: false')
  }
  for (const text of allCopyText(copy)) {
    const lower = text.toLowerCase()
    for (const term of DAP_PRACTICE_DECISION_EMAIL_FORBIDDEN_TERMS) {
      if (lower.includes(term)) {
        throw new Error(`Forbidden term in practice decision email copy: '${term}'`)
      }
    }
  }
  return copy
}
