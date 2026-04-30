/**
 * CBSeoAeo — Page Generation Contract
 *
 * Defines the typed contract that governs how CB Control Center generates
 * SEO/AEO-ready pages for DAP. This is a contract-only module — no generation
 * logic, no AI calls, no content writing.
 *
 * Hierarchy:
 *   BrandScript (1) → DecisionLock (2) → CBDesignEngine (3)
 *   → CBSeoAeoCoreNate (4) → NeilLlmFormatting (5) → PageGenContract (uses all)
 */

import type { NeilLlmFormattingUsage, NeilLlmSectionId } from './cbSeoAeoLlmFormatting'

// ─── Safety flags ─────────────────────────────────────────────────────────────
// All values are literal — no page type may relax them.

export interface CBSeoAeoPageSafetyFlags {
  readonly brandScriptControlsStrategy: true
  readonly decisionLockControlsOffer: true
  readonly dapTruthRulesRequired: true
  readonly neilFormattingControlsStructureOnly: true
  readonly neilFormattingCanOverrideStrategy: false
  readonly genericArticleModeAllowed: false
  readonly unsupportedSavingsClaimsAllowed: false
  readonly insuranceReplacementClaimAllowed: false
}

export const LOCKED_SAFETY_FLAGS: CBSeoAeoPageSafetyFlags = {
  brandScriptControlsStrategy: true,
  decisionLockControlsOffer: true,
  dapTruthRulesRequired: true,
  neilFormattingControlsStructureOnly: true,
  neilFormattingCanOverrideStrategy: false,
  genericArticleModeAllowed: false,
  unsupportedSavingsClaimsAllowed: false,
  insuranceReplacementClaimAllowed: false,
} as const

// ─── Page types ───────────────────────────────────────────────────────────────

export type CBSeoAeoPageType =
  | 'homepage'
  | 'guide'
  | 'comparison'
  | 'faq'
  | 'city_page'
  | 'practice_page'
  | 'blog_article'
  | 'decision_education'

// ─── Contract shape ───────────────────────────────────────────────────────────

export interface CBSeoAeoPageGenerationContract {
  readonly pageType: CBSeoAeoPageType
  readonly primaryFramework: string
  readonly neilLlmFormattingUsage: NeilLlmFormattingUsage
  readonly strategicPurpose: string
  readonly conversionRole: string
  readonly requiredSections: readonly (NeilLlmSectionId | string)[]
  readonly optionalSections: readonly (NeilLlmSectionId | string)[]
  readonly forbiddenLeadPatterns: readonly string[]
  readonly forbiddenClaims: readonly string[]
  readonly requiredTruthRules: readonly string[]
  readonly safetyFlags: CBSeoAeoPageSafetyFlags
}

// ─── DAP truth rules shared across all DAP page types ─────────────────────────

export const DAP_REQUIRED_TRUTH_RULES = [
  'DAP is not dental insurance',
  'DAP does not process claims',
  'DAP does not collect PHI',
  'DAP does not set practice pricing',
  'DAP does not guarantee savings',
  'DAP does not guarantee universal availability',
  'DAP does not pay dental providers',
] as const

// ─── Contracts ────────────────────────────────────────────────────────────────

