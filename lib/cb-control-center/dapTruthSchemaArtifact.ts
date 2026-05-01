/**
 * DAP Truth Schema Artifact — Stage 2
 *
 * Reviewable artifact for owner approval. Surfaces the 7 locked DAP truth rules,
 * forbidden claims, required disclaimers, and compliance boundaries that govern
 * every downstream page and component.
 *
 * Source: cbSeoAeoLlmFormatting.ts (74 tests) + cbSeoAeoPageGeneration.ts (243 tests)
 */

import type { StageArtifact, StageArtifactType, StageArtifactStatus } from './dapBusinessDefinition'

export interface DapTruthSchemaArtifact extends StageArtifact {
  readonly type: 'truth_schema'
  readonly truthRules: readonly string[]
  readonly forbiddenClaims: readonly string[]
  readonly requiredDisclaimers: readonly string[]
  readonly complianceBoundaries: readonly string[]
  readonly safetyFlags: readonly string[]
  readonly pageTypesGoverned: readonly string[]
}

export const DAP_TRUTH_SCHEMA_ARTIFACT: DapTruthSchemaArtifact = {
  type: 'truth_schema',
  title: 'DAP Truth Schema',
  status: 'reviewable',
  summary:
    'Locks all 7 DAP truth rules, forbidden claims, required disclaimers, and compliance boundaries. Every downstream page type inherits these — no page may override or contradict this schema.',
  truthRules: [
    'DAP is not dental insurance',
    'DAP does not process claims',
    'DAP does not collect PHI',
    'DAP does not set practice pricing',
    'DAP does not guarantee savings',
    'DAP does not guarantee universal availability',
    'DAP does not pay dental providers',
  ],
  forbiddenClaims: [
    'DAP is dental insurance',
    'DAP provides dental coverage',
    'DAP processes or pays claims',
    'Guaranteed savings',
    'Guaranteed coverage',
    'DAP is accepted everywhere / universally available',
    'DAP replaces dental insurance',
    'Patients should cancel their insurance',
    'DAP pays dentists directly',
    'Submit a claim / claim approval',
    'Insurance alternative',
  ],
  requiredDisclaimers: [
    'DAP is not dental insurance. Membership plans are offered by participating dental practices.',
    'Participating practices set their own plan details, pricing, and inclusions.',
    'DAP does not guarantee savings, clinical outcomes, or universal availability.',
    'DAP does not collect, store, or process personal health information (PHI).',
  ],
  complianceBoundaries: [
    'No page may claim DAP is insurance or performs insurance functions.',
    'No page may claim guaranteed savings or guaranteed pricing.',
    'No page may imply DAP is available at every dental practice.',
    'No page may imply DAP pays dental providers or processes claims.',
    'No page may collect or display PHI.',
    'Practice pricing and plan inclusions must be attributed to the practice, not to DAP.',
  ],
  safetyFlags: [
    'brandScriptControlsStrategy: true — BrandScript governs all positioning decisions',
    'decisionLockControlsOffer: true — no offer may be made outside the DecisionLock',
    'dapTruthRulesRequired: true — all 7 truth rules apply to every page type',
    'neilFormattingCanOverrideStrategy: false — Neil formatting controls structure only',
    'unsupportedSavingsClaimsAllowed: false',
    'insuranceReplacementClaimAllowed: false',
  ],
  pageTypesGoverned: [
    'homepage',
    'guide',
    'comparison',
    'faq',
    'city_page',
    'practice_page',
    'blog_article',
    'decision_education',
  ],
  sourceFiles: [
    'lib/cb-control-center/cbSeoAeoLlmFormatting.ts',
    'lib/cb-control-center/cbSeoAeoPageGeneration.ts',
  ],
} as const
