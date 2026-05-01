/**
 * DAP Stage Gate Registry
 *
 * Operator-updated source of truth for DAP build progression.
 * Replaces static simulation as the authoritative pipeline record.
 *
 * RULE: No DAP implementation phase may begin without a CBCC-issued directive
 * for that stage. Each phase stops at evidence submission. Owner must approve
 * before the next directive is issued.
 *
 * Approval is deliberate — update approvedByOwner, approvedAt, status, and
 * nextStageUnlocked in this file, then commit. Every approval is auditable in git.
 */

import {
  DAP_BUSINESS_DEFINITION,
  type StageArtifact,
} from './dapBusinessDefinition'
import { DAP_TRUTH_SCHEMA_ARTIFACT } from './dapTruthSchemaArtifact'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DapStageStatus =
  | 'not_started'
  | 'ready_for_directive'
  | 'directive_issued'
  | 'in_progress'
  | 'evidence_submitted'
  | 'validation_passed'
  | 'awaiting_owner_approval'
  | 'approved'
  | 'revision_requested'
  | 'blocked'

export interface DapStageEvidence {
  readonly branch?: string
  readonly commit?: string
  readonly tests?: string
  readonly previewUrl?: string
  readonly filesChanged?: readonly string[]
  readonly screenshots?: readonly string[]
  readonly unresolvedIssues?: readonly string[]
}

