import type { ProviderStatus, PublicClaimLevel } from '@/lib/dap/registry/dapProviderStatusTypes'

export type { ProviderStatus, PublicClaimLevel }

export type PipelineStatus = "complete" | "in_progress" | "blocked" | "not_started"
export type BlockerSeverity = "high" | "medium" | "low"

export interface BusinessRecord {
  id: string
  name: string
  websiteUrl: string
  category: string
  pipelineStatus: string
  currentStage: string
  overallReadiness: number
  primaryDecision: string
}

export interface PipelineStage {
  id: string
  name: string
  status: PipelineStatus
  summary: string
  blockers: string[]
  artifacts: string[]
  artifactCount: number
  primaryAction: string
  lastUpdated?: string
  locked?: boolean
}

export interface PipelineBlocker {
  id: string
  severity: BlockerSeverity
  stage: string
  blocker: string
  whyItMatters: string
  nextAction: string
}

export interface CrawlPage {
  title: string
  url: string
  signals: string[]
}

export interface CrawlOutput {
  crawlRunId: string
  status: PipelineStatus
  pagesFound: CrawlPage[]
  extractedSignals: {
    headlines: number
    ctas: number
    pricingMentions: number
    trustSignals: number
    faqs: number
  }
}

export interface CurrentCommand {
  stage: string
  status: PipelineStatus
  primaryBlocker: string
  whyItMatters: string
  wrongNextMove: string
  correctNextAction: string
  stageLocked: boolean
}

export interface BusinessTruthRecord {
  business_name: string
  category: string
  primary_customer: string
  primary_problem: string
  offer: string
  decision_question: string
  pricing_status: string
  trust_signals: string[]
  known_gaps: string[]
}

export interface StrategyRecord {
  storybrandStatus: string
  decisionStatus: string
  currentDecisionQuestion: string
  positioningAngle: string
  homepageGoal: string
  nextStrategyAction: string
}

export type DapPageTypeId =
  | 'confirmed-provider-page'
  | 'unconfirmed-practice-page'
  | 'city-zip-demand-page'
  | 'education-decision-page'

export interface DapPageTypeSpec {
  id: DapPageTypeId
  name: string
  shortName: string
  gateBlocker: string | null
  conditionalWithoutGate: boolean
  allowedClaims: string[]
  forbiddenClaims: string[]
  primaryCta: string
  color: 'green' | 'amber' | 'blue' | 'gray'
}

export interface PagePlanItem {
  title: string
  status: string
  reason: string
  pageType: DapPageTypeId
}

export interface ActivityEvent {
  timestamp: string
  description: string
}

export type InputStatus = "accepted" | "needs_review" | "rejected"

export interface InitialInput {
  businessName: string
  sourceWebsite: string
  businessType: string
  pipelineGoal: string
  seedCustomerDecision: string
  inputStatus: InputStatus
}

// v0.3 — Provider status + dentist page template system

export type DentistTemplateId = 'confirmed-provider' | 'unconfirmed-practice' | 'internal_only'

// Separate verification gates — each is independent of provider_status
export type PricingStatus = 'verified' | 'unverified' | 'partial'
export type OfferTermsStatus = 'complete' | 'incomplete' | 'pending'

export interface ProviderStatusSpec {
  status: ProviderStatus
  label: string
  description: string
  appearsInSearch: boolean
  canLabelAsOfferingDAP: boolean
  allowedClaims: string[]
  forbiddenClaims: string[]
  uiTreatment: string
  ctaAllowed: string | null
  dapNextAction: string
  ifOnlyStatusInArea: string
}

export type SearchPath =
  | 'confirmed-available'       // ≥1 confirmed_dap_provider found near patient's ZIP
  | 'no-confirmed-nearby'       // 0 confirmed providers in patient's ZIP/area
  | 'specific-dentist-request'  // patient names a specific practice for recruitment

export interface SearchPathRule {
  id: SearchPath
  label: string
  trigger: string
  patientQuestion: string
  systemBehavior: string[]
  allowedClaims: string[]
  forbiddenClaims: string[]
  primaryCTA: string
  ctaDestination: string
  mockResultSummary: string
}

export interface DentistPageTemplate {
  id: DentistTemplateId
  name: string
  gateCriteria: string
  providerStatuses: ProviderStatus[]
  sampleH1: string
  sampleSubhead: string
  ctaText: string
  ctaDestination: string
  allowedLanguage: string[]
  forbiddenLanguage: string[]
  requiredDisclaimer: string
}

export interface MockDentistPage {
  id: string
  practiceName: string
  city: string
  zip: string
  provider_status: ProviderStatus
  assignedTemplate: DentistTemplateId
  pageSlug?: string  // absent for declined practices — no public URL exists
  eligible: boolean
  eligibilityReason: string
}

// v0.2 — Business Truth schema model

export type FieldStatus = "confirmed" | "needs_confirmation" | "missing" | "blocked"
export type ResolutionType = "confirm" | "reject" | "defer"
export type BlockerResolutionStatus = "open" | "resolved"

export interface TruthField {
  id: string
  label: string
  value: string | null
  status: FieldStatus
}

export interface TruthSection {
  id: string
  name: string
  fields: TruthField[]
}

export interface ResolutionOption {
  type: ResolutionType
  label: string
}

export interface EnrichedBlocker {
  id: string
  title: string
  severity: BlockerSeverity
  relatedSection: string
  affectedFields: string[]
  description: string
  whyItMatters: string
  requiredEvidence: string[]
  resolutionOptions: ResolutionOption[]
  gateCondition: string
  downstreamUnlockImpact: string[]
  resolutionStatus: BlockerResolutionStatus
}
