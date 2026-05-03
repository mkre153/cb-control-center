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
 *
 * CORRECTED PROCESS MODEL (retracted prior ordering 2026-04-30):
 *   1. Business Intake & Definition
 *   2. Discovery / Initial Scrape / Existing Asset Audit  ← was missing
 *   3. Truth Schema / Compliance / Claims Lock            ← was Stage 2
 *   4. Positioning / StoryBrand / Messaging               ← was Stage 3
 *   5. SEO / AEO / Core30 / Content Strategy              ← was missing
 *   6. Page Architecture / Wireframes / Content Briefs    ← was Stage 4
 *   7. Build / QA / Launch                                ← collapses old 5+6+7
 */

import type { CbccExternalToolRef } from '@/lib/cbcc/types'
import {
  DAP_BUSINESS_DEFINITION,
  type StageArtifact,
} from './dapBusinessDefinition'
import { DAP_TRUTH_SCHEMA_ARTIFACT } from './dapTruthSchemaArtifact'
import { DAP_DISCOVERY_AUDIT_PLACEHOLDER } from './dapDiscoveryAuditArtifact'

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
  readonly slug: string                 // URL slug for the stage detail page
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
  readonly externalTool?: CbccExternalToolRef
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DAP_STAGE_GATES: readonly DapStageGate[] = [

  // ── Stage 1: Business Intake & Definition ─────────────────────────────────

  {
    stageId: 'stage-01-business-definition',
    stageNumber: 1,
    slug: '1-business-definition',
    title: 'Stage 1 — Business Intake / Definition',
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

  // ── Stage 2: Discovery / Initial Scrape / Existing Asset Audit ───────────

  {
    stageId: 'stage-02-discovery-audit',
    stageNumber: 2,
    slug: '2-discovery-audit',
    title: 'Stage 2 — Discovery / Scrape / Existing Asset Audit',
    description:
      'Systematically audit the existing DAP site: scrape all pages, inventory content, audit copy for compliance, audit CTAs, audit SEO/AEO signals, identify stale or broken assets, and produce a customer-facing change summary.',
    whyItMatters:
      'Without knowing what exists, redesign is speculation. Discovery answers: what is the current site saying? Where does it contradict truth rules? What CTAs are wrong? What content survives into the rebuild? This is the stage most commonly skipped and most commonly regretted.',
    filesExpected: [
      'lib/cb-control-center/dapDiscoveryAudit.ts',
      'lib/cb-control-center/dapDiscoveryAudit.test.ts',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 2 — Discovery / Initial Scrape / Existing Asset Audit

Conduct a full audit of the existing DAP site. Do not begin any rebuild work until this stage is approved.

Sub-deliverables (all required):
1. Current site scrape — crawl all public URLs, record status codes, page titles, word counts
2. Pages inventory — list of all routes with purpose classification (landing / content / utility / broken)
3. Copy audit — identify copy that contradicts the 7 truth rules or uses forbidden claims
4. CTA audit — map every call-to-action and verify against the allowed CTA list from Stage 1
5. SEO/AEO audit — check title tags, meta descriptions, H1s, structured data, and answer-box eligibility
6. Design audit — visual consistency, layout issues, mobile breakpoints, legacy prototype components
7. Stale/broken assets — broken links, 404s, outdated images, legacy /v5/ routes still linked
8. Customer-facing change summary — plain-language summary of what patients will see changed in the rebuild

Produce: lib/cb-control-center/dapDiscoveryAudit.ts with typed audit results.
Produce: lib/cb-control-center/dapDiscoveryAudit.test.ts with structural tests.

Stop condition: evidence submitted to CBCC (branch, commit, test count, audit findings).
Do not begin Stage 3 (Truth Schema) until owner approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'All public URLs crawled and status-coded',
      'Pages inventory complete with purpose classification',
      'Copy audit: every forbidden claim identified with URL',
      'CTA audit: every CTA mapped and assessed',
      'SEO/AEO audit: all metadata and schema gaps identified',
      'Design audit: all visual/layout issues catalogued',
      'Stale/broken assets: all broken links and legacy routes listed',
      'Customer-facing change summary: plain-language, owner-readable',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'Site scrape and pages inventory accepted',
      'Copy and CTA audit accepted',
      'SEO/AEO audit accepted',
      'Change summary accepted — owner understands what will change for patients',
    ],
    blockers: [],
    artifact: DAP_DISCOVERY_AUDIT_PLACEHOLDER,
  },

  // ── Stage 3: Truth Schema / Compliance / Claims Lock ──────────────────────

  {
    stageId: 'stage-03-truth-schema',
    stageNumber: 3,
    slug: '3-truth-schema',
    title: 'Stage 3 — Truth Schema / Compliance / Claims Lock',
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
    directive: `# Stage 3 — Truth Schema Review

IMPORTANT — Stage 2 Discovery Audit critical findings must be reviewed before approving Stage 3.

The live DAP site (https://dentaladvantageplan.vercel.app) contains 5 critical truth-rule
violations that Stage 3 approval must explicitly acknowledge. These claims must NOT carry
forward into the rebuilt site:

  1. "25% off everything else" (in /v5 meta description) — violates Rule 4 + Rule 5
  2. "Diagnostics 100% covered. Preventive 100% covered." (/v5 homepage) — violates Rule 4
  3. "The same coverage framework at every participating practice" (/v5) — violates Rule 4 + Rule 6
  4. "DAP practices commit to 25%" (/v5) — violates Rule 4
  5. "Most patients come out ahead" (on / and /v5) — violates Rule 5

Approving Stage 3 confirms: the 7 truth rules govern ALL downstream positioning, SEO/AEO,
page briefs, and build output. Universal discount claims, coverage-framework language,
DAP-enforced-pricing language, and guaranteed-savings claims are permanently prohibited.

Files to review:
- lib/cb-control-center/cbSeoAeoLlmFormatting.ts (74 tests passing)
- lib/cb-control-center/cbSeoAeoPageGeneration.ts (243 tests passing)
- lib/cb-control-center/dapDiscoveryAudit.ts (Stage 2 critical findings — source of truth)

Evidence submitted: 74 + 243 tests passing. No new implementation required.

To approve, update this stage gate:
  status: 'approved'
  approvedByOwner: true
  approvedAt: '<today>'
  nextStageUnlocked: true

Do not begin Stage 4 until this approval is recorded.`,
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
      'Stage 2 critical finding acknowledged: universal "25% off" and "100% covered" claims must not carry forward',
      'Stage 2 critical finding acknowledged: "same coverage framework" and "DAP practices commit to 25%" must not carry forward',
      'Stage 2 critical finding acknowledged: guaranteed savings language ("most patients come out ahead") must not carry forward',
    ],
    blockers: [],
    ledgerPhaseId: 'phase-18c-page-generation-contract',
    artifact: DAP_TRUTH_SCHEMA_ARTIFACT,
  },

  // ── Stage 4: Positioning / StoryBrand / Messaging ─────────────────────────

  {
    stageId: 'stage-04-positioning',
    stageNumber: 4,
    slug: '4-positioning',
    title: 'Stage 4 — Positioning / StoryBrand / Messaging',
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
    directive: `# Stage 4 — Positioning / StoryBrand / Messaging

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
Do not begin Stage 5 until owner approval is recorded.`,
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
      'Stage 3 (Truth Schema) must be owner-approved before Stage 4 directive is issued',
    ],
    externalTool: {
      name: 'StoryBrand Coach',
      role: 'Generates the DAP BrandScript — character, problem, guide, plan, CTA, stakes, and tone.',
      requiredInputs: ['Business definition (Stage 1 artifact)', 'Truth schema (Stage 3 artifact)'],
      expectedOutputs: ['BrandScript contract', 'Positioning lock artifact for Stage 4 approval'],
      executionMode: 'manual',
    },
  },

  // ── Stage 5: SEO / AEO / Core30 / Content Strategy ───────────────────────

  {
    stageId: 'stage-05-seo-strategy',
    stageNumber: 5,
    slug: '5-seo-strategy',
    title: 'Stage 5 — SEO / AEO / Core30 / Content Strategy',
    description:
      'Define the keyword strategy, AEO answer targets, Core30 keyword set, content calendar structure, and cluster architecture for DAP. The Core30 keyword set is the primary deliverable.',
    whyItMatters:
      'Without a defined keyword strategy, page generation is untargeted and the DAP site will not rank or answer patient questions. The Core30 set defines the 30 highest-priority keywords that govern homepage, city pages, and guide content.',
    filesExpected: [
      'lib/cb-control-center/dapSeoStrategy.ts',
      'lib/cb-control-center/dapSeoStrategy.test.ts',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 5 — SEO / AEO / Core30 / Content Strategy

Define the complete SEO and AEO strategy for DAP.

Key deliverable — Core30 keyword set:
- 30 highest-priority keywords covering: no insurance dentist, dental membership plan, affordable dental care near me, dental savings plan vs insurance, and city/state variants
- Each keyword: intent classification (informational / navigational / commercial), estimated volume tier, target page type
- AEO answer targets: questions DAP should own in answer boxes and AI overviews

Also define:
- Content cluster architecture (hub/spoke or flat)
- Pillar content topics (top 5)
- City page keyword template
- Guide content keyword map

Create lib/cb-control-center/dapSeoStrategy.ts with typed contracts.
Create lib/cb-control-center/dapSeoStrategy.test.ts with tests.

Stop condition: evidence submitted to CBCC (branch, commit, test count, Core30 list).
Do not begin Stage 6 until owner approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'Core30 keyword set defined (30 keywords, each with intent + volume tier + target page)',
      'AEO answer targets defined (at least 10 questions DAP should own)',
      'Content cluster architecture defined',
      'City page keyword template defined',
      'Pillar content topics defined (5 minimum)',
      'Test suite passing',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'Core30 keyword set accepted',
      'AEO answer targets accepted',
      'Content cluster architecture accepted',
      'City page keyword strategy accepted',
    ],
    blockers: [
      'Stage 4 (Positioning / StoryBrand) must be owner-approved before Stage 5 directive is issued',
    ],
    externalTool: {
      name: 'CBSeoAeo',
      role: 'Generates the Core30 keyword set, AEO answer targets, and content cluster architecture.',
      requiredInputs: ['BrandScript / positioning lock (Stage 4 artifact)', 'Business definition (Stage 1 artifact)'],
      expectedOutputs: ['Core30 keyword set', 'AEO answer targets', 'Content cluster architecture'],
      executionMode: 'api',
    },
    artifact: {
      type: 'seo_strategy',
      title: 'DAP SEO / AEO / Core30 Strategy',
      status: 'not_started',
      summary:
        'Core30 keyword set + AEO answer targets + content cluster architecture. Not yet generated — awaiting Stage 4 (Positioning) approval.',
      sourceFiles: [],
    } as StageArtifact,
  },

  // ── Stage 6: Page Architecture / Wireframes / Content Briefs ─────────────

  {
    stageId: 'stage-06-page-architecture',
    stageNumber: 6,
    slug: '6-page-architecture',
    title: 'Stage 6 — Page Architecture / Wireframes / Content Briefs',
    description:
      'Define the full page type strategy: required sections per page type, SEO role, conversion role, CTA rules, wireframe order, and content brief templates for all DAP page types. Supersedes the premature Phase 18C/D contracts (which were built before Discovery and Positioning).',
    whyItMatters:
      'Page architecture governs what sections appear on each page, what claims are allowed, and what the conversion path is. Built on Discovery + Truth Schema + Positioning — not before them.',
    filesExpected: [
      'lib/cb-control-center/dapPageArchitecture.ts',
      'lib/cb-control-center/dapPageArchitecture.test.ts',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 6 — Page Architecture / Wireframes / Content Briefs

Define the complete page architecture for DAP. Supersedes Phase 18C/D page strategy contracts.

Build on:
- Stage 2 (Discovery): what content currently exists and what must change
- Stage 3 (Truth Schema): what every page must and cannot say
- Stage 4 (Positioning): how every page should speak to the patient
- Stage 5 (SEO/AEO/Core30): which keywords each page type targets

Define:
- All page types (homepage, city page, practice page, guide, comparison, FAQ, blog article)
- Required sections per page type with wireframe order
- CTA rules per page type (allowed and forbidden)
- Conversion path per page type
- Content brief template per page type (Core30-governed)

Create lib/cb-control-center/dapPageArchitecture.ts with typed contracts.
Create lib/cb-control-center/dapPageArchitecture.test.ts with tests.

Stop condition: evidence submitted to CBCC (branch, commit, test count).
Do not begin Stage 7 until owner approval is recorded.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'All page types defined with required sections',
      'Forbidden claims per page type locked (inherits from Stage 3)',
      'Homepage wireframe order defined (inherits from Stage 4 BrandScript)',
      'CTA rules per page type defined',
      'Content brief template per page type defined (Core30-aware)',
      'Test suite passing',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'All page type contracts accepted',
      'Homepage wireframe order accepted',
      'CTA strategy per page type accepted',
      'Content brief template accepted',
    ],
    blockers: [
      'Stage 5 (SEO / AEO / Core30) must be owner-approved before Stage 6 directive is issued',
    ],
    externalTool: {
      name: 'CBDesignEngine',
      role: 'Generates page architecture wireframes and content brief templates for all DAP page types.',
      requiredInputs: ['Discovery audit (Stage 2)', 'Truth schema (Stage 3)', 'BrandScript (Stage 4)', 'Core30 strategy (Stage 5)'],
      expectedOutputs: ['Page type contracts', 'Wireframe order per page type', 'Content brief templates'],
      executionMode: 'manual',
    },
  },

  // ── Stage 7: Build / QA / Launch ──────────────────────────────────────────

  {
    stageId: 'stage-07-build-launch',
    stageNumber: 7,
    slug: '7-build-launch',
    title: 'Stage 7 — Build / QA / Launch',
    description:
      'Implement the DAP site based on the approved Page Architecture. QA against truth rules, visual acceptance, SEO structure, CTA behavior. Merge to main and verify production deployment.',
    whyItMatters:
      'Build without approved architecture, positioning, and SEO strategy produces a site that must be rebuilt. This stage only begins when all upstream stages are owner-approved.',
    filesExpected: [
      'src/app/ (all routes in dentaladvantageplan repo)',
      'src/components/ (all patient-facing components)',
      'rebuild/dap-site-v2 → main (merge after QA)',
    ],
    status: 'not_started',
    directiveIssued: false,
    directive: `# Stage 7 — Build / QA / Launch

Prerequisites: Stages 1–6 must all be owner-approved before this directive is issued.

Prior work reference:
- Phase 19A (homepage foundation on rebuild/dap-site-v2, commit a853380) was built before
  Stages 2–6 were complete. That work should be reviewed against the approved Page Architecture
  and rebuilt or extended as needed before QA and launch.

Build phase:
- Implement all page types from the Stage 6 Page Architecture
- Enforce all 7 truth rules on every page
- Use Core30 keywords from Stage 5 in page titles, H1s, and meta descriptions
- Apply BrandScript tone from Stage 4 to all copy

QA phase:
- All 7 truth rules verified on every public page
- No forbidden claims present anywhere
- Mobile layout verified on at least 2 breakpoints
- All links functional, no broken routes, no /v5/ legacy links
- SEO metadata present on all pages
- CTA behavior verified (primary and secondary)

Launch phase:
- Owner reviews Vercel preview — final visual and content check
- Merge rebuild branch to main (no --force)
- Verify Vercel production deployment completes
- Run post-launch checks and record evidence

Stop condition: evidence submitted (production URL, deployment hash, post-launch checks).
Do not self-approve. Wait for owner approval.`,
    approvedByOwner: false,
    approvedAt: null,
    nextStageUnlocked: false,
    requirements: [
      'Stages 1–6 all owner-approved before build begins',
      'All page types from Stage 6 architecture implemented',
      'All 7 DAP truth rules enforced on every page',
      'Core30 keywords from Stage 5 applied',
      'BrandScript tone from Stage 4 applied',
      'QA checklist: truth rules, visual, mobile, SEO, CTAs',
      'Production deployment verified',
      'Post-launch checklist complete',
    ],
    implementationEvidence: {},
    requiredApprovals: [
      'Build output accepted — all page types present',
      'QA checklist accepted — all checks pass',
      'Visual acceptance accepted — hero opens patient-first',
      'Production deployment confirmed',
    ],
    blockers: [
      'Stage 6 (Page Architecture) must be owner-approved before Stage 7 directive is issued',
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
  // Active = first stage (by stageNumber) that is not 'approved'
  const nonApproved = (DAP_STAGE_GATES as readonly DapStageGate[])
    .slice()
    .sort((a, b) => a.stageNumber - b.stageNumber)
    .find(s => s.status !== 'approved')
  return nonApproved ?? DAP_STAGE_GATES[DAP_STAGE_GATES.length - 1] as DapStageGate
}

export function getOpenBlockerCount(): number {
  return DAP_STAGE_GATES.reduce((acc, s) => acc + s.blockers.length, 0)
}

export function getDapStageGateBySlug(slug: string): DapStageGate | undefined {
  return DAP_STAGE_GATES.find(s => s.slug === slug) as DapStageGate | undefined
}

export function getDapStageGateByNumber(stageNumber: number): DapStageGate | undefined {
  return DAP_STAGE_GATES.find(s => s.stageNumber === stageNumber) as DapStageGate | undefined
}

export function getNextDapStageGate(current: DapStageGate): DapStageGate | undefined {
  return DAP_STAGE_GATES.find(
    s => s.stageNumber === current.stageNumber + 1
  ) as DapStageGate | undefined
}

export const DAP_STAGE_SLUGS = DAP_STAGE_GATES.map(s => s.slug)