export interface DapStageGate {
  readonly stageId: string
  readonly stageNumber: number          // 1–7, defines required ordering
  readonly title: string
  readonly description: string
  readonly whyItMatters: string
  readonly filesExpected: readonly string[]
  readonly status: DapStageStatus
  readonly directiveIssued: boolean
  readonly directive: string            // exact Claude directive for this stage
  readonly approvedByOwner: boolean
  readonly approvedAt: string | null    // ISO date string
  readonly nextStageUnlocked: boolean   // true only after approvedByOwner: true
  readonly requirements: readonly string[]
  readonly implementationEvidence: DapStageEvidence
  readonly requiredApprovals: readonly string[]
  readonly blockers: readonly string[]  // unresolved blockers preventing approval
  readonly ledgerPhaseId?: string       // cross-reference to dapBuildLedger entry
  readonly artifact?: StageArtifact    // reviewable artifact — required for approved/awaiting stages
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DAP_STAGE_GATES: readonly DapStageGate[] = [

  {
    stageId: 'stage-01-business-definition',
    stageNumber: 1,
    title: 'Business Definition',
    description:
      'Establish what DAP is, who the customer is, what the conversion goal is, and what claims are allowed or forbidden. Register the business in the CBCC portfolio.',
    whyItMatters:
      'Every downstream stage inherits the business definition. Without a locked definition, page copy, truth schema, and positioning all drift independently.',
    filesExpected: [
      'app/businesses/dental-advantage-plan/',
      'lib/cb-control-center/cbBusinessPortfolioData.ts',
    ],
    status: 'approved',
    directiveIssued: true,
    directive:
      'Stage 1 is complete and approved. Business definition, portfolio registration, and CBCC workspace shell delivered in Phase 18E. No new directive required.',
    approvedByOwner: true,
    approvedAt: '2026-04-30',
    nextStageUnlocked: true,
    requirements: [
      'Business name, offer, and customer defined',
      'Conversion goal documented',
      'Allowed and forbidden claims documented',
      'Business registered in CBCC portfolio',
      'MockModeBanner applied to all business-facing pages',
    ],
    implementationEvidence: {
      branch: 'main',
      commit: '403bcd6',
      tests: '26 passing (cbControlCenterWorkspace)',
      filesChanged: [
        'app/businesses/dental-advantage-plan/',
        'components/cb-control-center/MockModeBanner.tsx',
      ],
    },
    requiredApprovals: [
      'Business definition accepted',
      'Claims boundary accepted',
      'CBCC workspace shell accepted',
    ],
    blockers: [],
    ledgerPhaseId: 'phase-18e-cbcc-workspace-shell',
    artifact: DAP_BUSINESS_DEFINITION,
  },

  {
    stageId: 'stage-02-truth-schema',
    stageNumber: 2,
    title: 'Truth Schema',
    description:
      'Lock what DAP is, what DAP is not, all 7 truth rules, forbidden claims, required disclaimers, and compliance boundaries. No downstream page may contradict this schema.',
    whyItMatters:
      'The truth schema is the single authority that prevents compliance failures across every page type. If it is not owner-approved, all generated content lacks an authoritative source of truth.',
    filesExpected: [
      'lib/cb-control-center/cbSeoAeoLlmFormatting.ts',
      'lib/cb-control-center/cbSeoAeoPageGeneration.ts',
    ],
    status: 'awaiting_owner_approval',
    directiveIssued: true,
    directive: `# Stage 2 — Truth Schema Review

Review the DAP truth schema contracts in CBCC. Confirm all 7 truth rules, forbidden claims,
and required disclaimers are accurate and complete.

Files to review:
- lib/cb-control-center/cbSeoAeoLlmFormatting.ts (74 tests passing)
- lib/cb-control-center/cbSeoAeoPageGeneration.ts (243 tests passing)

Evidence submitted: 74 + 243 tests passing. No new implementation required.

Stop condition: confirm review complete, then update CBCC stage gate:
  status: 'approved'
  approvedByOwner: true
  approvedAt: '<today>'
  nextStageUnlocked: true

Do not begin Stage 3 until this approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'All 7 DAP truth rules defined and locked',
      'Forbidden claims documented',
      'Required disclaimers documented',
      'Compliance boundaries documented',
      'LLM formatting standard defined (Phase 18B)',
      'Page generation contracts defined (Phase 18C)',
      'Test suite passing',
    ],
    implementationEvidence: {
      branch: 'main',
      tests: '74 passing (cbSeoAeoLlmFormatting) + 243 passing (cbSeoAeoPageGeneration)',
      filesChanged: [
        'lib/cb-control-center/cbSeoAeoLlmFormatting.ts',
        'lib/cb-control-center/cbSeoAeoPageGeneration.ts',
      ],
    },
    requiredApprovals: [
      'All 7 truth rules accepted',
      'Forbidden claims list accepted',
      'Required disclaimers accepted',
      'Test coverage accepted',
    ],
    blockers: [],
    ledgerPhaseId: 'phase-18c-page-generation-contract',
    artifact: DAP_TRUTH_SCHEMA_ARTIFACT,
  },

  {
    stageId: 'stage-03-brandscript-positioning',
    stageNumber: 3,
    title: 'BrandScript / Positioning',
    description:
      'Define the customer problem, guide positioning, the plan, CTA strategy, stakes, success outcome, and tone and voice for DAP. This governs every patient-facing message.',
    whyItMatters:
      'Without a locked BrandScript, page copy defaults to generic dental marketing. BrandScript ensures DAP speaks to the patient problem first, guides them to action, and avoids the "information dump" pattern.',
    filesExpected: [
      'lib/cb-control-center/dapBrandScript.ts',
      'lib/cb-control-center/dapBrandScript.test.ts',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 3 — BrandScript / Positioning

Build the DAP BrandScript contract in CBCC.

Define:
- The character (patient without dental insurance)
- The problem (external: high dental costs, no insurance; internal: anxiety about cost; philosophical: patients deserve to know what they'll pay)
- The guide (DAP — shows the way, doesn't do the dental work)
- The plan (search → compare → contact practice)
- The call to action (find a participating practice)
- The stakes (avoid skipping care due to cost; success = affordable preventive care)
- Tone: clear, patient-first, not salesy, not clinical

Create lib/cb-control-center/dapBrandScript.ts with typed contracts.
Create lib/cb-control-center/dapBrandScript.test.ts with tests.

Stop condition: evidence submitted to CBCC (branch, commit, test count).
Do not begin Stage 4 until owner approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'Character defined',
      'Problem defined (external, internal, philosophical)',
      'Guide positioning defined',
      'Plan defined (3 steps)',
      'CTA defined',
      'Stakes defined',
      'Tone and voice defined',
      'Test suite passing',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'Character and problem framing accepted',
      'Guide positioning accepted',
      'CTA strategy accepted',
      'Tone and voice accepted',
    ],
    blockers: [
      'Stage 2 (Truth Schema) must be owner-approved before Stage 3 directive is issued',
    ],
  },

  {
    stageId: 'stage-04-page-strategy',
    stageNumber: 4,
    title: 'Page Strategy',
    description:
      'Define the full page type strategy: homepage sections, SEO/AEO role, conversion role, FAQ strategy, comparison table strategy, and local/practice-page strategy for all 8 DAP page types.',
    whyItMatters:
      'Page strategy governs what sections appear on each page type, what claims are allowed, and what the conversion path is. Without it, implementation produces pages that contradict the truth schema or underserve the patient.',
    filesExpected: [
      'lib/cb-control-center/cbSeoAeoPageGeneration.ts',
      'lib/cb-control-center/dapPageBriefBuilder.ts',
    ],
    status: 'awaiting_owner_approval',
    directiveIssued: true,
    directive: `# Stage 4 — Page Strategy Review

Review the DAP page strategy contracts in CBCC. Confirm all 8 page types, required sections,
forbidden patterns, and brief builder output are accurate.

Files to review:
- lib/cb-control-center/cbSeoAeoPageGeneration.ts (page contracts for all 8 types)
- lib/cb-control-center/dapPageBriefBuilder.ts (brief builder for each type)

Evidence submitted: 243 + 277 tests passing. No new implementation required.

Stop condition: confirm review complete, then update CBCC stage gate:
  status: 'approved'
  approvedByOwner: true
  approvedAt: '<today>'
  nextStageUnlocked: true

Do not begin Stage 5 implementation until this approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'All 8 page types defined with required sections',
      'Forbidden claims per page type locked',
      'Homepage wireframe order defined',
      'CTA rules per page type defined',
      'Generation prompt seeds defined',
      'Brief builder producing correct output for all 8 types',
      'Test suite passing',
    ],
    implementationEvidence: {
      branch: 'main',
      tests: '243 passing (cbSeoAeoPageGeneration) + 277 passing (dapPageBriefBuilder)',
      filesChanged: [
        'lib/cb-control-center/cbSeoAeoPageGeneration.ts',
        'lib/cb-control-center/dapPageBriefBuilder.ts',
        'app/preview/dap/page-briefs/page.tsx',
      ],
    },
    requiredApprovals: [
      'All 8 page type contracts accepted',
      'Homepage wireframe order accepted',
      'CTA strategy per page type accepted',
      'Brief builder output accepted',
    ],
    blockers: [],
    ledgerPhaseId: 'phase-18d-dap-page-brief-builder',
    artifact: {
      type: 'site_strategy',
      title: 'DAP Page Strategy',
      status: 'reviewable',
      summary:
        'Defines the full page type strategy for all 8 DAP page types: required sections, SEO/AEO role, conversion role, CTA rules, forbidden patterns, and brief builder output. Governs every patient-facing page.',
      sourceFiles: [
        'lib/cb-control-center/cbSeoAeoPageGeneration.ts',
        'lib/cb-control-center/dapPageBriefBuilder.ts',
        'app/preview/dap/page-briefs/page.tsx',
      ],
    } as StageArtifact,
  },

