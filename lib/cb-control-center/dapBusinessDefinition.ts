/**
 * DAP Business Definition Artifact
 *
 * Stage 1 source-of-truth artifact. Every downstream stage inherits from this.
 * No page, component, or agent may assert a claim that contradicts this definition.
 *
 * Owner-approved as of 2026-04-30. Changes require a new approval cycle.
 */

// ─── Artifact types ───────────────────────────────────────────────────────────

export type StageArtifactType =
  | 'business_definition'
  | 'truth_schema'
  | 'brandscript'
  | 'site_strategy'
  | 'page_contract'
  | 'implementation_plan'
  | 'build_output'
  | 'acceptance_report'

export type StageArtifactStatus =
  | 'not_started'
  | 'draft'
  | 'reviewable'
  | 'approved'
  | 'blocked'

export interface StageArtifact {
  readonly type: StageArtifactType
  readonly title: string
  readonly summary: string
  readonly status: StageArtifactStatus
  readonly sourceFiles: readonly string[]
  readonly approvedAt?: string
  readonly approvedBy?: string
}

export interface DapBusinessDefinitionArtifact extends StageArtifact {
  readonly type: 'business_definition'
  readonly businessName: string
  readonly parentCompany: string
  readonly marketBrand: string
  readonly businessCategory: string
  readonly whatItIs: readonly string[]
  readonly whatItIsNot: readonly string[]
  readonly primaryCustomer: string
  readonly secondaryCustomer: string
  readonly primaryConversionGoal: string
  readonly secondaryConversionGoal: string
  readonly allowedClaims: readonly string[]
  readonly forbiddenClaims: readonly string[]
  readonly truthRules: readonly string[]
}

// ─── Artifact ─────────────────────────────────────────────────────────────────

export const DAP_BUSINESS_DEFINITION: DapBusinessDefinitionArtifact = {
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
    'People without dental insurance who are looking for simpler and more affordable ways to access dental care.',
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
  sourceFiles: [
    'app/businesses/dental-advantage-plan/',
    'lib/cb-control-center/dapBusinessDefinition.ts',
  ],
  approvedAt: '2026-04-30',
  approvedBy: 'Owner',
} as const
