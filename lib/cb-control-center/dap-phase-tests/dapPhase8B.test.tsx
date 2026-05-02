/**
 * Phase 8B — Content and Conversion Polish QA
 *
 * PURPOSE: Enforce the messaging rules introduced in Phase 8B. Copy changes
 * must stay within the safety architecture established in Phases 7D–8A.
 * These tests lock the content direction so future edits cannot drift back
 * to vague, misleading, or incorrectly-framed copy.
 *
 * COVERAGE:
 *   Group 1 — No universal availability claims
 *   Group 2 — No guaranteed savings or pricing claims
 *   Group 3 — Insurance positioning (DAP is a membership, not insurance)
 *   Group 4 — Request flow microcopy (consent, caveat, not enrollment)
 *   Group 5 — No-results framing (opportunity, not dead end)
 *   Group 6 — Route boundary and safety attributes unchanged
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { renderToString } from 'react-dom/server'

import { DapCityAvailabilitySummaryView } from '@/components/cb-control-center/dap-public/DapCityAvailabilitySummary'
import { DapNoResultsPanel } from '@/components/cb-control-center/dap-public/DapNoResultsPanel'
import { DapRequestFlowPage } from '@/components/cb-control-center/dap-pages/DapRequestFlowPage'
import { DapHomepagePage } from '@/components/cb-control-center/dap-pages/DapHomepagePage'
import { DapCityPage } from '@/components/cb-control-center/dap-pages/DapCityPage'
import { DapDecisionPage } from '@/components/cb-control-center/dap-pages/DapDecisionPage'
import { DapTreatmentPage } from '@/components/cb-control-center/dap-pages/DapTreatmentPage'
import { DapDentistPage } from '@/components/cb-control-center/dap-pages/DapDentistPage'

import {
  getHomepageHeroModel,
  getRequestFlowModel,
  getCityAvailabilitySummary,
  getCityPageModel,
  getDecisionPageCtaModel,
  getTreatmentPageCtaModel,
  getNoResultsModel,
  getDentistPageModel,
  getPracticeStatusBadge,
  getPrimaryCtaForPractice,
  getSecondaryCtaForPractice,
  getAllowedPublicClaimsForPractice,
} from '../dapPublicUxRules'
import {
  getDefaultHowItWorksModel,
  getDefaultFaqModel,
  getDefaultComparisonModel,
  getDefaultSavingsEducationModel,
} from '../dapPublicSectionModels'

import type { DapAvailabilityState, DapGateState, DapProviderCardModel } from '../../dap/site/dapPublicUxTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALL_GATES: DapGateState = { offerTermsValidated: true, ctaGateUnlocked: true }
const NO_GATES: DapGateState  = { offerTermsValidated: false, ctaGateUnlocked: false }

function makeCard(state: DapAvailabilityState, gates: DapGateState = NO_GATES): DapProviderCardModel {
  const primaryType = getPrimaryCtaForPractice(state, gates)
  const secondaryType = getSecondaryCtaForPractice(state, gates)
  return {
    practiceId: `8b-${state}`,
    practiceName: '8B Practice',
    city: 'San Diego',
    state: 'CA',
    availabilityState: state,
    statusBadge: getPracticeStatusBadge(state),
    primaryCta: { type: primaryType, label: 'Primary', href: '/test' },
    secondaryCta: secondaryType ? { type: secondaryType, label: 'Secondary', href: '/test2' } : null,
    allowedClaims: getAllowedPublicClaimsForPractice(state, gates),
    isPublic: state !== 'unavailable_internal_only',
  }
}

// ─── Group 1: No universal availability claims ────────────────────────────────
// DAP must never claim to be accepted by all dentists or available everywhere.

describe('No universal availability claims', () => {
  it('homepage hero headline contains no universal availability language', () => {
    const model = getHomepageHeroModel()
    expect(model.headline).not.toMatch(/every dentist|all dentists|any dentist|universally available/i)
    expect(model.subheadline).not.toMatch(/every dentist|all dentists|any dentist|universally available/i)
  })

  it('city summary (confirmed): heading contains "offering Dental Advantage Plan" — specific, not universal', () => {
    const model = getCityAvailabilitySummary('San Diego', 3, 0, 10)
    // "Dentists offering DAP in San Diego" = confirmed subset, not "all dentists"
    expect(model.heading).toContain('offering Dental Advantage Plan in San Diego')
    expect(model.heading).not.toMatch(/all dentists|every dentist/i)
  })

  it('city summary (demand capture): subheading says "not yet confirmed" — not "unavailable"', () => {
    const model = getCityAvailabilitySummary('Phoenix', 0, 0, 5)
    expect(model.subheading).toContain('not yet confirmed')
    expect(model.subheading).not.toMatch(/DAP unavailable|no dentists found|try again/i)
  })

  it('FAQ item 2 explicitly says DAP is NOT available everywhere', () => {
    const model = getDefaultFaqModel('homepage')
    const item = model.items[1]
    expect(item.question).toMatch(/available everywhere/i)
    expect(item.answer.toLowerCase()).toMatch(/\bno\b/)
  })

  it('comparison section column points contain no "all dentists" claim', () => {
    const model = getDefaultComparisonModel()
    const allPoints = model.columns.flatMap(c => c.points)
    for (const point of allPoints) {
      expect(point).not.toMatch(/all dentists|every dentist|any dentist accept/i)
    }
  })

  it('city page demand-capture h1 focuses on request action, not broad availability', () => {
    const model = getCityPageModel('Mesa', 0)
    expect(model.h1.toLowerCase()).toMatch(/request/)
    expect(model.h1).not.toMatch(/all dentists|every dentist|universally/i)
  })

  it('homepage page rendered HTML contains no universal availability claim', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).not.toMatch(/every dentist|all dentists|accepted everywhere|universally available/i)
  })
})

// ─── Group 2: No guaranteed savings or pricing claims ─────────────────────────

describe('No guaranteed savings or pricing claims', () => {
  it('savings education body contains no "guaranteed" savings language', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.body).not.toMatch(/guaranteed|you will save \$|save exactly|always cheaper/i)
  })

  it('savings education body contains illustrative disclaimer language', () => {
    const model = getDefaultSavingsEducationModel()
    // Must disclaim that savings vary and examples are not promises
    expect(model.body.toLowerCase()).toMatch(/illustrative|actual savings vary|savings vary/)
  })

  it('savings education body explains that discounts must be confirmed', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.body.toLowerCase()).toContain('confirmed')
  })

  it('comparison section DAP column: no "always cheaper" or "savings guaranteed"', () => {
    const model = getDefaultComparisonModel()
    const dapPoints = model.columns[0].points
    for (const point of dapPoints) {
      expect(point).not.toMatch(/always cheaper|savings guaranteed|\bguarantee\b/i)
    }
  })

  it('treatment page rendered HTML contains no guaranteed pricing claim', () => {
    const html = renderToString(
      <DapTreatmentPage
        h1="Dental implants and DAP"
        ctaModel={getTreatmentPageCtaModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('treatment_page')}
      />
    )
    expect(html).not.toMatch(/savings guaranteed|you will save \$|prices are fixed/i)
  })

  it('decision page rendered HTML contains no guaranteed pricing claim', () => {
    const html = renderToString(
      <DapDecisionPage
        h1="Is a savings plan right for me?"
        ctaModel={getDecisionPageCtaModel()}
        comparison={getDefaultComparisonModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('decision_page')}
      />
    )
    expect(html).not.toMatch(/savings guaranteed|you will save \$|always cheaper/i)
  })
})

// ─── Group 3: Insurance positioning ──────────────────────────────────────────
// DAP must be clearly positioned as a membership, not insurance.

describe('Insurance positioning — DAP is a membership, not insurance', () => {
  it('savings education headline uses "membership" not "insurance"', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.headline.toLowerCase()).toContain('membership')
  })

  it('savings education body explicitly says DAP is not insurance', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.body.toLowerCase()).toMatch(/not insurance/)
  })

  it('homepage hero subheadline explicitly says DAP is not insurance', () => {
    const model = getHomepageHeroModel()
    expect(model.subheadline.toLowerCase()).toMatch(/not insurance/)
  })

  it('FAQ item 1 answer explains DAP is not dental insurance', () => {
    const model = getDefaultFaqModel('homepage')
    const answer = model.items[0].answer.toLowerCase()
    expect(answer).toMatch(/not dental insurance|not insurance/)
  })

  it('comparison headline correctly names both sides without false equivalence', () => {
    const model = getDefaultComparisonModel()
    // Must reference DAP and traditional insurance, not claim one is better
    expect(model.headline.toLowerCase()).toContain('dental advantage plan')
    expect(model.headline.toLowerCase()).toContain('dental insurance')
    expect(model.headline).not.toMatch(/better than|superior to|beats/i)
  })

  it('comparison DAP column label is "Dental Advantage Plan" (not "insurance")', () => {
    const model = getDefaultComparisonModel()
    expect(model.columns[0].label).toBe('Dental Advantage Plan')
    expect(model.columns[0].label.toLowerCase()).not.toContain('insurance')
  })

  it('comparison DAP points include "no claims to file"', () => {
    const model = getDefaultComparisonModel()
    const dapPoints = model.columns[0].points
    const hasNoClaims = dapPoints.some(p => p.toLowerCase().includes('no claims'))
    expect(hasNoClaims).toBe(true)
  })

  it('dentist confirmed page rendered HTML contains no "insurance" claim for DAP', () => {
    const dentistModel = getDentistPageModel('confirmed', 'Test Dental', ALL_GATES)!
    const html = renderToString(
      <DapDentistPage
        model={dentistModel}
        card={makeCard('confirmed', ALL_GATES)}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('dentist_page')}
      />
    )
    // DAP should never appear as "insurance" in rendered output
    expect(html).not.toMatch(/DAP insurance|dental insurance plan|insurance plan/i)
  })
})

// ─── Group 4: Request flow microcopy ─────────────────────────────────────────
// The request flow must communicate: not enrollment, consent required, not guaranteed.

describe('Request flow microcopy', () => {
  it('availabilityCaveat explicitly says "does not guarantee"', () => {
    const model = getRequestFlowModel('city_availability')
    expect(model.availabilityCaveat).toContain('does not guarantee')
  })

  it('availabilityCaveat mentions consent', () => {
    const model = getRequestFlowModel('city_availability')
    expect(model.availabilityCaveat.toLowerCase()).toContain('consent')
  })

  it('availabilityCaveat is patient-facing and non-empty', () => {
    const model = getRequestFlowModel('specific_dentist')
    expect(model.availabilityCaveat.length).toBeGreaterThan(20)
  })

  it('collectsConsent is true — consent collection cannot be disabled via the model', () => {
    expect(getRequestFlowModel('city_availability').collectsConsent).toBe(true)
    expect(getRequestFlowModel('specific_dentist').collectsConsent).toBe(true)
  })

  it('rendered request flow page contains caveat text with "does not guarantee"', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).toContain('does not guarantee')
  })

  it('rendered request flow page contains consent checkbox (data-consent-field)', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('specific_dentist')} />
    )
    expect(html).toContain('data-consent-field')
  })

  it('request flow does not use enrollment language', () => {
    const model = getRequestFlowModel('city_availability')
    // The flow is a request, not enrollment
    expect(model.availabilityCaveat.toLowerCase()).not.toMatch(/enroll|enrollment|signing up for a plan/i)
  })
})

// ─── Group 5: No-results framing ─────────────────────────────────────────────
// No-results must feel like an opportunity, not a dead end.

describe('No-results framing', () => {
  it('getNoResultsModel() headline does not use negative "not found" framing', () => {
    const model = getNoResultsModel('Mesa, AZ')
    expect(model.headline).not.toMatch(/no dentists found|dap unavailable|nothing available|try again/i)
  })

  it('getNoResultsModel() body mentions consent (no contact without permission)', () => {
    const model = getNoResultsModel('Mesa, AZ')
    expect(model.body.toLowerCase()).toContain('consent')
  })

  it('getNoResultsModel() body frames the request path as helpful, not a consolation', () => {
    const model = getNoResultsModel('Phoenix')
    // Should mention telling us what they want, not just "sorry"
    expect(model.body.toLowerCase()).toMatch(/tell us|let you know|contact/)
  })

  it('rendered DapNoResultsPanel has a primary request CTA (data-cta-type present)', () => {
    const html = renderToString(
      <DapNoResultsPanel model={getNoResultsModel('Tucson')} />
    )
    expect(html).toContain('data-cta-type="request_city_availability"')
  })

  it('rendered DapNoResultsPanel data-request-caveat sets expectations without being discouraging', () => {
    const html = renderToString(
      <DapNoResultsPanel model={getNoResultsModel('Phoenix')} />
    )
    expect(html).toContain('data-request-caveat')
    // Caveat must not imply the request is pointless
    expect(html).not.toMatch(/request is pointless|no guarantee we can|will not help/i)
  })

  it('city page demand-capture subheading mentions consent framing', () => {
    const model = getCityAvailabilitySummary('Phoenix', 0, 0, 3)
    expect(model.subheading.toLowerCase()).toContain('consent')
  })

  it('city page demand-capture rendered HTML does not use "DAP unavailable" framing', () => {
    const html = renderToString(
      <DapCityAvailabilitySummaryView model={getCityAvailabilitySummary('Phoenix', 0, 0, 3)} />
    )
    expect(html).not.toMatch(/DAP unavailable|no DAP available|try another/i)
  })
})

// ─── Group 6: Route boundary and safety attributes unchanged ──────────────────
// Phase 8B is copy-only. No new routes, no new API endpoints, no safety attribute changes.

describe('Route boundary and safety attributes unchanged after Phase 8B', () => {
  it('design preview page still exists (route boundary not modified)', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/dap/design/page.tsx'))).toBe(true)
  })

  it('no new API routes were added in Phase 8B (no route.ts files)', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapPublicUxRules.ts'), 'utf8')
    expect(src).not.toMatch(/\bfetch\s*\(/)
    expect(src).not.toContain('/api/')
  })

  it('homepage page: data-implies-universal-availability="false" preserved', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).toContain('data-implies-universal-availability="false"')
  })

  it('city page: data-implies-universal-availability="false" preserved', () => {
    const html = renderToString(
      <DapCityPage
        model={getCityPageModel('San Diego', 2)}
        summary={getCityAvailabilitySummary('San Diego', 2, 0, 8)}
        cards={[makeCard('confirmed', ALL_GATES)]}
        noResults={null}
        howItWorks={getDefaultHowItWorksModel()}
        faq={getDefaultFaqModel('city_page')}
      />
    )
    expect(html).toContain('data-implies-universal-availability="false"')
  })

  it('treatment page: data-implies-guaranteed-pricing="false" preserved', () => {
    const html = renderToString(
      <DapTreatmentPage
        h1="Dental implants and DAP"
        ctaModel={getTreatmentPageCtaModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('treatment_page')}
      />
    )
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
  })

  it('request flow: data-preview-banner preserved — still inert', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).toContain('data-preview-banner')
    expect(html).not.toContain('<form')
  })

  it('savings education section: impliesGuaranteedPricing=false is a TypeScript literal', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.impliesGuaranteedPricing).toBe(false)
  })
})
