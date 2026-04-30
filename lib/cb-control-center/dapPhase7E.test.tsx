import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import { DapStatusBadge } from '@/components/cb-control-center/dap-public/DapStatusBadge'
import { DapProviderCard } from '@/components/cb-control-center/dap-public/DapProviderCard'
import { DapCityAvailabilitySummaryView } from '@/components/cb-control-center/dap-public/DapCityAvailabilitySummary'
import { DapNoResultsPanel } from '@/components/cb-control-center/dap-public/DapNoResultsPanel'
import { DapRequestFlowPreview } from '@/components/cb-control-center/dap-public/DapRequestFlowPreview'
import { DapHomepageHeroPreview } from '@/components/cb-control-center/dap-public/DapHomepageHeroPreview'
import { DapSearchResultsPreview } from '@/components/cb-control-center/dap-public/DapSearchResultsPreview'
import {
  getHomepageHeroModel,
  getNoResultsModel,
  getRequestFlowModel,
  getCityAvailabilitySummary,
  getSearchResultsModel,
  getPracticeStatusBadge,
  getAllowedPublicClaimsForPractice,
  getPrimaryCtaForPractice,
  getSecondaryCtaForPractice,
} from './dapPublicUxRules'
import type {
  DapCtaModel,
  DapProviderCardModel,
  DapGateState,
  DapAvailabilityState,
} from './dapPublicUxTypes'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NO_GATES: DapGateState  = { offerTermsValidated: false, ctaGateUnlocked: false }
const ALL_GATES: DapGateState = { offerTermsValidated: true,  ctaGateUnlocked: true  }

const JOIN_CTA: DapCtaModel = {
  type: 'join_plan',
  label: 'Join plan',
  href: '/enroll',
}
const REQUEST_CTA: DapCtaModel = {
  type: 'request_this_dentist',
  label: 'Request DAP at this office',
  href: '/request-dap/dentist',
}
const NONE_CTA: DapCtaModel = {
  type: 'none',
  label: 'Not available',
  href: null,
}

function makeCard(state: DapAvailabilityState, gates: DapGateState = NO_GATES): DapProviderCardModel {
  const primaryCtaType = getPrimaryCtaForPractice(state, gates)
  const secondaryCtaType = getSecondaryCtaForPractice(state, gates)
  return {
    practiceId: `test-${state}`,
    practiceName: 'Test Practice',
    city: 'San Diego',
    state: 'CA',
    availabilityState: state,
    statusBadge: getPracticeStatusBadge(state),
    primaryCta: { type: primaryCtaType, label: 'Primary CTA', href: '/test' },
    secondaryCta: secondaryCtaType
      ? { type: secondaryCtaType, label: 'Secondary CTA', href: '/test2' }
      : null,
    allowedClaims: getAllowedPublicClaimsForPractice(state, gates),
    isPublic: state !== 'unavailable_internal_only',
  }
}

// ─── 1. CTA rendering ─────────────────────────────────────────────────────────

describe('CTA rendering', () => {
  it('renders the CTA label', () => {
    const html = renderToString(<DapPublicCta cta={JOIN_CTA} />)
    expect(html).toContain('Join plan')
  })

  it('renders an anchor tag with href when cta has href and is not disabled', () => {
    const html = renderToString(<DapPublicCta cta={REQUEST_CTA} />)
    expect(html).toContain('href="/request-dap/dentist"')
  })

  it('none CTA renders as a disabled button', () => {
    const html = renderToString(<DapPublicCta cta={NONE_CTA} />)
    expect(html).toContain('disabled')
    expect(html).toContain('Not available')
  })

  it('disabled prop forces disabled rendering even with href', () => {
    const html = renderToString(<DapPublicCta cta={JOIN_CTA} disabled />)
    expect(html).toContain('disabled')
    // Should not render as anchor when disabled
    expect(html).not.toContain('href="/enroll"')
  })

  it('helperText appears in rendered output', () => {
    const html = renderToString(
      <DapPublicCta cta={REQUEST_CTA} helperText="This does not confirm availability." />
    )
    expect(html).toContain('This does not confirm availability.')
  })

  it('data-cta-type attribute is set correctly', () => {
    const html = renderToString(<DapPublicCta cta={JOIN_CTA} />)
    expect(html).toContain('data-cta-type="join_plan"')
  })

  it('CTA component does not add availability claims — only renders what it receives', () => {
    const html = renderToString(<DapPublicCta cta={REQUEST_CTA} />)
    // Should not introduce "confirmed", "available", or DAP claim language
    expect(html).not.toMatch(/confirmed provider|DAP available|join any/i)
  })
})

