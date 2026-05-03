import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { DapHowItWorksSection } from '@/components/cb-control-center/dap-public/DapHowItWorksSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapHomepagePage } from '@/components/cb-control-center/dap-pages/DapHomepagePage'
import { DapCityPage } from '@/components/cb-control-center/dap-pages/DapCityPage'
import { DapDentistPage } from '@/components/cb-control-center/dap-pages/DapDentistPage'
import { DapSearchResultsPage } from '@/components/cb-control-center/dap-pages/DapSearchResultsPage'
import { DapDecisionPage } from '@/components/cb-control-center/dap-pages/DapDecisionPage'
import { DapTreatmentPage } from '@/components/cb-control-center/dap-pages/DapTreatmentPage'
import { DapRequestFlowPage } from '@/components/cb-control-center/dap-pages/DapRequestFlowPage'
import {
  getDefaultHowItWorksModel,
  getDefaultFaqModel,
  getDefaultComparisonModel,
  getDefaultSavingsEducationModel,
} from '../../dap/site/dapPublicSectionModels'
import {
  getHomepageHeroModel,
  getRequestFlowModel,
  getCityAvailabilitySummary,
  getCityPageModel,
  getSearchResultsModel,
  getDecisionPageCtaModel,
  getTreatmentPageCtaModel,
  getNoResultsModel,
  getDentistPageModel,
  getPracticeStatusBadge,
  getPrimaryCtaForPractice,
  getSecondaryCtaForPractice,
  getAllowedPublicClaimsForPractice,
} from '../../dap/registry/dapPublicUxRules'
import type {
  DapProviderCardModel,
  DapGateState,
  DapAvailabilityState,
} from '../../dap/site/dapPublicUxTypes'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NO_GATES: DapGateState  = { offerTermsValidated: false, ctaGateUnlocked: false }
const ALL_GATES: DapGateState = { offerTermsValidated: true,  ctaGateUnlocked: true  }

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

// ─── Group 1: DapHowItWorksSection ────────────────────────────────────────────

describe('DapHowItWorksSection', () => {
  it('renders data-section="how-it-works"', () => {
    const model = getDefaultHowItWorksModel()
    const html = renderToString(<DapHowItWorksSection model={model} />)
    expect(html).toContain('data-section="how-it-works"')
  })

  it('renders all steps', () => {
    const model = getDefaultHowItWorksModel()
    const html = renderToString(<DapHowItWorksSection model={model} />)
    expect(model.steps.length).toBe(4)
    for (const step of model.steps) {
      expect(html).toContain(step.title)
      expect(html).toContain(step.description)
    }
  })

  it('renders data-step attribute for each step', () => {
    const model = getDefaultHowItWorksModel()
    const html = renderToString(<DapHowItWorksSection model={model} />)
    expect(html).toContain('data-step="1"')
    expect(html).toContain('data-step="4"')
  })

  it('renders section heading', () => {
    const html = renderToString(<DapHowItWorksSection model={getDefaultHowItWorksModel()} />)
    expect(html).toContain('How Dental Advantage Plan works')
  })

  it('renders custom step models correctly', () => {
    const model = { steps: [{ step: 1, title: 'Step one', description: 'Do the thing' }] }
    const html = renderToString(<DapHowItWorksSection model={model} />)
    expect(html).toContain('Step one')
    expect(html).toContain('Do the thing')
  })
})

// ─── Group 2: DapFaqSection ───────────────────────────────────────────────────

describe('DapFaqSection', () => {
  it('renders data-section="faq"', () => {
    const html = renderToString(<DapFaqSection model={getDefaultFaqModel('homepage')} />)
    expect(html).toContain('data-section="faq"')
  })

  it('renders all FAQ items with data-faq-item', () => {
    const model = getDefaultFaqModel('homepage')
    const html = renderToString(<DapFaqSection model={model} />)
    // Count attribute occurrences — one per item
    const itemCount = (html.match(/data-faq-item/g) ?? []).length
    expect(itemCount).toBe(model.items.length)
    // Questions have no special chars so can be compared verbatim
    for (const item of model.items) {
      expect(html).toContain(item.question)
    }
  })

  it('renders section heading', () => {
    const html = renderToString(<DapFaqSection model={getDefaultFaqModel('homepage')} />)
    expect(html).toContain('Frequently asked questions')
  })

  it('renders custom FAQ items', () => {
    const model = { items: [{ question: 'Q1?', answer: 'A1.' }] }
    const html = renderToString(<DapFaqSection model={model} />)
    expect(html).toContain('Q1?')
    expect(html).toContain('A1.')
  })
})

// ─── Group 3: DapComparisonSection ───────────────────────────────────────────

