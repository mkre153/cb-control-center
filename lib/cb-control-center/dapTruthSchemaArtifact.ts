/**
 * DAP Truth Schema Artifact — Stage 3
 *
 * Reviewable artifact for owner approval. Surfaces the 7 locked DAP truth rules,
 * forbidden claims, allowed claims with qualifiers, required disclaimers with
 * placement rules, claim scanner patterns, qualifier proximity rules, approved
 * vocabulary, audience safety rules, source-of-truth hierarchy, verified pricing
 * source rules, and compliance boundaries governing every downstream page type.
 *
 * Source: cbSeoAeoLlmFormatting.ts (74 tests) + cbSeoAeoPageGeneration.ts (243 tests)
 *
 * Hardening patch (Stage 3 pre-approval):
 *   - sourceOfTruthHierarchy with explicit ordering and override rules
 *   - verifiedPricingSourceRules with approved/excluded source types
 *   - qualifierProximityRules for "insurance alternative" language
 *   - qualifierProximityRules extended to distinguish allowed vs. forbidden near-misses
 */

import type { StageArtifact } from './dapBusinessDefinition'

export interface DapTruthSchemaArtifact extends StageArtifact {
  readonly type: 'truth_schema'
  readonly truthRules: readonly string[]
  readonly forbiddenClaims: readonly string[]
  readonly allowedClaims: readonly string[]
  readonly requiredDisclaimers: readonly string[]
  readonly claimScannerPatterns: readonly string[]
  readonly qualifierProximityRules: readonly string[]
  readonly approvedVocabulary: readonly string[]
  readonly audienceSafetyRules: readonly string[]
  readonly sourceOfTruthHierarchy: readonly string[]
  readonly verifiedPricingSourceRules: readonly string[]
  readonly complianceBoundaries: readonly string[]
  readonly safetyFlags: readonly string[]
  readonly pageTypesGoverned: readonly string[]
}