// ─── 2. Provider card rendering ───────────────────────────────────────────────

describe('Provider card rendering', () => {
  it('confirmed provider card renders "DAP confirmed" badge', () => {
    const html = renderToString(<DapProviderCard model={makeCard('confirmed', ALL_GATES)} />)
    expect(html).toContain('DAP confirmed')
  })

  it('not_confirmed card does not contain "DAP provider" or "DAP available" copy', () => {
    const html = renderToString(<DapProviderCard model={makeCard('not_confirmed')} />)
    expect(html).not.toMatch(/DAP provider|DAP available|confirmed provider/i)
  })

  it('internal-only card returns null (not rendered) when previewMode=false', () => {
    const html = renderToString(<DapProviderCard model={makeCard('unavailable_internal_only')} />)
    expect(html).toBe('')
  })

  it('internal-only card renders internal warning in previewMode', () => {
    const html = renderToString(
      <DapProviderCard model={makeCard('unavailable_internal_only')} previewMode />
    )
    expect(html).toContain('Internal only')
    expect(html).toContain('does not appear to patients')
  })

  it('card renders CTA from model — does not hardcode CTA type', () => {
    const model = makeCard('confirmed', ALL_GATES)
    const html = renderToString(<DapProviderCard model={model} />)
    expect(html).toContain(model.primaryCta.label)
  })

  it('requested card renders "Requested by patients" badge', () => {
    const html = renderToString(<DapProviderCard model={makeCard('requested')} />)
    expect(html).toContain('Requested by patients')
  })

  it('data-availability-state attribute matches model state', () => {
    const html = renderToString(<DapProviderCard model={makeCard('not_confirmed')} />)
    expect(html).toContain('data-availability-state="not_confirmed"')
  })
})

// ─── 3. Badge safety ──────────────────────────────────────────────────────────

describe('Badge safety', () => {
  it('confirmed badge renders "DAP confirmed" label', () => {
    const html = renderToString(
      <DapStatusBadge badge={getPracticeStatusBadge('confirmed')} />
    )
    expect(html).toContain('DAP confirmed')
  })

  it('not_confirmed badge does not say "available" or "confirmed provider"', () => {
    const html = renderToString(
      <DapStatusBadge badge={getPracticeStatusBadge('not_confirmed')} />
    )
    expect(html).not.toMatch(/available|confirmed provider/i)
    expect(html).toContain('Not confirmed')
  })

  it('internal badge returns empty string when showInternalWarning=false', () => {
    const html = renderToString(
      <DapStatusBadge badge={getPracticeStatusBadge('unavailable_internal_only')} />
    )
    expect(html).toBe('')
  })

  it('requested badge renders "Requested by patients"', () => {
    const html = renderToString(
      <DapStatusBadge badge={getPracticeStatusBadge('requested')} />
    )
    expect(html).toContain('Requested by patients')
  })

  it('data-badge-variant attribute matches variant', () => {
    const html = renderToString(
      <DapStatusBadge badge={getPracticeStatusBadge('confirmed')} />
    )
    expect(html).toContain('data-badge-variant="confirmed"')
  })
})

// ─── 4. City availability summary ─────────────────────────────────────────────

