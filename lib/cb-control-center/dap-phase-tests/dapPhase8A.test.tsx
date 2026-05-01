/**
 * Phase 8A — DAP Design System Preview QA
 *
 * PURPOSE: Prove that Phase 8A visual direction preserves all safety invariants
 * established in Phases 7D–7G, and that the new design preview route is
 * itself boundary-safe (no API, no submission, no production namespace).
 *
 * COVERAGE:
 *   Group 1 — Design preview route safety (exists, no fetch, no form)
 *   Group 2 — State-aware CTA + badge visual differentiation
 *   Group 3 — No-results growth loop (isDeadEnd invariant)
 *   Group 4 — Pricing and availability safety (no guaranteed claims)
 *   Group 5 — Preview banners and consent surface unchanged
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { renderToString } from 'react-dom/server'

import { DapProviderCard } from '@/components/cb-control-center/dap-public/DapProviderCard'
import { DapNoResultsPanel } from '@/components/cb-control-center/dap-public/DapNoResultsPanel'
import { DapRequestFlowPage } from '@/components/cb-control-center/dap-pages/DapRequestFlowPage'
import { DapHomepagePage } from '@/components/cb-control-center/dap-pages/DapHomepagePage'
import { DapDecisionPage } from '@/components/cb-control-center/dap-pages/DapDecisionPage'
import { DapTreatmentPage } from '@/components/cb-control-center/dap-pages/DapTreatmentPage'
import { DapCityPage } from '@/components/cb-control-center/dap-pages/DapCityPage'

import {
  getHomepageHeroModel,
  getRequestFlowModel,
  getCityAvailabilitySummary,
  getCityPageModel,
  getDecisionPageCtaModel,
  getTreatmentPageCtaModel,
  getNoResultsModel,
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

import type { DapAvailabilityState, DapGateState, DapProviderCardModel } from '../dapPublicUxTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALL_GATES: DapGateState = { offerTermsValidated: true, ctaGateUnlocked: true }
const NO_GATES: DapGateState  = { offerTermsValidated: false, ctaGateUnlocked: false }

function makeCard(
  state: DapAvailabilityState,
  gates: DapGateState = NO_GATES,
): DapProviderCardModel {
  const primaryType = getPrimaryCtaForPractice(state, gates)
  const secondaryType = getSecondaryCtaForPractice(state, gates)
  return {
    practiceId: `8a-${state}`,
    practiceName: 'Phase 8A Practice',
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

// ─── Group 1: Design preview route safety ─────────────────────────────────────

describe('Design preview route safety', () => {
  const DESIGN_PAGE = resolve(ROOT, 'app/preview/dap/design/page.tsx')

  it('design preview page file exists at app/preview/dap/design/page.tsx', () => {
    expect(existsSync(DESIGN_PAGE)).toBe(true)
  })

  it('design preview page source contains no fetch() call', () => {
    const src = readFileSync(DESIGN_PAGE, 'utf8')
    expect(src).not.toMatch(/\bfetch\s*\(/)
  })

  it('design preview page source contains no axios reference', () => {
    const src = readFileSync(DESIGN_PAGE, 'utf8')
    expect(src).not.toMatch(/\baxios\b/)
  })

  it('design preview page source contains no /api/ path', () => {
    const src = readFileSync(DESIGN_PAGE, 'utf8')
    expect(src).not.toContain('/api/')
  })

  it('design preview page source contains no <form element', () => {
    const src = readFileSync(DESIGN_PAGE, 'utf8')
    expect(src).not.toContain('<form')
  })

  it('design preview page is under /preview/ namespace (not production)', () => {
    expect(DESIGN_PAGE).toContain('/preview/')
  })

  it('design preview page source has a default export (is a valid Next.js page)', () => {
    const src = readFileSync(DESIGN_PAGE, 'utf8')
    expect(src).toMatch(/export\s+default\s+(function|async\s+function|\()/)
  })
})

// ─── Group 2: State-aware CTA + badge visual differentiation ─────────────────
// Phase 8A introduced top accent bars that change per availability state.
// This group proves different states render different visual signals.

describe('State-aware CTA and badge visual differentiation', () => {
  it('confirmed card renders emerald top accent bar', () => {
    const html = renderToString(
      <DapProviderCard model={makeCard('confirmed', ALL_GATES)} previewMode />
    )
    expect(html).toContain('bg-emerald-400')
    expect(html).toContain('data-availability-state="confirmed"')
  })

  it('not_confirmed card renders gray top accent bar', () => {
    const html = renderToString(
      <DapProviderCard model={makeCard('not_confirmed')} previewMode />
    )
    expect(html).toContain('bg-gray-200')
    expect(html).toContain('data-availability-state="not_confirmed"')
  })

  it('requested card renders blue top accent bar', () => {
    const html = renderToString(
      <DapProviderCard model={makeCard('requested')} previewMode />
    )
    expect(html).toContain('bg-blue-300')
    expect(html).toContain('data-availability-state="requested"')
  })

  it('requestable card renders blue (lighter) top accent bar', () => {
    const html = renderToString(
      <DapProviderCard model={makeCard('requestable')} previewMode />
    )
    expect(html).toContain('bg-blue-200')
  })

  it('unavailable_internal_only card renders no accent bar in preview mode', () => {
    const html = renderToString(
      <DapProviderCard model={makeCard('unavailable_internal_only')} previewMode />
    )
    // Internal cards do not get an accent bar (isInternal branch skips it)
    expect(html).not.toContain('bg-emerald-400')
    expect(html).not.toContain('bg-blue-300')
    expect(html).toContain('data-availability-state="unavailable_internal_only"')
  })

  it('confirmed and not_confirmed cards render different data-availability-state', () => {
    const confirmedHtml = renderToString(
      <DapProviderCard model={makeCard('confirmed', ALL_GATES)} previewMode />
    )
    const notConfirmedHtml = renderToString(
      <DapProviderCard model={makeCard('not_confirmed')} previewMode />
    )
    expect(confirmedHtml).toContain('data-availability-state="confirmed"')
    expect(notConfirmedHtml).toContain('data-availability-state="not_confirmed"')
    expect(confirmedHtml).not.toContain('data-availability-state="not_confirmed"')
  })
})

// ─── Group 3: No-results growth loop ─────────────────────────────────────────
// DapNoResultsPanel must never be a dead end — it always offers a request path.

describe('No-results growth loop invariant', () => {
  it('DapNoResultsPanel renders data-is-dead-end="false"', () => {
    const html = renderToString(
      <DapNoResultsPanel model={getNoResultsModel('Mesa, AZ')} />
    )
    expect(html).toContain('data-is-dead-end="false"')
    expect(html).not.toContain('data-is-dead-end="true"')
  })

  it('DapNoResultsPanel renders a primary request CTA (request_city_availability)', () => {
    const model = getNoResultsModel('Mesa, AZ')
    const html = renderToString(<DapNoResultsPanel model={model} />)
    // primary CTA href points to /request-dap
    expect(html).toContain('/request-dap')
  })

  it('DapNoResultsPanel renders the request caveat (expectation-setting)', () => {
    const html = renderToString(
      <DapNoResultsPanel model={getNoResultsModel('Mesa, AZ')} />
    )
    expect(html).toContain('data-request-caveat')
    expect(html).toContain('does not guarantee')
  })

  it('getNoResultsModel(): isDeadEnd is always false', () => {
    const model = getNoResultsModel('Anywhere')
    expect(model.isDeadEnd).toBe(false)
  })

  it('DapNoResultsPanel rendered output contains no positive guarantee claims', () => {
    const html = renderToString(
      <DapNoResultsPanel model={getNoResultsModel('Phoenix')} />
    )
    // Caveat language ("does not guarantee") is correct and expected.
    // Disallow only positive guarantee claims.
    expect(html).not.toMatch(/savings guaranteed|availability guaranteed|you will save \$|prices are fixed/i)
    expect(html).not.toMatch(/\bguaranteed\s+(availability|savings|pricing)\b/i)
  })
})

// ─── Group 4: Pricing and availability safety ─────────────────────────────────
// Phase 8A design updates must not introduce guaranteed pricing or universal
// availability claims in any page composition.

describe('Pricing and availability safety — Phase 8A styled pages', () => {
  it('Homepage: no "guarantee" pricing language in rendered output', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).not.toMatch(/you will save \$|prices are fixed|savings guaranteed/i)
    expect(html).not.toContain('data-implies-universal-availability="true"')
  })

  it('Decision page: data-implies-pricing="false" still present after Phase 8A styling', () => {
    const html = renderToString(
      <DapDecisionPage
        h1="Is DAP right for me?"
        ctaModel={getDecisionPageCtaModel()}
        comparison={getDefaultComparisonModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('decision_page')}
      />
    )
    expect(html).toContain('data-implies-pricing="false"')
    expect(html).not.toContain('data-implies-pricing="true"')
  })

  it('Treatment page: data-implies-guaranteed-pricing="false" still present after Phase 8A styling', () => {
    const html = renderToString(
      <DapTreatmentPage
        h1="Dental implants and DAP"
        ctaModel={getTreatmentPageCtaModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('treatment_page')}
      />
    )
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
    expect(html).not.toContain('data-implies-guaranteed-pricing="true"')
  })

  it('City page: data-implies-universal-availability="false" still present after Phase 8A styling', () => {
    const html = renderToString(
      <DapCityPage
        model={getCityPageModel('San Diego', 2)}
        summary={getCityAvailabilitySummary('San Diego', 2, 0, 4)}
        cards={[makeCard('confirmed', ALL_GATES)]}
        noResults={null}
        howItWorks={getDefaultHowItWorksModel()}
        faq={getDefaultFaqModel('city_page')}
      />
    )
    expect(html).toContain('data-implies-universal-availability="false"')
    expect(html).not.toContain('data-implies-universal-availability="true"')
  })

  it('Comparison section rendered by HomepagePage contains no "guarantee" language', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).not.toMatch(/\bguarantee\b/i)
    expect(html).not.toMatch(/always cheaper|savings are fixed/i)
  })
})

// ─── Group 5: Preview banners and consent surface unchanged ───────────────────
// Phase 8A must not remove or weaken the preview mode indicators established
// in Phase 7E. The request flow consent field must still be present and disabled.

describe('Preview banners and consent surface unchanged', () => {
  it('DapRequestFlowPage still renders data-preview-banner', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).toContain('data-preview-banner')
  })

  it('DapRequestFlowPage still renders data-consent-field (disabled)', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).toContain('data-consent-field')
    // Consent input must be disabled in preview
    expect(html).toContain('disabled')
  })

  it('DapRequestFlowPage rendered HTML contains no <form element', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('specific_dentist')} />
    )
    expect(html).not.toContain('<form')
    expect(html).not.toContain('action=')
  })

  it('DapRequestFlowPage preview submit button is disabled and aria-disabled', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).toContain('data-preview-submit')
    // aria-disabled="true" signals to screen readers this is not active
    expect(html).toContain('aria-disabled="true"')
  })

  it('DapRequestFlowPage: collectsConsent is true on the model', () => {
    const model = getRequestFlowModel('city_availability')
    expect(model.collectsConsent).toBe(true)
  })
})