describe('DapComparisonSection', () => {
  it('renders data-section="comparison"', () => {
    const html = renderToString(<DapComparisonSection model={getDefaultComparisonModel()} />)
    expect(html).toContain('data-section="comparison"')
  })

  it('renders model headline', () => {
    const model = getDefaultComparisonModel()
    const html = renderToString(<DapComparisonSection model={model} />)
    expect(html).toContain(model.headline)
  })

  it('renders data-comparison-column for each column', () => {
    const model = getDefaultComparisonModel()
    const html = renderToString(<DapComparisonSection model={model} />)
    for (const col of model.columns) {
      expect(html).toContain(`data-comparison-column="${col.label}"`)
    }
  })

  it('renders all column points', () => {
    const model = getDefaultComparisonModel()
    const html = renderToString(<DapComparisonSection model={model} />)
    for (const col of model.columns) {
      for (const point of col.points) {
        expect(html).toContain(point)
      }
    }
  })
})

// ─── Group 4: DapSavingsEducationSection ─────────────────────────────────────

describe('DapSavingsEducationSection', () => {
  it('renders data-section="savings-education"', () => {
    const html = renderToString(<DapSavingsEducationSection model={getDefaultSavingsEducationModel()} />)
    expect(html).toContain('data-section="savings-education"')
  })

  it('renders data-implies-guaranteed-pricing="false" always', () => {
    const html = renderToString(<DapSavingsEducationSection model={getDefaultSavingsEducationModel()} />)
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
    expect(html).not.toContain('data-implies-guaranteed-pricing="true"')
  })

  it('renders headline and body content', () => {
    const model = getDefaultSavingsEducationModel()
    const html = renderToString(<DapSavingsEducationSection model={model} />)
    expect(html).toContain(model.headline)
    expect(html).toContain(model.body.slice(0, 40))
  })

  it('body does not promise guaranteed savings amounts', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.body).not.toMatch(/guaranteed|you will save \$|save exactly/i)
    expect(model.impliesGuaranteedPricing).toBe(false)
  })
})

// ─── Group 5: Factory functions ───────────────────────────────────────────────

describe('dapPublicSectionModels factory functions', () => {
  it('getDefaultHowItWorksModel returns 4 steps', () => {
    const model = getDefaultHowItWorksModel()
    expect(model.steps.length).toBe(4)
    expect(model.steps[0].step).toBe(1)
    expect(model.steps[3].step).toBe(4)
  })

  it('getDefaultFaqModel homepage returns 3 shared items', () => {
    const model = getDefaultFaqModel('homepage')
    expect(model.items.length).toBe(3)
  })

  it('getDefaultFaqModel dentist_page includes dentist-specific extra item', () => {
    const model = getDefaultFaqModel('dentist_page')
    expect(model.items.length).toBe(4)
    expect(model.items[3].question).toMatch(/request dap at a dentist/i)
  })

  it('getDefaultFaqModel city_page includes city-specific extra item', () => {
    const model = getDefaultFaqModel('city_page')
    expect(model.items.length).toBe(4)
    expect(model.items[3].question).toMatch(/no dentists in my city/i)
  })

  it('getDefaultComparisonModel returns 2 columns', () => {
    const model = getDefaultComparisonModel()
    expect(model.columns.length).toBe(2)
    expect(model.columns[0].points.length).toBeGreaterThan(0)
    expect(model.columns[1].points.length).toBeGreaterThan(0)
  })

  it('getDefaultSavingsEducationModel has impliesGuaranteedPricing === false', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.impliesGuaranteedPricing).toBe(false)
  })
})

// ─── Group 6: Page composition ────────────────────────────────────────────────

