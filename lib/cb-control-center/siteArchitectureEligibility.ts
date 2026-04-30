import { DAP_ARCHITECTURE_SPECS, DAP_ARCHITECTURE_RISKS } from './siteArchitectureSpecs'
import type {
  ArchitectureEvaluationInput,
  ArchitectureEligibilityStatus,
  EvaluatedPage,
  SiteArchitectureOutput,
  NextBuildSlice,
} from './siteArchitectureTypes'
import type { EnrichedBlocker, TruthSection } from './types'

// ─── Input derivation ────────────────────────────────────────────────────────

export function deriveEvaluationInput(
  schema: TruthSection[],
  blockers: EnrichedBlocker[],
): ArchitectureEvaluationInput {
  const activeBlockerIds = blockers
    .filter(b => b.resolutionStatus === 'open')
    .map(b => b.id)

  return {
    confirmedProviderExists:    !activeBlockerIds.includes('eb-001'),
    offerTermsValidated:        !activeBlockerIds.includes('eb-002'),
    ctaGateUnlocked:            !activeBlockerIds.includes('eb-004'),
    requestFlowConfirmed:       !activeBlockerIds.includes('eb-003'),
    declinedRoutingConfirmed:   !activeBlockerIds.includes('eb-005'),
    activeBlockerIds,
  }
}

// ─── Per-page evaluation ─────────────────────────────────────────────────────

function evaluatePage(
  specId: string,
  input: ArchitectureEvaluationInput,
): { status: ArchitectureEligibilityStatus; reason: string; activeRestrictions: string[] } {

  const { confirmedProviderExists, offerTermsValidated, ctaGateUnlocked, requestFlowConfirmed, declinedRoutingConfirmed } = input

  switch (specId) {
    case 'homepage':
      return {
        status: 'recommended',
        reason: 'Entry point is always buildable. No provider context required at this level.',
        activeRestrictions: [],
      }

    case 'search_or_zip_lookup':
      return {
        status: 'recommended',
        reason: 'ZIP/search page is always safe. Results vary by provider availability — no false claims at the search layer.',
        activeRestrictions: [],
      }

    case 'how_it_works_guide':
      return {
        status: 'recommended',
        reason: 'Education-only page. No provider or CTA gates apply.',
        activeRestrictions: [],
      }

    case 'dentist_recruitment_page':
      return {
        status: 'recommended',
        reason: 'Demand-capture page requires no confirmed provider. Exists to handle Path 3 (patient names a dentist).',
        activeRestrictions: [],
      }

    case 'city_landing_page':
      if (!requestFlowConfirmed) {
        return {
          status: 'conditional',
          reason: 'Buildable for demand capture (Path 2), but cannot show "Request DAP" flow — eb-003 (request flow) is open.',
          activeRestrictions: [
            'Cannot include "Request DAP Availability" CTA or form until eb-003 is resolved',
            'Cannot imply a confirmed provider exists in this city without eb-001 resolved',
          ],
        }
      }
      return {
        status: 'recommended',
        reason: 'Request flow confirmed. City landing page can include full demand-capture + request CTA.',
        activeRestrictions: [],
      }

    case 'request_availability_page':
      if (!requestFlowConfirmed) {
        return {
          status: 'conditional',
          reason: 'Page structure can be built, but request form must be gated — eb-003 (request flow routing) is open.',
          activeRestrictions: [
            'Request form and submission logic must not go live until eb-003 is resolved',
            'Page may exist as a stub or waitlist capture only',
          ],
        }
      }
      return {
        status: 'recommended',
        reason: 'Request flow confirmed. Full request availability page is safe to build.',
        activeRestrictions: [],
      }

    case 'confirmed_provider_page': {
      if (!confirmedProviderExists) {
        return {
          status: 'blocked',
          reason: 'Cannot build confirmed provider page — eb-001 (provider participation) is open. No confirmed provider on record.',
          activeRestrictions: [],
        }
      }
      const restrictions: string[] = []
      if (!offerTermsValidated) {
        restrictions.push('"Join plan" CTA blocked — eb-002 (offer terms) is open')
      }
      if (!ctaGateUnlocked) {
        restrictions.push('"Join plan" CTA blocked — eb-004 (CTA gate) is open')
      }
      const allGatesOpen = offerTermsValidated && ctaGateUnlocked
      return {
        status: allGatesOpen ? 'recommended' : 'conditional',
        reason: allGatesOpen
          ? 'All three gates satisfied. Confirmed provider page with "Join plan" CTA is fully safe to build.'
          : 'Provider confirmed, but "Join plan" CTA requires eb-002 and eb-004 both resolved. Page can be built without that CTA.',
        activeRestrictions: restrictions,
      }
    }

    case 'internal_only_practice_record':
      return {
        status: 'internal_only',
        reason: 'Declined practice records are never patient-facing. Internal CRM/admin use only.',
        activeRestrictions: declinedRoutingConfirmed
          ? []
          : ['eb-005 open — declined routing handling not yet confirmed for internal layer'],
      }

    default:
      return {
        status: 'blocked',
        reason: `Unknown page spec id: ${specId}`,
        activeRestrictions: [],
      }
  }
}

