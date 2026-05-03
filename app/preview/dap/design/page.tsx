import type { DapAvailabilityState, DapGateState, DapProviderCardModel } from '@/lib/dap/site/dapPublicUxTypes'
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
} from '@/lib/dap/registry/dapPublicUxRules'
import {
  getDefaultHowItWorksModel,
  getDefaultFaqModel,
  getDefaultComparisonModel,
  getDefaultSavingsEducationModel,
} from '@/lib/cb-control-center/dapPublicSectionModels'

import { DapHomepagePage } from '@/components/cb-control-center/dap-pages/DapHomepagePage'
import { DapCityPage } from '@/components/cb-control-center/dap-pages/DapCityPage'
import { DapDentistPage } from '@/components/cb-control-center/dap-pages/DapDentistPage'
import { DapSearchResultsPage } from '@/components/cb-control-center/dap-pages/DapSearchResultsPage'
import { DapDecisionPage } from '@/components/cb-control-center/dap-pages/DapDecisionPage'
import { DapTreatmentPage } from '@/components/cb-control-center/dap-pages/DapTreatmentPage'
import { DapRequestFlowPage } from '@/components/cb-control-center/dap-pages/DapRequestFlowPage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_GATES: DapGateState = { offerTermsValidated: true, ctaGateUnlocked: true }
const NO_GATES: DapGateState  = { offerTermsValidated: false, ctaGateUnlocked: false }

