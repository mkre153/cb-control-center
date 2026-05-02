import type { DapOfferTermsDraftStatus } from '../dap/registry/dapOfferTermsTypes'
import type { DapPracticeOnboardingStatus } from '../dap/registry/dapPracticeOnboardingTypes'

// Only interested and terms_needed intakes may begin offer terms collection.
const ELIGIBLE_ONBOARDING_STATUSES = new Set<DapPracticeOnboardingStatus>([
  'interested',
  'terms_needed',
])

export function isOnboardingEligibleForOfferTermsCollection(
  status: DapPracticeOnboardingStatus,
): boolean {
  return ELIGIBLE_ONBOARDING_STATUSES.has(status)
}

// Offer terms draft transitions. No path leads to validated, approved, or public.
const ALLOWED_OFFER_TERMS_TRANSITIONS: Partial<
  Record<DapOfferTermsDraftStatus, readonly DapOfferTermsDraftStatus[]>
> = {
  draft_created:        ['collecting_terms', 'submitted_for_review'],
  collecting_terms:     ['submitted_for_review', 'needs_clarification'],
  submitted_for_review: ['needs_clarification'],
  needs_clarification:  ['collecting_terms', 'submitted_for_review'],
}

export function canTransitionDapOfferTermsStatus(
  from: DapOfferTermsDraftStatus,
  to: DapOfferTermsDraftStatus,
): boolean {
  const allowed = ALLOWED_OFFER_TERMS_TRANSITIONS[from]
  if (!allowed) return false
  return (allowed as readonly string[]).includes(to)
}

export function assertValidDapOfferTermsTransition(
  from: DapOfferTermsDraftStatus,
  to: DapOfferTermsDraftStatus,
): void {
  if (!canTransitionDapOfferTermsStatus(from, to)) {
    throw new Error(`Invalid DAP offer terms status transition: '${from}' → '${to}'`)
  }
}
