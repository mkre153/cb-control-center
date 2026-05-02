import type { DapOfferTermsDraftStatus } from '../dap/registry/dapOfferTermsTypes'
import type {
  DapOfferTermsReviewCriteria,
  DapOfferTermsReviewStatus,
} from '../dap/registry/dapOfferTermsReviewTypes'

// Only submitted_for_review drafts may enter the review gate.
export function isOfferTermsDraftEligibleForReview(
  draftStatus: DapOfferTermsDraftStatus,
): boolean {
  return draftStatus === 'submitted_for_review'
}

// Required criteria keys — all must be true for a review to be marked as passed.
const REQUIRED_CRITERIA_KEYS: ReadonlyArray<keyof Omit<DapOfferTermsReviewCriteria, 'reviewerNotes'>> = [
  'planNamePresent',
  'annualFeePresent',
  'preventiveCareDefined',
  'discountTermsDefined',
  'exclusionsDefined',
  'cancellationTermsDefined',
  'renewalTermsDefined',
]

export function evaluateOfferTermsReviewCriteria(
  criteria: DapOfferTermsReviewCriteria,
): boolean {
  return REQUIRED_CRITERIA_KEYS.every(k => criteria[k] === true)
}

// Review status transitions. No path leads to a public or provider-confirmation state.
const ALLOWED_REVIEW_TRANSITIONS: Partial<
  Record<DapOfferTermsReviewStatus, readonly DapOfferTermsReviewStatus[]>
> = {
  review_started:          ['review_passed', 'review_failed', 'clarification_requested'],
  review_passed:           [],
  review_failed:           ['clarification_requested'],
  clarification_requested: ['review_started'],
}

export function canTransitionDapOfferTermsReviewStatus(
  from: DapOfferTermsReviewStatus,
  to: DapOfferTermsReviewStatus,
): boolean {
  const allowed = ALLOWED_REVIEW_TRANSITIONS[from]
  if (!allowed) return false
  return (allowed as readonly string[]).includes(to)
}

export function assertValidDapOfferTermsReviewTransition(
  from: DapOfferTermsReviewStatus,
  to: DapOfferTermsReviewStatus,
): void {
  if (!canTransitionDapOfferTermsReviewStatus(from, to)) {
    throw new Error(`Invalid DAP offer terms review transition: '${from}' → '${to}'`)
  }
}