export const DAP_TRUTH_SCHEMA_ARTIFACT: DapTruthSchemaArtifact = {
  type: 'truth_schema',
  title: 'DAP Truth Schema',
  status: 'reviewable',
  summary:
    'Locks all 7 DAP truth rules, forbidden claims, allowed claims with qualifiers, required disclaimers with placement rules, claim scanner patterns, qualifier proximity rules, approved vocabulary, audience safety rules, source-of-truth hierarchy, verified pricing source rules, and compliance boundaries. Every downstream page type inherits these — no page may override or contradict this schema.',

  // ─── 7 Immutable Truth Rules ───────────────────────────────────────────────
  truthRules: [
    'DAP is not dental insurance',
    'DAP does not process claims',
    'DAP does not collect PHI',
    'DAP does not set practice pricing',
    'DAP does not guarantee savings',
    'DAP does not guarantee universal availability',
    'DAP does not pay dental providers',
  ],

  // ─── Source-of-Truth Hierarchy ─────────────────────────────────────────────
  sourceOfTruthHierarchy: [
    '1. Owner-approved Project Onboarding / Step 0',
    '2. Owner-approved Stage 1 Business Definition',
    '3. Owner-approved Stage 2 Discovery / Audit findings',
    '4. Stage 3 Truth Schema / Compliance / Claims Lock (this document)',
    '5. Verified practice-specific data from approved source registry (pricing only; see verifiedPricingSourceRules)',
    '6. Approved compliance language',
    '7. Stage 4 BrandScript / positioning outputs',
    '8. Stage 5 SEO / AEO / content outputs',
    '9. Stage 6 page architecture / wireframe outputs',
    '10. Existing website copy (not trusted unless verified against Stage 3 schema)',
    '11. AI-generated suggestions (never a source of truth)',
    'RULE: AI-generated suggestions may not be published without owner-approved review against this schema.',
    'RULE: Existing website copy is not trusted by default — it must be audited against Stage 3 before reuse.',
    'RULE: BrandScript, SEO outputs, page architecture, and build work may not override Stage 3 truth rules.',
    'RULE: Verified practice-specific data may inform pricing copy only if it comes from an approved source registry type.',
  ],

  // ─── Verified Pricing Source Rules ────────────────────────────────────────
  verifiedPricingSourceRules: [
    'No DAP-specific price, discount, membership fee, savings amount, or plan inclusion may be published as verified unless it comes from an approved practice-specific source.',
    'Scraped data, estimated ranges, AI-generated data, and draft copy are NOT verified pricing sources.',
    'Verified practice-specific pricing must identify: participating practice | source type | effective date or last-verified date | plan or procedure scope | approval/verification status.',
    'If verified practice-specific data is unavailable, copy must use estimate language and the "contact the practice to confirm" disclaimer.',
    'Any future pricing source registry must be governed by this Stage 3 schema and cannot override truth rules.',
    'APPROVED SOURCE TYPES: practice_plan_data_feed | signed_practice_terms | owner_approved_practice_record | verified_admin_entry',
    'EXCLUDED SOURCE TYPES: scraped_website_copy | competitor_copy | AI_generated_estimate | unverified_sales_notes | draft_marketing_copy',
  ],

  // ─── Forbidden Claims ──────────────────────────────────────────────────────
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
    'Insurance alternative (without explicit "not insurance" context)',
  ],

  // ─── Allowed Claims (with required qualifiers) ─────────────────────────────
  allowedClaims: [
    'DAP may help patients compare dental membership plan options — qualifier: "participating practices only"; evidence: business model; usage: homepage, FAQ, guide pages',
    'Membership plans may help reduce out-of-pocket dental costs — qualifier: "varies by practice, procedure, and plan terms; not guaranteed"; evidence: practice plan data; usage: hero, comparison, guide',
    'Patients can compare available options by location — qualifier: "availability varies by practice and geographic area"; usage: city pages, decision tool',
    'DAP connects patients with participating dental practices — qualifier: "practices set their own plan terms and pricing"; usage: all pages',
    'Cost estimates are provided for comparison purposes only — qualifier: "contact the practice to confirm pricing and availability"; evidence: practice-provided data; usage: comparison pages, decision tool',
    'Uninsured patients may explore whether a local membership plan is relevant before scheduling — qualifier: "plan details vary by practice"; usage: homepage, guides',
  ],

  // ─── Required Disclaimers (with placement rules) ───────────────────────────
  requiredDisclaimers: [
    '[GLOBAL] DAP is not dental insurance. Membership plans are offered by participating dental practices.',
    '[GLOBAL | BEFORE-CTA] Participating practices set their own plan details, pricing, and inclusions.',
    '[GLOBAL] DAP does not guarantee savings, clinical outcomes, or universal availability.',
    '[GLOBAL] DAP does not collect, store, or process personal health information (PHI).',
    '[PAGE-SPECIFIC | BEFORE any price or savings comparison element] Cost estimates shown are for comparison purposes only. Actual pricing and plan terms vary by participating practice. Contact the practice to confirm.',
    '[PAGE-SPECIFIC | BEFORE-CTA on practice detail and decision pages] Please contact the participating practice directly to confirm membership plan availability, pricing, and details before scheduling.',
  ],

  // ─── Claim Scanner Patterns ────────────────────────────────────────────────
  claimScannerPatterns: [
    'CRITICAL — block immediately: guaranteed, covered, coverage, insurance (without "not"), free care, no cost, save $X, always qualifies, everyone qualifies, claim approval, network coverage',
    'HIGH — rewrite before approval: "you will save", "this plan covers", "patients save X%", "save up to", "members save", "network of dentists", "accepted everywhere", "all dentists", "any dentist", "dental network", "claims processing", "insurance alternative"',
    'MEDIUM — qualifier required: "discount" (add "varies by practice"), "savings" (add "may vary; not guaranteed"), "available" (add "at participating practices"), any price or dollar amount (add "estimate only; contact practice to confirm")',
    'SAFER ALTERNATIVES: insurance → membership plan | coverage → plan details | guaranteed savings → potential savings may vary | network → participating practices | covered procedure → included in plan (varies by practice) | save $X → estimated savings may vary',
  ],

  // ─── Qualifier Proximity Rules ─────────────────────────────────────────────
  qualifierProximityRules: [
    '"Insurance alternative" is HIGH-RISK language. It may only be used in educational comparison contexts — not as a standalone hero claim, CTA, headline, navigation label, or primary positioning phrase.',
    'If "insurance alternative" is used, the phrase "not insurance" must appear in the same visible block or the same viewport. The qualifier cannot be hidden in a footer, FAQ, tooltip, legal disclaimer, or later page section.',
    'Preferred replacement for "insurance alternative": "membership-based option for patients without dental insurance."',
    'ALLOWED near-miss patterns: "No insurance? Start here." | "DAP is not dental insurance." | "Not insurance." | "For patients without dental insurance."',
    'FORBIDDEN/HIGH-RISK patterns: "No-cost dental care" | "Free care" | "Insurance replacement" | "Dental insurance alternative" (without immediate not-insurance context in same viewport) | "Insurance alternative" as primary positioning or headline',
  ],

  // ─── Approved Vocabulary ───────────────────────────────────────────────────
  approvedVocabulary: [
    'PREFERRED: dental membership plan, participating dental practice, compare estimated costs, potential savings may vary, plan details vary by practice, contact the practice to confirm, may help reduce out-of-pocket dental costs, available options vary by location and provider, not insurance, membership-based dental care, explore local options',
    'QUALIFIER REQUIRED: discount (add "varies by practice"), savings (add "may vary"), pricing (add "set by practice" or "estimate only"), available (add "at participating practices")',
    'AVOID: insurance, coverage, guaranteed savings, fixed discount, claim approval, network coverage, all dentists, every patient qualifies, DAP price, covered services',
    'ABSOLUTELY FORBIDDEN: guaranteed, covered, free care, no cost, insurance replacement, submit a claim, dental insurance alternative (without not-insurance context)',
  ],

  // ─── Audience Safety Rules ─────────────────────────────────────────────────
  audienceSafetyRules: [
    'Copy may acknowledge that dental costs are a genuine concern for uninsured patients — it may not exploit financial fear or imply that inaction causes harm or health consequences',
    'Copy may not use countdown timers, artificial scarcity, or false urgency (e.g., "Limited spots", "Act now", "Only X plans left")',
    'Copy may not shame patients for lack of dental insurance or imply poor dental health is the result of failure to act',
    'Copy may not pressure patients to cancel existing dental coverage before confirming DAP options with a participating practice',
    'Copy may not make health outcome promises or imply dental membership plans guarantee clinical results',
    'Testimonials must include a disclaimer that results and savings may vary and are not guaranteed',
    'Decision tools and cost comparators must visibly state that outputs are estimates only before the user takes any action',
  ],

  // ─── Compliance Boundaries ────────────────────────────────────────────────
  complianceBoundaries: [
    'No page may claim DAP is insurance or performs insurance functions.',
    'No page may claim guaranteed savings or guaranteed pricing.',
    'No page may imply DAP is available at every dental practice.',
    'No page may imply DAP pays dental providers or processes claims.',
    'No page may collect or display PHI.',
    'Practice pricing and plan inclusions must be attributed to the practice, not to DAP.',
  ],

  // ─── Safety Flags ─────────────────────────────────────────────────────────
  safetyFlags: [
    'brandScriptControlsStrategy: true — BrandScript governs all positioning decisions',
    'decisionLockControlsOffer: true — no offer may be made outside the DecisionLock',
    'dapTruthRulesRequired: true — all 7 truth rules apply to every page type',
    'neilFormattingCanOverrideStrategy: false — Neil formatting controls structure only',
    'unsupportedSavingsClaimsAllowed: false',
    'insuranceReplacementClaimAllowed: false',
  ],

  // ─── Downstream Page Types Governed ───────────────────────────────────────
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
