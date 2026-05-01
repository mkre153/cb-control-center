export type ArchitecturePageType =
  | 'homepage'
  | 'search_or_zip_lookup'
  | 'city_landing_page'
  | 'confirmed_provider_page'
  | 'request_availability_page'
  | 'how_it_works_guide'
  | 'dentist_recruitment_page'
  | 'internal_only_practice_record'

// recommended  — all required gates satisfied, safe to build as-is
// conditional  — some gates satisfied, buildable with explicit restrictions
// blocked      — required gate(s) not yet satisfied, cannot build safely
// internal_only— never public; CRM / admin layer only
export type ArchitectureEligibilityStatus =
  | 'recommended'
  | 'conditional'
  | 'blocked'
  | 'internal_only'

export interface ArchitecturePageSpec {
  id: ArchitecturePageType
  label: string
  routePattern: string
  audience: 'patients' | 'practices' | 'internal'
  purpose: string
  publicVisibility: boolean
  requiredTruthFields: string[]      // schema field IDs that must be confirmed
  requiredGates: string[]            // human-readable gate descriptions
  allowedProviderStatuses: string[]  // empty = no per-provider context on this page
  blockedProviderStatuses: string[]
  allowedCtas: string[]
  blockedCtas: string[]
  allowedClaims: string[]
  forbiddenClaims: string[]
  requiredModules: string[]
  riskNotes: string[]
}

export interface ArchitectureRisk {
  id: string
  severity: 'high' | 'medium' | 'low'
  pageType: ArchitecturePageType
  description: string
  condition: string   // what triggers this risk
  resolution: string  // what resolves it
}

// Derived from effective schema + blocker state inside SiteArchitectureTab
export interface ArchitectureEvaluationInput {
  confirmedProviderExists: boolean
  offerTermsValidated: boolean
  ctaGateUnlocked: boolean
  requestFlowConfirmed: boolean
  declinedRoutingConfirmed: boolean
  activeBlockerIds: string[]
}

export interface EvaluatedPage {
  spec: ArchitecturePageSpec
  status: ArchitectureEligibilityStatus
  reason: string
  activeRestrictions: string[]  // extra restrictions active in current state
}

export interface NextBuildSlice {
  label: string
  pages: ArchitecturePageType[]
  blockersToClear: string[]
  rationale: string
}

export interface SiteArchitectureOutput {
  recommendedPages: EvaluatedPage[]
  conditionalPages: EvaluatedPage[]
  blockedPages: EvaluatedPage[]
  internalOnlyRecords: EvaluatedPage[]
  risks: ArchitectureRisk[]
  nextBuildSlice: NextBuildSlice
}
