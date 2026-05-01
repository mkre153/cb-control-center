// CBCC adapter — DAP stage artifacts.
//
// Concrete reviewable artifacts for DAP stages: Stage 1 (Business Definition),
// Stage 3 (Truth Schema), and placeholders for Stages 2 / 4–7. The engine
// does not interpret artifact payloads — it just routes them through
// `getStageArtifact` (see ./index.ts). The shapes below are DAP-specific.
//
// Truth rules captured here are the operative DAP boundary: no DAP-facing
// page may contradict the rules / forbidden claims / disclaimers below.

import type { CbccStageId } from '../../types'

// ─── Generic artifact shape ──────────────────────────────────────────────────

export type DapStageArtifactStatus =
  | 'not_started'
  | 'draft'
  | 'reviewable'
  | 'approved'
  | 'blocked'

export interface DapStageArtifactBase {
  readonly type: string
  readonly title: string
  readonly summary: string
  readonly status: DapStageArtifactStatus
  readonly sourceFiles: ReadonlyArray<string>
  readonly approvedAt?: string
  readonly approvedBy?: string
}

// ─── Stage 1 — Business Definition ───────────────────────────────────────────

export interface DapBusinessDefinitionArtifact extends DapStageArtifactBase {
  readonly type: 'business_definition'
  readonly businessName: string
  readonly parentCompany: string
  readonly marketBrand: string
  readonly businessCategory: string
  readonly whatItIs: ReadonlyArray<string>
  readonly whatItIsNot: ReadonlyArray<string>
  readonly primaryCustomer: string
  readonly secondaryCustomer: string
  readonly primaryConversionGoal: string
  readonly secondaryConversionGoal: string
  readonly allowedClaims: ReadonlyArray<string>
  readonly forbiddenClaims: ReadonlyArray<string>
  readonly truthRules: ReadonlyArray<string>
}

export const DAP_BUSINESS_DEFINITION: DapBusinessDefinitionArtifact = Object.freeze({
  type: 'business_definition',
  title: 'DAP Business Definition',
  status: 'approved',
  summary:
    'Dental Advantage Plan helps people without dental insurance find participating dental practices that offer practice-managed membership plans.',
  businessName: 'Dental Advantage Plan',
  parentCompany: 'MK153 Inc.',
  marketBrand: 'Client Builder Pro',
  businessCategory: 'Dental membership plan registry and discovery platform',
  whatItIs: [
    'A registry and discovery platform for dental membership plans.',
    'A patient-facing way to find participating dental practices.',
    'A practice-facing system for listing and managing membership plan availability.',
    'A Client Builder Pro business operated under MK153 Inc.',
  ],
  whatItIsNot: [
    'DAP is not dental insurance.',
    'DAP is not a payment processor.',
    'DAP is not a claims processor.',
    'DAP is not a healthcare provider.',
    'DAP does not make treatment decisions.',
    'DAP does not guarantee savings, pricing, acceptance, or clinical outcomes.',
  ],
  primaryCustomer:
    'People without dental insurance looking for simpler and more affordable ways to access dental care.',
  secondaryCustomer:
    'Dental practices that offer or want to offer their own membership plans.',
  primaryConversionGoal:
    'Help patients search by location, understand available membership-plan options, and contact or enroll with a participating practice.',
  secondaryConversionGoal:
    'Help dental practices register, list their membership plan, and manage their DAP presence.',
  allowedClaims: [
    'Find participating dentists near you.',
    'Compare dental membership plan options.',
    'Plans may include preventive care and member discounts.',
    'Membership plans are set and managed by participating dental practices.',
    'DAP helps patients discover available practice membership plans.',
  ],
  forbiddenClaims: [
    'DAP is dental insurance.',
    'DAP provides dental coverage.',
    'DAP pays claims.',
    'DAP guarantees savings.',
    'DAP guarantees pricing.',
    'DAP is accepted everywhere.',
    'DAP replaces dental insurance for everyone.',
    'Patients should cancel their insurance.',
    'All patients qualify for the same discount.',
    'DAP controls clinical treatment decisions.',
  ],
  truthRules: [
    'Always describe DAP as a registry/discovery layer, not insurance.',
    'Practice plan terms, pricing, discounts, and included services are set by participating practices.',
    'Do not imply universal availability.',
    'Do not imply guaranteed savings.',
    'Do not imply DAP processes claims or pays providers.',
    'Do not collect or display PHI.',
    'Server-side systems determine member status from append-only billing events.',
  ],
  sourceFiles: ['lib/cbcc/adapters/dap/dapArtifacts.ts'],
  approvedAt: '2026-04-30',
  approvedBy: 'Owner',
})

// ─── Stage 3 — Truth Schema ──────────────────────────────────────────────────