describe('City availability summary', () => {
  it('city with confirmed providers shows "offering" heading pattern', () => {
    const model = getCityAvailabilitySummary('San Diego', 2, 0, 10)
    const html  = renderToString(<DapCityAvailabilitySummaryView model={model} />)
    expect(html).toContain('offering Dental Advantage Plan in San Diego')
  })

  it('city without confirmed providers shows "not yet confirmed" in subheading', () => {
    const model = getCityAvailabilitySummary('Chula Vista', 0, 1, 5)
    const html  = renderToString(<DapCityAvailabilitySummaryView model={model} />)
    expect(html).toContain('not yet confirmed')
  })

  it('city summary does not imply all dentists participate', () => {
    const model = getCityAvailabilitySummary('San Diego', 3, 0, 50)
    const html  = renderToString(<DapCityAvailabilitySummaryView model={model} />)
    expect(html).not.toMatch(/all dentists|every dentist|any dentist/i)
  })

  it('city with no confirmed providers renders a caveat about no guarantee', () => {
    const model = getCityAvailabilitySummary('El Cajon', 0, 0, 8)
    const html  = renderToString(<DapCityAvailabilitySummaryView model={model} />)
    expect(html).toContain('does not guarantee')
  })

  it('data-has-confirmed-providers attribute reflects model', () => {
    const withConfirmed    = getCityAvailabilitySummary('La Mesa', 1, 0, 3)
    const withoutConfirmed = getCityAvailabilitySummary('El Cajon', 0, 0, 5)
    expect(renderToString(<DapCityAvailabilitySummaryView model={withConfirmed} />)).toContain('data-has-confirmed-providers="true"')
    expect(renderToString(<DapCityAvailabilitySummaryView model={withoutConfirmed} />)).toContain('data-has-confirmed-providers="false"')
  })
})

// ─── 5. No-results panel ──────────────────────────────────────────────────────

describe('No-results panel', () => {
  it('renders a request-oriented primary CTA', () => {
    const model = getNoResultsModel('San Diego')
    const html  = renderToString(<DapNoResultsPanel model={model} />)
    expect(html).toContain('data-cta-type="request_city_availability"')
  })

  it('includes a caveat about no guarantee', () => {
    const html = renderToString(<DapNoResultsPanel model={getNoResultsModel('San Diego')} />)
    expect(html).toContain('does not guarantee DAP availability')
  })

  it('does not imply DAP is permanently unavailable', () => {
    const html = renderToString(<DapNoResultsPanel model={getNoResultsModel('San Diego')} />)
    expect(html).not.toMatch(/not available forever|permanently unavailable|DAP does not exist/i)
  })

  it('data-is-dead-end is "false"', () => {
    const html = renderToString(<DapNoResultsPanel model={getNoResultsModel('San Diego')} />)
    expect(html).toContain('data-is-dead-end="false"')
  })

  it('renders a secondary CTA as a fallback path', () => {
    const model = getNoResultsModel('San Diego')
    const html  = renderToString(<DapNoResultsPanel model={model} />)
    // The model always has a secondary CTA
    expect(model.secondaryCta).not.toBeNull()
    expect(html).toContain(model.secondaryCta!.label)
  })
})

// ─── 6. Request flow preview ──────────────────────────────────────────────────

describe('Request flow preview', () => {
  it('consent checkbox renders with name="consentToContact"', () => {
    const html = renderToString(<DapRequestFlowPreview model={getRequestFlowModel('specific_dentist')} />)
    expect(html).toContain('name="consentToContact"')
  })

  it('submit button is disabled', () => {
    const html = renderToString(<DapRequestFlowPreview model={getRequestFlowModel('specific_dentist')} />)
    expect(html).toContain('data-preview-submit')
    expect(html).toContain('disabled')
  })

  it('availability caveat text renders', () => {
    const model = getRequestFlowModel('specific_dentist')
    const html  = renderToString(<DapRequestFlowPreview model={model} />)
    expect(html).toContain('does not guarantee')
  })

  it('preview mode banner is visible', () => {
    const html = renderToString(<DapRequestFlowPreview model={getRequestFlowModel('city_availability')} />)
    expect(html).toContain('data-preview-banner')
    expect(html).toContain('Preview Mode')
  })

  it('no real form action or API route is present', () => {
    const html = renderToString(<DapRequestFlowPreview model={getRequestFlowModel('specific_dentist')} />)
    // No <form action="/api/..."> or fetch routes — preview banner may mention webhook in copy
    expect(html).not.toContain('action="/api/')
    expect(html).not.toContain('action="https://')
    // No live <form> element at all (the preview uses disabled button, not a <form>)
    expect(html).not.toContain('<form')
  })

  it('required fields render in the output', () => {
    const html = renderToString(<DapRequestFlowPreview model={getRequestFlowModel('specific_dentist')} />)
    expect(html).toContain('dentistName')
    expect(html).toContain('location')
  })
})