describe('Page composition', () => {
  it('DapHomepagePage renders all four sections', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).toContain('data-page-kind="homepage"')
    expect(html).toContain('data-section="how-it-works"')
    expect(html).toContain('data-section="comparison"')
    expect(html).toContain('data-section="faq"')
  })

  it('DapCityPage renders city h1, summary, provider list, and sections', () => {
    const model = getCityPageModel('San Diego', 3)
    const summary = getCityAvailabilitySummary('San Diego', 3, 1, 5)
    const cards = [makeCard('confirmed', ALL_GATES)]
    const html = renderToString(
      <DapCityPage
        model={model}
        summary={summary}
        cards={cards}
        noResults={null}
        howItWorks={getDefaultHowItWorksModel()}
        faq={getDefaultFaqModel('city_page')}
      />
    )
    expect(html).toContain('data-page-kind="city_page"')
    expect(html).toContain('data-city-h1')
    expect(html).toContain('data-provider-list')
    expect(html).toContain('data-section="how-it-works"')
    expect(html).toContain('data-section="faq"')
  })

  it('DapDentistPage renders template-id, provider card, and savings education', () => {
    const card = makeCard('confirmed', ALL_GATES)
    const dentistModel = getDentistPageModel('confirmed', 'Test Practice', ALL_GATES)!
    const html = renderToString(
      <DapDentistPage
        model={dentistModel}
        card={card}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('dentist_page')}
      />
    )
    expect(html).toContain('data-page-kind="dentist_page"')
    expect(html).toContain(`data-template-id="${dentistModel.templateId}"`)
    expect(html).toContain('data-section="savings-education"')
    expect(html).toContain('data-section="faq"')
  })

  it('DapSearchResultsPage renders search results and how-it-works', () => {
    const model = getSearchResultsModel({ confirmedCount: 1, notConfirmedCount: 0, requestedCount: 0, searchLocation: 'San Diego' })
    const cards = [makeCard('confirmed', ALL_GATES)]
    const html = renderToString(
      <DapSearchResultsPage
        model={model}
        providerCards={cards}
        howItWorks={getDefaultHowItWorksModel()}
      />
    )
    expect(html).toContain('data-page-kind="search_results_page"')
    expect(html).toContain('data-section="how-it-works"')
  })

  it('DapDecisionPage renders with implies-pricing="false"', () => {
    const html = renderToString(
      <DapDecisionPage
        h1="Is Dental Advantage Plan worth it?"
        ctaModel={getDecisionPageCtaModel()}
        comparison={getDefaultComparisonModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('decision_page')}
      />
    )
    expect(html).toContain('data-page-kind="decision_page"')
    expect(html).toContain('data-implies-pricing="false"')
    expect(html).toContain('data-section="savings-education"')
    expect(html).toContain('data-section="comparison"')
  })

  it('DapTreatmentPage renders with implies-guaranteed-pricing="false"', () => {
    const html = renderToString(
      <DapTreatmentPage
        h1="Dental implants and Dental Advantage Plan"
        ctaModel={getTreatmentPageCtaModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('treatment_page')}
      />
    )
    expect(html).toContain('data-page-kind="treatment_page"')
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
    expect(html).toContain('data-section="savings-education"')
  })

  it('DapRequestFlowPage renders request flow preview', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).toContain('data-page-kind="request_flow"')
    expect(html).toContain('data-consent-field')
  })
})

// ─── Group 7: Page-level safety invariants ────────────────────────────────────

describe('Page-level safety invariants', () => {
  it('DapHomepagePage hero never implies universal availability', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).toContain('data-implies-universal-availability="false"')
    expect(html).not.toContain('data-implies-universal-availability="true"')
  })

  it('DapCityPage never implies universal availability', () => {
    const model = getCityPageModel('Los Angeles', 0)
    const html = renderToString(
      <DapCityPage
        model={model}
        summary={getCityAvailabilitySummary('Los Angeles', 0, 0, 0)}
        cards={[]}
        noResults={getNoResultsModel('Los Angeles')}
        howItWorks={getDefaultHowItWorksModel()}
        faq={getDefaultFaqModel('city_page')}
      />
    )
    expect(html).toContain('data-implies-universal-availability="false"')
  })

  it('DapCityPage with no results renders no-results panel, not dead end', () => {
    const model = getCityPageModel('Nowhere', 0)
    const html = renderToString(
      <DapCityPage
        model={model}
        summary={getCityAvailabilitySummary('Nowhere', 0, 0, 0)}
        cards={[]}
        noResults={getNoResultsModel('Nowhere')}
        howItWorks={getDefaultHowItWorksModel()}
        faq={getDefaultFaqModel('city_page')}
      />
    )
    expect(html).toContain('data-is-dead-end="false"')
    expect(html).not.toContain('data-is-dead-end="true"')
  })

  it('DapDecisionPage rendered output does not include unverified pricing promises', () => {
    const html = renderToString(
      <DapDecisionPage
        h1="Should I get dental insurance or a savings plan?"
        ctaModel={getDecisionPageCtaModel()}
        comparison={getDefaultComparisonModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('decision_page')}
      />
    )
    expect(html).not.toMatch(/you will save \$\d+|guaranteed savings|pricing confirmed/i)
    expect(html).toContain('data-implies-pricing="false"')
  })

  it('DapTreatmentPage savings education does not guarantee specific pricing', () => {
    const savingsEd = getDefaultSavingsEducationModel()
    const html = renderToString(
      <DapTreatmentPage
        h1="Teeth whitening and Dental Advantage Plan"
        ctaModel={getTreatmentPageCtaModel()}
        savingsEd={savingsEd}
        faq={getDefaultFaqModel('treatment_page')}
      />
    )
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
    expect(html).not.toMatch(/guaranteed pricing|you will pay \$|fixed price/i)
  })

  it('DapRequestFlowPage never shows a live action route', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('specific_dentist')} />
    )
    expect(html).not.toContain('action="/api/')
    expect(html).not.toContain('action="https://')
    expect(html).not.toContain('<form')
  })
})