// ─── Next build slice ─────────────────────────────────────────────────────────

export function deriveNextBuildSlice(
  input: ArchitectureEvaluationInput,
  recommended: EvaluatedPage[],
  conditional: EvaluatedPage[],
): NextBuildSlice {
  const { confirmedProviderExists, offerTermsValidated, ctaGateUnlocked, requestFlowConfirmed } = input

  if (!confirmedProviderExists && !requestFlowConfirmed) {
    return {
      label: 'Slice 0 — Discovery Foundation',
      pages: ['homepage', 'search_or_zip_lookup', 'how_it_works_guide'],
      blockersToClear: [],
      rationale: 'Build the discovery layer first. No provider or request-flow gates needed. These three pages are safe in any state.',
    }
  }

  if (!confirmedProviderExists && requestFlowConfirmed) {
    return {
      label: 'Slice 1 — Demand Capture (Path 2 + Path 3)',
      pages: ['homepage', 'search_or_zip_lookup', 'how_it_works_guide', 'request_availability_page', 'city_landing_page', 'dentist_recruitment_page'],
      blockersToClear: [],
      rationale: 'Request flow is confirmed. Build full demand-capture layer. These six pages are safe without a confirmed provider.',
    }
  }

  if (confirmedProviderExists && !offerTermsValidated) {
    return {
      label: 'Slice 2 — Provider Page (No CTA)',
      pages: ['homepage', 'search_or_zip_lookup', 'how_it_works_guide', 'confirmed_provider_page'],
      blockersToClear: ['eb-002 (offer terms validation)', 'eb-004 (CTA gate unlock)'],
      rationale: 'Confirmed provider exists — provider page can be built without "Join plan" CTA. Clear eb-002 and eb-004 to unlock CTA.',
    }
  }

  if (confirmedProviderExists && offerTermsValidated && !ctaGateUnlocked) {
    return {
      label: 'Slice 3 — Full Provider Page (CTA Gated)',
      pages: recommended.map(p => p.spec.id),
      blockersToClear: ['eb-004 (CTA gate unlock)'],
      rationale: 'Offer terms validated. Clear eb-004 to enable the "Join plan" CTA and complete the confirmed provider page.',
    }
  }

  return {
    label: 'Slice 4 — Full Architecture',
    pages: recommended.map(p => p.spec.id),
    blockersToClear: [],
    rationale: 'All gates satisfied. Full site architecture is safe to build.',
  }
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

export function evaluateSiteArchitecture(
  schema: TruthSection[],
  blockers: EnrichedBlocker[],
): SiteArchitectureOutput {
  const input = deriveEvaluationInput(schema, blockers)

  const evaluatedPages: EvaluatedPage[] = DAP_ARCHITECTURE_SPECS.map(spec => ({
    spec,
    ...evaluatePage(spec.id, input),
  }))

  const recommendedPages    = evaluatedPages.filter(p => p.status === 'recommended')
  const conditionalPages    = evaluatedPages.filter(p => p.status === 'conditional')
  const blockedPages        = evaluatedPages.filter(p => p.status === 'blocked')
  const internalOnlyRecords = evaluatedPages.filter(p => p.status === 'internal_only')

  const activeRisks = DAP_ARCHITECTURE_RISKS.filter(risk => {
    switch (risk.id) {
      case 'risk-001': return !input.confirmedProviderExists
      case 'risk-002': return input.confirmedProviderExists && !input.offerTermsValidated
      case 'risk-003': return input.confirmedProviderExists && !input.ctaGateUnlocked
      case 'risk-004': return !input.requestFlowConfirmed
      case 'risk-005': return !input.declinedRoutingConfirmed
      case 'risk-006': return !input.confirmedProviderExists  // city pages without provider
      case 'risk-007': return input.confirmedProviderExists && !input.offerTermsValidated
      case 'risk-008': return true  // always active — general disclaimer risk
      default: return false
    }
  })

  const nextBuildSlice = deriveNextBuildSlice(input, recommendedPages, conditionalPages)

  return {
    recommendedPages,
    conditionalPages,
    blockedPages,
    internalOnlyRecords,
    risks: activeRisks,
    nextBuildSlice,
  }
}