// ─── 7. Search results preview ────────────────────────────────────────────────

describe('Search results preview', () => {
  it('renders confirmed provider cards from model', () => {
    const model = getSearchResultsModel({ confirmedCount: 2, notConfirmedCount: 0, requestedCount: 0, searchLocation: 'San Diego' })
    const cards = [makeCard('confirmed', ALL_GATES), makeCard('confirmed', ALL_GATES)]
    const html  = renderToString(<DapSearchResultsPreview model={model} providerCards={cards} />)
    expect(html).toContain('data-confirmed-section')
  })

  it('renders no-results panel when model has noResultsModel', () => {
    const model = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 0, requestedCount: 0, searchLocation: 'Chula Vista' })
    const html  = renderToString(<DapSearchResultsPreview model={model} providerCards={[]} />)
    expect(html).toContain('data-no-results-panel')
  })

  it('does not render internal-only cards as public providers', () => {
    const model = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 1, requestedCount: 0, searchLocation: 'San Diego' })
    const cards = [makeCard('unavailable_internal_only')]
    const html  = renderToString(<DapSearchResultsPreview model={model} providerCards={cards} />)
    // Internal card is excluded (isPublic=false, previewMode=false)
    expect(html).not.toContain('data-availability-state="unavailable_internal_only"')
  })

  it('data-is-dead-end is "false" regardless of result count', () => {
    const emptyModel = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 0, requestedCount: 0, searchLocation: 'Empty Town' })
    const html = renderToString(<DapSearchResultsPreview model={emptyModel} providerCards={[]} />)
    expect(html).toContain('data-is-dead-end="false"')
  })

  it('shows request path when no confirmed providers exist but other cards are present', () => {
    const model = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 2, requestedCount: 0, searchLocation: 'San Diego' })
    const cards = [makeCard('not_confirmed'), makeCard('not_confirmed')]
    const html  = renderToString(<DapSearchResultsPreview model={model} providerCards={cards} />)
    expect(html).toContain('data-request-path')
  })
})

// ─── 8. Homepage hero preview ─────────────────────────────────────────────────

describe('Homepage hero preview', () => {
  it('renders headline from model', () => {
    const model = getHomepageHeroModel()
    const html  = renderToString(<DapHomepageHeroPreview model={model} />)
    expect(html).toContain(model.headline)
  })

  it('renders primary CTA label from model', () => {
    const model = getHomepageHeroModel()
    const html  = renderToString(<DapHomepageHeroPreview model={model} />)
    expect(html).toContain(model.primaryCta.label)
  })

  it('data-implies-universal-availability is "false"', () => {
    const model = getHomepageHeroModel()
    const html  = renderToString(<DapHomepageHeroPreview model={model} />)
    expect(html).toContain('data-implies-universal-availability="false"')
  })

  it('preview label is visible in the output', () => {
    const html = renderToString(<DapHomepageHeroPreview model={getHomepageHeroModel()} />)
    expect(html).toContain('not a public route')
  })

  it('does not imply universal availability in the rendered copy', () => {
    const html = renderToString(<DapHomepageHeroPreview model={getHomepageHeroModel()} />)
    expect(html).not.toMatch(/every dentist|all dentists|any dentist|universally available/i)
  })
})