const HOMEPAGE_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'homepage',
  primaryFramework: 'BrandScript + conversion',
  neilLlmFormattingUsage: 'light',
  strategicPurpose: 'Introduce DAP as a patient-first discovery tool for membership plan practices. Establish trust, drive ZIP/provider search, and route patients to the right next step.',
  conversionRole: 'Primary CTA: start provider search. Secondary CTA: compare options or read the guide.',
  requiredSections: [
    'patient_problem_framing',
    'decision_tool_framing',
    'zip_provider_discovery_intent',
    'plan_value_comparison_intent',
    'cta_behavior',
    'footer_disclaimer',
  ],
  optionalSections: ['how_it_works_teaser', 'savings_scenarios', 'for_practices_teaser', 'final_cta'],
  forbiddenLeadPatterns: [
    'What is a dental membership plan? (generic SEO opener)',
    'Blog article format as homepage structure',
    'FAQ section as first visible content',
    'Comparison table above the fold',
    'Generic dental insurance education before brand intro',
    'Definition block before the hero',
  ],
  forbiddenClaims: [
    'guaranteed savings',
    'guaranteed coverage',
    'DAP covers procedures',
    'DAP is dental insurance',
    'universal provider availability',
    'DAP processes claims',
    'DAP pays dentists',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const GUIDE_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'guide',
  primaryFramework: 'SEO/AEO + patient education',
  neilLlmFormattingUsage: 'very_strong',
  strategicPurpose: 'Educate patients on dental care options when uninsured or underinsured. Position DAP as a discovery tool — not a replacement for insurance.',
  conversionRole: 'Mid-funnel. Converts readers exploring options into patients searching for a participating practice.',
  requiredSections: [
    'direct_answer_hero',
    'quick_summary',
    'toc',
    'question_h2s',
    'comparison_block',
    'when_it_makes_sense',
    'faq',
    'final_cta',
    'footer_disclaimer',
  ],
  optionalSections: ['definition_blocks', 'watchouts', 'entity_reinforcement'],
  forbiddenLeadPatterns: [
    'Conversion pitch before education content',
    'Savings guarantee before options comparison',
    'Insurance replacement framing',
  ],
  forbiddenClaims: [
    'guaranteed savings',
    'DAP replaces insurance',
    'DAP covers procedures',
    'DAP is better than insurance',
    'universal provider availability',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const COMPARISON_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'comparison',
  primaryFramework: 'SEO/AEO + comparison',
  neilLlmFormattingUsage: 'very_strong',
  strategicPurpose: 'Provide a clear, honest comparison of dental care payment options (DAP, insurance, cash, financing). Enable patients to make an informed choice.',
  conversionRole: 'Lower-funnel. Patients comparing options are close to a decision — route to search or guide.',
  requiredSections: [
    'direct_answer_hero',
    'comparison_table',
    'who_this_is_for',
    'who_this_is_not_for',
    'claim_safety_language',
    'when_it_makes_sense',
    'final_cta',
    'footer_disclaimer',
  ],
  optionalSections: ['quick_summary', 'faq', 'watchouts', 'entity_reinforcement'],
  forbiddenLeadPatterns: [
    'DAP declared winner before comparison',
    'Insurance dismissed before comparison',
    'Savings guarantee before options explained',
  ],
  forbiddenClaims: [
    'DAP is always cheaper than insurance',
    'DAP is always better',
    'guaranteed savings',
    'DAP covers procedures',
    'DAP is dental insurance',
    'universal provider availability',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const FAQ_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'faq',
  primaryFramework: 'CBSeoAeo + patient education',
  neilLlmFormattingUsage: 'full',
  strategicPurpose: 'Answer the most common patient questions about DAP, dental care costs, and membership plans with short, direct, LLM-extractable answers.',
  conversionRole: 'Long-tail SEO. Captures high-intent search queries and routes patients to search or guide.',
  requiredSections: [
    'direct_answer_hero',
    'quick_summary',
    'question_h2s',
    'faq',
    'final_cta',
    'footer_disclaimer',
  ],
  optionalSections: ['toc', 'definition_blocks', 'entity_reinforcement', 'watchouts'],
  forbiddenLeadPatterns: [
    'Long preamble before first answer',
    'Sales pitch before Q&A format',
    'Comparison table before direct answers',
  ],
  forbiddenClaims: [
    'guaranteed savings',
    'guaranteed coverage',
    'DAP covers procedures',
    'DAP is dental insurance',
    'unsupported financial projections',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const CITY_PAGE_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'city_page',
  primaryFramework: 'Local SEO / Core 30 / Nate SEO',
  neilLlmFormattingUsage: 'very_strong',
  strategicPurpose: 'Connect patients in a specific city or metro area with participating DAP dental practices. Combine local SEO structure with DAP discovery intent.',
  conversionRole: 'Top-of-funnel local capture. Routes patients from geo-specific search to practice discovery.',
  requiredSections: [
    'local_discovery_intent',
    'zip_location_intent',
    'participating_practice_discovery',
    'patient_first_positioning',
    'direct_answer_hero',
    'entity_reinforcement',
    'final_cta',
    'footer_disclaimer',
  ],
  optionalSections: ['comparison_block', 'faq', 'quick_summary', 'when_it_makes_sense'],
  forbiddenLeadPatterns: [
    'Claim that every dentist in city participates',
    'Guaranteed savings before practice list',
    'Emergency availability claim without verified data',
    'Specific provider pricing without data source',
  ],
  forbiddenClaims: [
    'every dentist in [city] participates',
    'guaranteed savings in [city]',
    'insurance coverage available',
    'DAP is dental insurance',
    'DAP covers procedures',
    'emergency care guaranteed',
    'specific pricing without data',
    'universal provider availability',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const PRACTICE_PAGE_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'practice_page',
  primaryFramework: 'Conversion + local SEO',
  neilLlmFormattingUsage: 'medium',
  strategicPurpose: 'Present an individual participating practice with accurate plan details, services, and location. Drive appointment intent.',
  conversionRole: 'Bottom-of-funnel. Converts practice-ready patients into appointment inquiries.',
  requiredSections: [
    'practice_identity',
    'membership_plan_details',
    'included_preventive_value',
    'location_and_contact',
    'patient_first_positioning',
    'footer_disclaimer',
  ],
  optionalSections: ['plan_price', 'general_savings_structure', 'final_cta'],
  forbiddenLeadPatterns: [
    'PHI collection above the fold',
    'Insurance claims language',
    'Unverified savings amounts as headlines',
    'Exaggerated savings promises',
  ],
  forbiddenClaims: [
    'PHI fields (SSN, DOB, medical-record)',
    'guaranteed savings',
    'DAP processes insurance claims',
    'unverified pricing',
    'exaggerated savings promises',
    'DAP is dental insurance',
    'claims-processing language',
    'insurance language',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const BLOG_ARTICLE_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'blog_article',
  primaryFramework: 'CBSeoAeo',
  neilLlmFormattingUsage: 'full',
  strategicPurpose: 'Publish authoritative, educational dental health content that builds topical authority and drives organic discovery.',
  conversionRole: 'Top-of-funnel organic. Routes readers to guide, comparison, or provider search.',
  requiredSections: [
    'direct_answer_hero',
    'quick_summary',
    'toc',
    'question_h2s',
    'entity_reinforcement',
    'final_cta',
    'footer_disclaimer',
  ],
  optionalSections: [
    'definition_blocks',
    'comparison_table',
    'when_it_makes_sense',
    'watchouts',
    'faq',
  ],
  forbiddenLeadPatterns: [
    'Unsupported health claims',
    'Medical advice framing',
    'Guaranteed outcomes language',
  ],
  forbiddenClaims: [
    'guaranteed savings',
    'DAP is dental insurance',
    'DAP covers procedures',
    'medical advice',
    'diagnostic claims',
    'universal provider availability',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

const DECISION_EDUCATION_CONTRACT: CBSeoAeoPageGenerationContract = {
  pageType: 'decision_education',
  primaryFramework: 'Decision education',
  neilLlmFormattingUsage: 'strong',
  strategicPurpose: 'Help patients understand how to evaluate their dental care options. DAP is presented as one option among several — positioned accurately and without overselling.',
  conversionRole: 'Mid-funnel. Patients who finish understand the decision landscape and can self-select the right next step.',
  requiredSections: [
    'direct_answer_hero',
    'question_h2s',
    'when_it_makes_sense',
    'comparison_block',
    'watchouts',
    'final_cta',
    'footer_disclaimer',
  ],
  optionalSections: ['quick_summary', 'toc', 'faq', 'definition_blocks'],
  forbiddenLeadPatterns: [
    'DAP declared the obvious choice before comparison',
    'Other options dismissed without fair treatment',
    'Savings guarantee before context',
  ],
  forbiddenClaims: [
    'DAP is always the best option',
    'guaranteed savings',
    'DAP replaces insurance',
    'DAP covers procedures',
    'universal provider availability',
  ],
  requiredTruthRules: [...DAP_REQUIRED_TRUTH_RULES],
  safetyFlags: LOCKED_SAFETY_FLAGS,
} as const

// ─── Contract map ─────────────────────────────────────────────────────────────

export const CB_SEOAEO_PAGE_CONTRACTS: Record<CBSeoAeoPageType, CBSeoAeoPageGenerationContract> = {
  homepage:           HOMEPAGE_CONTRACT,
  guide:              GUIDE_CONTRACT,
  comparison:         COMPARISON_CONTRACT,
  faq:                FAQ_CONTRACT,
  city_page:          CITY_PAGE_CONTRACT,
  practice_page:      PRACTICE_PAGE_CONTRACT,
  blog_article:       BLOG_ARTICLE_CONTRACT,
  decision_education: DECISION_EDUCATION_CONTRACT,
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPageContract(pageType: CBSeoAeoPageType): CBSeoAeoPageGenerationContract {
  return CB_SEOAEO_PAGE_CONTRACTS[pageType]
}

export function getAllPageTypes(): CBSeoAeoPageType[] {
  return Object.keys(CB_SEOAEO_PAGE_CONTRACTS) as CBSeoAeoPageType[]
}

export function getHomepageContract(): CBSeoAeoPageGenerationContract {
  return CB_SEOAEO_PAGE_CONTRACTS.homepage
}
