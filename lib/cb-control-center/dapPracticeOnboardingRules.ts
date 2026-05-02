import type { DapPracticeOnboardingStatus } from '../dap/registry/dapPracticeOnboardingTypes'

// Phase 9I outreach transitions only. terms_under_review and ready_for_offer_validation
// are passive statuses — not reachable via Phase 9I actions.
const ALLOWED_ONBOARDING_TRANSITIONS: Partial<
  Record<DapPracticeOnboardingStatus, readonly DapPracticeOnboardingStatus[]>
> = {
  intake_created:     ['outreach_needed', 'outreach_started'],
  outreach_needed:    ['outreach_started', 'not_interested'],
  outreach_started:   ['practice_responded', 'not_interested'],
  practice_responded: ['interested', 'not_interested', 'terms_needed'],
  interested:         ['terms_needed', 'not_interested'],
  terms_needed:       ['interested', 'not_interested'],
  not_interested:     ['outreach_needed'],
}

export function canTransitionDapPracticeOnboardingStatus(
  from: DapPracticeOnboardingStatus,
  to: DapPracticeOnboardingStatus,
): boolean {
  const allowed = ALLOWED_ONBOARDING_TRANSITIONS[from]
  if (!allowed) return false
  return (allowed as readonly string[]).includes(to)
}

export function assertValidDapPracticeOnboardingTransition(
  from: DapPracticeOnboardingStatus,
  to: DapPracticeOnboardingStatus,
): void {
  if (!canTransitionDapPracticeOnboardingStatus(from, to)) {
    throw new Error(`Invalid DAP onboarding status transition: '${from}' → '${to}'`)
  }
}
