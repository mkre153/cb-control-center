// Practice and provider participation decisions are reviewed and managed by CB Control Center.
// MKCRM does not determine practice approval, rejection, public listing status,
// offer-term validation, or Join Plan CTA eligibility.
// No email sending, no payment processing, no PHI.

export type DapPracticeDecisionEmailTemplateKey =
  | 'practice_application_received'
  | 'practice_under_review'
  | 'practice_approved_internal_only'
  | 'practice_offer_terms_needed'
  | 'practice_join_cta_blocked'
  | 'practice_rejected'
  | 'practice_declined'
  | 'practice_participation_paused'

export type DapPracticeDecisionEmailAudience =
  | 'practice_admin'
  | 'provider'
  | 'internal_admin'

export interface DapPracticeDecisionEmailCopy {
  templateKey:              DapPracticeDecisionEmailTemplateKey
  audience:                 DapPracticeDecisionEmailAudience
  subject:                  string
  previewText:              string
  headline:                 string
  body:                     string[]
  primaryCtaLabel:          string | null
  primaryCtaHref:           string | null
  footerNote:               string
  includesPaymentCta:       false
  includesPhi:              false
  derivedFromBillingEvents: false
  decidedByCbControlCenter: true
  decidedByMkcrm:           false
}
