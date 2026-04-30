import type { DapOfferTermsReviewStatus } from './dapOfferTermsReviewTypes'
import type { DapProviderParticipationStatus } from './dapProviderParticipationTypes'

// Only review_passed reviews may proceed to participation confirmation.
export function isOfferTermsReviewEligibleForParticipationConfirmation(
  reviewStatus: DapOfferTermsReviewStatus,
): boolean {
  return reviewStatus === 'review_passed'
}

// Participation confirmation transitions. No path leads to public status or patient-facing unlock.
const ALLOWED_PROVIDER_PARTICIPATION_TRANSITIONS: Partial<
  Record<DapProviderParticipationStatus, readonly DapProviderParticipationStatus[]>
> = {
  confirmation_started:    ['agreement_sent', 'participation_declined', 'confirmation_voided'],
  agreement_sent:          ['agreement_received', 'participation_declined', 'confirmation_voided'],
  agreement_received:      ['participation_confirmed', 'participation_declined', 'confirmation_voided'],
  participation_confirmed: ['confirmation_voided'],
  participation_declined:  ['confirmation_started'],
  confirmation_voided:     ['confirmation_started'],
}

export function canTransitionDapProviderParticipationStatus(
  from: DapProviderParticipationStatus,
  to: DapProviderParticipationStatus,
): boolean {
  const allowed = ALLOWED_PROVIDER_PARTICIPATION_TRANSITIONS[from]
  if (!allowed) return false
  return (allowed as readonly string[]).includes(to)
}

export function assertValidDapProviderParticipationTransition(
  from: DapProviderParticipationStatus,
  to: DapProviderParticipationStatus,
): void {
  if (!canTransitionDapProviderParticipationStatus(from, to)) {
    throw new Error(`Invalid DAP provider participation transition: '${from}' → '${to}'`)
  }
}
