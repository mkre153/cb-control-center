// DAP member standing is derived from append-only Client Builder Pro billing events.
// Notification copy reflects derived status only.
// MKCRM does not determine billing status.
// No email sending, no payment CTAs, no PHI.

import type { DapMemberStanding } from '../dap/membership/dapMemberStatusTypes'
import type { DapMemberStatusEmailCopy, DapMemberStatusEmailTemplateKey } from './dapMemberStatusEmailTypes'

// ─── Required footer note (locked language) ────────────────────────────────────

const FOOTER_NOTE =
  'This message reflects a derived status from append-only Client Builder Pro billing events. ' +
  'DAP does not manually set member standing, and MKCRM does not determine billing status.'

// ─── Standing → template key map ──────────────────────────────────────────────

const STANDING_TO_TEMPLATE_KEY: Record<DapMemberStanding, DapMemberStatusEmailTemplateKey> = {
  unknown:        'member_status_unknown',
  pending:        'member_status_pending',
  active:         'member_status_active',
  past_due:       'member_status_past_due',
  payment_failed: 'member_status_payment_failed',
  canceled:       'member_status_canceled',
  refunded:       'member_status_refunded',
  chargeback:     'member_status_chargeback',
}

// ─── Forbidden copy terms ──────────────────────────────────────────────────────

const FORBIDDEN_TERMS: string[] = [
  'pay now', 'update payment', 'subscribe', 'checkout', 'enter card',
  'billing portal', 'process payment', 'set standing', 'update standing',
  'store standing', 'mkcrm billing', 'mkcrm determines', 'payment processor',
  'diagnosis', 'treatment', 'procedure', 'insurance claim', 'card number',
  'ssn', 'date of birth', 'address',
]

// ─── Copy library ─────────────────────────────────────────────────────────────