export interface DapTruthSchemaArtifact extends DapStageArtifactBase {
  readonly type: 'truth_schema'
  readonly truthRules: ReadonlyArray<string>
  readonly forbiddenClaims: ReadonlyArray<string>
  readonly requiredDisclaimers: ReadonlyArray<string>
  readonly complianceBoundaries: ReadonlyArray<string>
  readonly safetyFlags: ReadonlyArray<string>
  readonly pageTypesGoverned: ReadonlyArray<string>
}

export const DAP_TRUTH_SCHEMA: DapTruthSchemaArtifact = Object.freeze({
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
    'brandScriptControlsStrategy: true',
    'decisionLockControlsOffer: true',
    'dapTruthRulesRequired: true',
    'neilFormattingCanOverrideStrategy: false',
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
  sourceFiles: ['lib/cbcc/adapters/dap/dapArtifacts.ts'],
})

// ─── Stages 2, 4–7 — placeholders ────────────────────────────────────────────
//
// These stages have no concrete artifact yet. The adapter still exposes a
// typed placeholder so callers always receive a well-shaped reply.

export interface DapStagePlaceholderArtifact extends DapStageArtifactBase {
  readonly type: 'placeholder'
  readonly stageId: CbccStageId
}

function placeholder(stageId: CbccStageId, title: string, summary: string): DapStagePlaceholderArtifact {
  return Object.freeze({
    type: 'placeholder',
    stageId,
    title,
    summary,
    status: 'not_started',
    sourceFiles: [],
  })
}

export const DAP_DISCOVERY_AUDIT_PLACEHOLDER = placeholder(
  'discovery',
  'DAP Discovery Audit',
  'Site scrape, pages inventory, copy/CTA audit, SEO/AEO audit, and customer-facing change summary. Not yet generated.',
)

export const DAP_BRANDSCRIPT_PLACEHOLDER = placeholder(
  'positioning',
  'DAP BrandScript / Positioning',
  'Character, problem, guide, plan, CTA, stakes, success, and tone. Not yet generated — awaiting Stage 3 (Truth Schema) approval.',
)

export const DAP_CONTENT_STRATEGY_PLACEHOLDER = placeholder(
  'content-strategy',
  'DAP SEO / AEO / Core30 Strategy',
  'Core30 keyword set + AEO answer targets + content cluster architecture. Not yet generated — awaiting Stage 4 (Positioning) approval.',
)

export const DAP_PAGE_ARCHITECTURE_PLACEHOLDER = placeholder(
  'architecture',
  'DAP Page Architecture',
  'Per-page-type contracts: sections, wireframes, CTA rules, conversion path, brief templates. Not yet generated.',
)

export const DAP_BUILD_LAUNCH_PLACEHOLDER = placeholder(
  'build-launch',
  'DAP Build / QA / Launch Output',
  'Implementation, QA, and post-launch checks. Not yet generated.',
)

// ─── Routing ─────────────────────────────────────────────────────────────────

export type DapStageArtifact =
  | DapBusinessDefinitionArtifact
  | DapTruthSchemaArtifact
  | DapStagePlaceholderArtifact

export function getDapStageArtifact(stageId: CbccStageId): DapStageArtifact | null {
  switch (stageId) {
    case 'definition':
      return DAP_BUSINESS_DEFINITION
    case 'discovery':
      return DAP_DISCOVERY_AUDIT_PLACEHOLDER
    case 'truth-schema':
      return DAP_TRUTH_SCHEMA
    case 'positioning':
      return DAP_BRANDSCRIPT_PLACEHOLDER
    case 'content-strategy':
      return DAP_CONTENT_STRATEGY_PLACEHOLDER
    case 'architecture':
      return DAP_PAGE_ARCHITECTURE_PLACEHOLDER
    case 'build-launch':
      return DAP_BUILD_LAUNCH_PLACEHOLDER
    default:
      return null
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────
//
// The adapter validates artifact shape at the field level. The engine never
// inspects artifact payloads — only the DAP adapter knows their structure.

export interface DapArtifactValidationResult {
  valid: boolean
  errors?: ReadonlyArray<string>
}

export function validateDapStageArtifact(
  stageId: CbccStageId,
  artifact: unknown,
): DapArtifactValidationResult {
  if (!artifact || typeof artifact !== 'object') {
    return { valid: false, errors: ['artifact must be an object'] }
  }
  const a = artifact as Partial<DapStageArtifactBase>
  const errors: string[] = []
  if (!a.type) errors.push('artifact.type is required')
  if (!a.title) errors.push('artifact.title is required')
  if (!a.status) errors.push('artifact.status is required')
  if (!a.summary) errors.push('artifact.summary is required')

  switch (stageId) {
    case 'definition':
      if (a.type !== 'business_definition') {
        errors.push(`artifact.type must be "business_definition" for stage definition, got "${a.type}"`)
      }
      break
    case 'truth-schema':
      if (a.type !== 'truth_schema') {
        errors.push(`artifact.type must be "truth_schema" for stage truth-schema, got "${a.type}"`)
      }
      break
    default:
      // Placeholder stages accept either the placeholder shape or a future
      // concrete shape — we don't pin the type yet.
      break
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}