  {
    stageId: 'stage-05-homepage-build',
    stageNumber: 5,
    title: 'Homepage Build',
    description:
      'Implement the DAP homepage foundation on rebuild/dap-site-v2. Replace the monolithic page.tsx with 7 modular server-component sections governed by the Phase 18C/D contracts. Enforce all 7 truth rules. Add safety tests.',
    whyItMatters:
      'The homepage is the first patient-facing surface. It must open with patient problem framing, include the ZIP/search tool, and enforce the truth schema — with no forbidden claims and no prototype or admin language.',
    filesExpected: [
      'src/app/page.tsx (in dentaladvantageplan repo)',
      'src/components/homepage/ (in dentaladvantageplan repo)',
      'src/lib/homepage.test.ts (in dentaladvantageplan repo)',
    ],
    status: 'awaiting_owner_approval',
    directiveIssued: true,
    directive: `# Stage 5 — Homepage Build (Phase 19A) — EVIDENCE SUBMITTED

This stage has been implemented. Evidence submitted. Awaiting owner approval.

Branch: rebuild/dap-site-v2
Commit: a853380
Tests: 49 passing

Evidence:
- src/app/page.tsx: 22 lines (7-component composition, no inline content)
- src/components/homepage/: 7 modular section components
- src/lib/homepage.test.ts: 40 safety tests (Group 1–4)
- vitest.config.ts: resolves @/ alias, excludes e2e

Visual check passed:
- Hero opens with "No dental insurance? Start here."
- ZIP/search tool above the fold
- No /v5/ links, no admin language
- CTAs: #find-dentists + /the-plan

Stop condition: awaiting owner approval in CBCC before Stage 6 begins.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'Homepage route exists at src/app/page.tsx',
      'All 7 DAP truth rules enforced in rendered output',
      'No forbidden claims present',
      'ZIP/search tool visible above fold',
      'No /v5/ legacy routes linked from homepage',
      'No admin or CBCC language on homepage',
      'Safety test suite passing',
      'Visual acceptance check completed',
    ],
    implementationEvidence: {
      branch: 'rebuild/dap-site-v2',
      commit: 'a853380',
      tests: '49 passing (homepage suite)',
      previewUrl: '',
      filesChanged: [
        'src/app/page.tsx',
        'src/components/homepage/HomepageHero.tsx',
        'src/components/homepage/HomepageHowItWorks.tsx',
        'src/components/homepage/HomepageWhatIsIncluded.tsx',
        'src/components/homepage/HomepageComparison.tsx',
        'src/components/homepage/HomepageWhoIsThisFor.tsx',
        'src/components/homepage/HomepageFaqPreview.tsx',
        'src/components/homepage/HomepageFinalCta.tsx',
        'src/lib/homepage.test.ts',
        'vitest.config.ts',
      ],
      unresolvedIssues: [],
    },
    requiredApprovals: [
      'Visual acceptance — hero opens patient-first',
      'Truth-rule acceptance — all 7 rules present',
      'CTA acceptance — #find-dentists and /the-plan only',
      'Mobile acceptance — layout does not break on small screens',
    ],
    blockers: [],
    ledgerPhaseId: 'phase-19a-dap-homepage-foundation',
    artifact: {
      type: 'build_output',
      title: 'DAP Homepage — Phase 19A',
      status: 'reviewable',
      summary:
        'Rebuilt root homepage from a 1,132-line monolith to 7 modular server-component sections. All 7 DAP truth rules enforced. No forbidden claims present. ZIP/search tool above the fold. Visual acceptance check passed.',
      sourceFiles: [
        'src/app/page.tsx (rebuild/dap-site-v2)',
        'src/components/homepage/HomepageHero.tsx',
        'src/components/homepage/HomepageHowItWorks.tsx',
        'src/components/homepage/HomepageWhatIsIncluded.tsx',
        'src/components/homepage/HomepageComparison.tsx',
        'src/components/homepage/HomepageWhoIsThisFor.tsx',
        'src/components/homepage/HomepageFaqPreview.tsx',
        'src/components/homepage/HomepageFinalCta.tsx',
        'src/lib/homepage.test.ts',
      ],
    } as StageArtifact,
  },

  {
    stageId: 'stage-06-qa-review',
    stageNumber: 6,
    title: 'QA Review',
    description:
      'Verify truth rules, broken links, visual acceptance, mobile layout, SEO structure, CTA behavior, no forbidden claims, no stale mock data, no provider/pricing claims unless confirmed.',
    whyItMatters:
      'QA is the final validation gate before launch. It catches compliance drift, broken pages, and layout regressions that automated tests cannot fully cover.',
    filesExpected: [
      'src/app/ (all public routes in dentaladvantageplan repo)',
      'src/components/homepage/',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 6 — QA Review

QA the DAP site on rebuild/dap-site-v2 against the following checklist:

Truth rules:
- All 7 DAP truth rules present on every public page
- No page claims guaranteed savings, guaranteed coverage, or DAP is insurance
- No page claims DAP processes claims, pays providers, or collects PHI

Visual:
- Homepage visual acceptance (hero, search tool, comparison table, CTAs)
- Mobile layout — hero, comparison table, FAQ section, final CTA
- No broken links (especially no /v5/ links, no /admin/ links)

SEO:
- <title> tags on all pages
- <meta description> on all pages
- H1 present and patient-facing on homepage

CTA behavior:
- Primary CTA: #find-dentists anchor
- Secondary CTA: /the-plan link works
- No CTAs link to /v5/ routes

Safety checklist:
- No provider-specific pricing claims unless verified
- No admin or CBCC language exposed on public pages
- No stale mock data in production components

Stop condition: submit QA report to CBCC with all checks and their pass/fail status.
Do not begin Stage 7 until owner approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'All truth rules verified on every public page',
      'No forbidden claims present anywhere',
      'Mobile layout verified on at least 2 breakpoints',
      'All links functional — no broken routes',
      'SEO metadata present on all pages',
      'CTA behavior verified',
      'No stale mock data in production components',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'Truth-rule sweep accepted',
      'Visual acceptance accepted',
      'Mobile layout accepted',
      'SEO metadata accepted',
      'CTA behavior accepted',
    ],
    blockers: [
      'Stage 5 (Homepage Build) must be owner-approved before QA begins',
    ],
  },

  {
    stageId: 'stage-07-launch',
    stageNumber: 7,
    title: 'Launch',
    description:
      'Merge rebuild/dap-site-v2 to main, confirm Vercel production deployment, run post-launch verification, and mark DAP as launched in CBCC.',
    whyItMatters:
      'Launch is irreversible in the sense that real patients will see the page. Owner approval is mandatory before any merge to main, any production deploy, or any announcement.',
    filesExpected: [
      'rebuild/dap-site-v2 → main (merge in dentaladvantageplan repo)',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 7 — Launch

Prerequisites: Stage 6 (QA Review) must be approved before this directive is issued.

Steps:
1. Confirm Vercel preview URL for rebuild/dap-site-v2 is working
2. Owner reviews preview — final visual and content check
3. Merge rebuild/dap-site-v2 to main (do NOT use --force)
4. Verify Vercel production deployment completes
5. Run post-launch checks:
   - Homepage loads at production URL
   - ZIP search returns results
   - /the-plan route works
   - No /v5/ links visible
   - Disclaimer present in footer
6. Update CBCC stage gate: status: 'approved', approvedByOwner: true
7. Update CBCC ledger: add launch entry

Stop condition: evidence submitted (production URL, deployment hash, post-launch check results).
Do not self-approve. Wait for owner approval.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'Stage 6 QA Review approved',
      'Vercel preview URL confirmed working',
      'Owner final visual review complete',
      'Merge to main approved',
      'Production deployment verified',
      'Post-launch checklist complete',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'Final visual review accepted',
      'Production deployment confirmed',
      'Post-launch checklist accepted',
    ],
    blockers: [
      'Stage 6 (QA Review) must be owner-approved before launch',
    ],
  },

] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStageGateById(stageId: string): DapStageGate | undefined {
  return DAP_STAGE_GATES.find(s => s.stageId === stageId) as DapStageGate | undefined
}

export function getStageGatesByStatus(status: DapStageStatus): DapStageGate[] {
  return DAP_STAGE_GATES.filter(s => s.status === status) as DapStageGate[]
}

export function getApprovedStageGates(): DapStageGate[] {
  return DAP_STAGE_GATES.filter(s => s.approvedByOwner) as DapStageGate[]
}

export function getActiveStageGate(): DapStageGate {
  // Active = first stage (by stageNumber) that is not 'approved' and not 'not_started'
  // Falls back to first 'awaiting_owner_approval', then first not 'approved'
  const nonApproved = (DAP_STAGE_GATES as readonly DapStageGate[])
    .slice()
    .sort((a, b) => a.stageNumber - b.stageNumber)
    .find(s => s.status !== 'approved')
  return nonApproved ?? DAP_STAGE_GATES[DAP_STAGE_GATES.length - 1] as DapStageGate
}

export function getOpenBlockerCount(): number {
  return DAP_STAGE_GATES.reduce((acc, s) => acc + s.blockers.length, 0)
}