function makeCard(
  id: string,
  name: string,
  city: string,
  stateCode: string,
  availState: DapAvailabilityState,
  gates: DapGateState = NO_GATES,
): DapProviderCardModel {
  const primaryType = getPrimaryCtaForPractice(availState, gates)
  const secondaryType = getSecondaryCtaForPractice(availState, gates)
  return {
    practiceId: id,
    practiceName: name,
    city,
    state: stateCode,
    availabilityState: availState,
    statusBadge: getPracticeStatusBadge(availState),
    primaryCta: { type: primaryType, label: primaryType, href: '/preview' },
    secondaryCta: secondaryType ? { type: secondaryType, label: secondaryType, href: '/preview' } : null,
    allowedClaims: getAllowedPublicClaimsForPractice(availState, gates),
    isPublic: availState !== 'unavailable_internal_only',
  }
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function PreviewSection({ label, slug, children }: { label: string; slug: string; children: React.ReactNode }) {
  return (
    <section id={slug} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold tracking-wide">
          {label}
        </span>
        <div className="flex-1 border-t border-gray-200" />
      </div>
      {children}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DapDesignPreviewPage() {
  const howItWorks  = getDefaultHowItWorksModel()
  const comparison  = getDefaultComparisonModel()
  const savingsEd   = getDefaultSavingsEducationModel()

  // City: confirmed (San Diego — 2 confirmed providers)
  const sdModel   = getCityPageModel('San Diego', 2)
  const sdSummary = getCityAvailabilitySummary('San Diego', 2, 1, 8)
  const sdCards   = [
    makeCard('sd-01', 'Gaslamp Dental Group', 'San Diego', 'CA', 'confirmed', ALL_GATES),
    makeCard('sd-02', 'Hillcrest Family Dentistry', 'San Diego', 'CA', 'confirmed', ALL_GATES),
    makeCard('sd-03', 'Mission Hills Smiles', 'San Diego', 'CA', 'requested'),
  ]

  // City: demand capture (Phoenix — 0 confirmed)
  const phxModel   = getCityPageModel('Phoenix', 0)
  const phxSummary = getCityAvailabilitySummary('Phoenix', 0, 0, 3)
  const phxNoResults = getNoResultsModel('Phoenix')

  // Dentist: confirmed
  const confirmedDentistModel = getDentistPageModel('confirmed', 'Gaslamp Dental Group', ALL_GATES)!
  const confirmedCard = makeCard('sd-01', 'Gaslamp Dental Group', 'San Diego', 'CA', 'confirmed', ALL_GATES)

  // Dentist: requested (patients have asked)
  const requestedDentistModel = getDentistPageModel('requested', 'Mission Hills Smiles', NO_GATES)!
  const requestedCard = makeCard('sd-03', 'Mission Hills Smiles', 'San Diego', 'CA', 'requested')

  // Search results: with confirmed providers
  const searchWithResults = getSearchResultsModel({
    confirmedCount: 2,
    notConfirmedCount: 1,
    requestedCount: 1,
    searchLocation: 'San Diego',
  })

  // Search results: no results (demand capture)
  const searchNoResults = getSearchResultsModel({
    confirmedCount: 0,
    notConfirmedCount: 0,
    requestedCount: 0,
    searchLocation: 'Mesa, AZ',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Design preview header */}
      <div className="bg-gray-900 text-white px-6 py-5" data-design-preview-header>
        <div className="max-w-2xl mx-auto space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Phase 8A — Design Preview
          </p>
          <h1 className="text-lg font-bold">DAP Public Site — Visual Direction</h1>
          <p className="text-xs text-gray-400">
            All compositions use Phase 7D model data. No public routes, no backend, no form submission.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-20">

        {/* 1. Homepage */}
        <PreviewSection label="1 — Homepage" slug="homepage">
          <DapHomepagePage
            hero={getHomepageHeroModel()}
            howItWorks={howItWorks}
            comparison={comparison}
            faq={getDefaultFaqModel('homepage')}
          />
        </PreviewSection>

        {/* 2. City page — confirmed providers */}
        <PreviewSection label="2 — City Page (confirmed)" slug="city-confirmed">
          <DapCityPage
            model={sdModel}
            summary={sdSummary}
            cards={sdCards}
            noResults={null}
            howItWorks={howItWorks}
            faq={getDefaultFaqModel('city_page')}
          />
        </PreviewSection>

        {/* 3. City page — demand capture (no confirmed providers) */}
        <PreviewSection label="3 — City Page (demand capture)" slug="city-demand-capture">
          <DapCityPage
            model={phxModel}
            summary={phxSummary}
            cards={[]}
            noResults={phxNoResults}
            howItWorks={howItWorks}
            faq={getDefaultFaqModel('city_page')}
          />
        </PreviewSection>

        {/* 4. Dentist page — confirmed */}
        <PreviewSection label="4 — Dentist Page (confirmed)" slug="dentist-confirmed">
          <DapDentistPage
            model={confirmedDentistModel}
            card={confirmedCard}
            savingsEd={savingsEd}
            faq={getDefaultFaqModel('dentist_page')}
          />
        </PreviewSection>

        {/* 5. Dentist page — requested (patients asked, not confirmed) */}
        <PreviewSection label="5 — Dentist Page (requested)" slug="dentist-requested">
          <DapDentistPage
            model={requestedDentistModel}
            card={requestedCard}
            savingsEd={savingsEd}
            faq={getDefaultFaqModel('dentist_page')}
          />
        </PreviewSection>

        {/* 6. Search results — with confirmed providers */}
        <PreviewSection label="6 — Search Results (with providers)" slug="search-results">
          <DapSearchResultsPage
            model={searchWithResults}
            providerCards={sdCards}
            howItWorks={howItWorks}
          />
        </PreviewSection>

        {/* 7. Search results — no results / demand capture */}
        <PreviewSection label="7 — Search Results (no results)" slug="search-no-results">
          <DapSearchResultsPage
            model={searchNoResults}
            providerCards={[]}
            howItWorks={howItWorks}
          />
        </PreviewSection>

        {/* 8. Decision page */}
        <PreviewSection label="8 — Decision Page" slug="decision">
          <DapDecisionPage
            h1="Is a dental savings plan right for me?"
            ctaModel={getDecisionPageCtaModel()}
            comparison={comparison}
            savingsEd={savingsEd}
            faq={getDefaultFaqModel('decision_page')}
          />
        </PreviewSection>

        {/* 9. Treatment page */}
        <PreviewSection label="9 — Treatment Page" slug="treatment">
          <DapTreatmentPage
            h1="Dental implants and Dental Advantage Plan"
            ctaModel={getTreatmentPageCtaModel()}
            savingsEd={savingsEd}
            faq={getDefaultFaqModel('treatment_page')}
          />
        </PreviewSection>

        {/* 10. Request flow */}
        <PreviewSection label="10 — Request Flow" slug="request-flow">
          <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
        </PreviewSection>

      </div>
    </div>
  )
}