const EMAIL_COPY: Record<DapMemberStanding, DapMemberStatusEmailCopy> = {
  unknown: {
    templateKey:              'member_status_unknown',
    audience:                 'member',
    standing:                 'unknown',
    subject:                  'Your Dental Advantage Plan status is not available yet',
    previewText:              'No billing events have been received for your membership.',
    headline:                 'Membership Status: Unknown',
    body: [
      'No Client Builder Pro billing events have been received for this membership.',
      'Your status will update automatically when billing events are recorded.',
      'If you believe this is an error, please contact your membership provider.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  pending: {
    templateKey:              'member_status_pending',
    audience:                 'member',
    standing:                 'pending',
    subject:                  'Your Dental Advantage Plan membership is pending',
    previewText:              'Your membership has started but has not yet been activated.',
    headline:                 'Membership Status: Pending',
    body: [
      'Your Dental Advantage Plan membership has been started.',
      'The latest Client Builder Pro billing event indicates your membership is pending activation.',
      'No further action is required at this time. Your status will update as new billing events are recorded.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  active: {
    templateKey:              'member_status_active',
    audience:                 'member',
    standing:                 'active',
    subject:                  'Your Dental Advantage Plan membership is active',
    previewText:              'Your membership is currently active.',
    headline:                 'Membership Status: Active',
    body: [
      'The latest Client Builder Pro billing event confirms your Dental Advantage Plan membership is active.',
      'You may use your membership benefits as outlined in your plan.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  past_due: {
    templateKey:              'member_status_past_due',
    audience:                 'member',
    standing:                 'past_due',
    subject:                  'Your Dental Advantage Plan membership is past due',
    previewText:              'Your membership has a past-due billing status.',
    headline:                 'Membership Status: Past Due',
    body: [
      'The latest Client Builder Pro billing event indicates your Dental Advantage Plan membership is past due.',
      'Your membership benefits may be limited until the billing status is resolved.',
      'Please contact your membership provider for assistance.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  payment_failed: {
    templateKey:              'member_status_payment_failed',
    audience:                 'member',
    standing:                 'payment_failed',
    subject:                  'Your Dental Advantage Plan payment could not be confirmed',
    previewText:              'Your most recent billing event indicates a payment issue.',
    headline:                 'Membership Status: Payment Could Not Be Confirmed',
    body: [
      'The latest Client Builder Pro billing event indicates payment could not be confirmed for your membership.',
      'Your membership benefits may be limited until the billing status is resolved.',
      'Please contact your membership provider for assistance.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  canceled: {
    templateKey:              'member_status_canceled',
    audience:                 'member',
    standing:                 'canceled',
    subject:                  'Your Dental Advantage Plan membership is canceled',
    previewText:              'Your membership has been canceled.',
    headline:                 'Membership Status: Canceled',
    body: [
      'The latest Client Builder Pro billing event indicates your Dental Advantage Plan membership has been canceled.',
      'If you believe this is an error, please contact your membership provider.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  refunded: {
    templateKey:              'member_status_refunded',
    audience:                 'member',
    standing:                 'refunded',
    subject:                  'Your Dental Advantage Plan refund has been recorded',
    previewText:              'A refund has been recorded for your membership.',
    headline:                 'Membership Status: Refunded',
    body: [
      'The latest Client Builder Pro billing event indicates a refund has been recorded for your Dental Advantage Plan membership.',
      'Please allow time for the refund to reflect through your provider.',
      'If you have questions, please contact your membership provider.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
  chargeback: {
    templateKey:              'member_status_chargeback',
    audience:                 'member',
    standing:                 'chargeback',
    subject:                  'Your Dental Advantage Plan membership needs review',
    previewText:              'Your membership has a billing event that requires review.',
    headline:                 'Membership Status: Needs Review',
    body: [
      'The latest Client Builder Pro billing event indicates a chargeback has been recorded for your Dental Advantage Plan membership.',
      'Your membership status is under review.',
      'Please contact your membership provider for assistance.',
    ],
    footerNote:               FOOTER_NOTE,
    includesPaymentCta:       false,
    includesPhi:              false,
    derivedFromBillingEvents: true,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function allCopyText(copy: DapMemberStatusEmailCopy): string[] {
  return [copy.subject, copy.previewText, copy.headline, ...copy.body, copy.footerNote]
}

// ─── Exported functions ───────────────────────────────────────────────────────

export function getDapMemberStatusEmailTemplateKey(
  standing: DapMemberStanding
): DapMemberStatusEmailTemplateKey {
  return STANDING_TO_TEMPLATE_KEY[standing]
}

export function getDapMemberStatusEmailCopy(standing: DapMemberStanding): DapMemberStatusEmailCopy {
  return EMAIL_COPY[standing]
}

export function isDapMemberStatusEmailCopySafe(copy: DapMemberStatusEmailCopy): boolean {
  if (copy.includesPaymentCta !== false) return false
  if (copy.includesPhi !== false) return false
  if (copy.derivedFromBillingEvents !== true) return false
  const texts = allCopyText(copy)
  return !texts.some(text => {
    const lower = text.toLowerCase()
    return FORBIDDEN_TERMS.some(term => lower.includes(term))
  })
}

export function assertDapMemberStatusEmailCopySafe(copy: DapMemberStatusEmailCopy): void {
  if (copy.includesPaymentCta !== false) {
    throw new Error('Email copy must have includesPaymentCta: false')
  }
  if (copy.includesPhi !== false) {
    throw new Error('Email copy must have includesPhi: false')
  }
  if (copy.derivedFromBillingEvents !== true) {
    throw new Error('Email copy must have derivedFromBillingEvents: true')
  }
  for (const text of allCopyText(copy)) {
    const lower = text.toLowerCase()
    for (const term of FORBIDDEN_TERMS) {
      if (lower.includes(term)) {
        throw new Error(`Forbidden term in email copy: '${term}'`)
      }
    }
  }
}
