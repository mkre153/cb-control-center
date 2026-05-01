// CBCC adapter — DAP canonical 7-stage definitions.
//
// One CbccStageDefinition per stage. Each entry is the static template the
// engine consumes to render a stage page; the live status of any one stage
// is read from the project's stage instances (see dapProject.ts).
//
// Stage IDs are stable, slug-like strings. They are the public identifier
// used in URLs and evidence rows. Renaming a stage id is a breaking change.

import type { CbccStageDefinition } from '../../types'

export const DAP_STAGE_DEFINITIONS: ReadonlyArray<CbccStageDefinition> = Object.freeze([
  {
    id: 'definition',
    order: 1,
    title: 'Stage 1 — Business Intake / Definition',
    description:
      'Establish what DAP is, who the customer is, what the conversion goal is, and what claims are allowed or forbidden. Register the business in the CBCC portfolio.',
    purpose:
      'Every downstream stage inherits the business definition. Without a locked definition, page copy, truth schema, and positioning all drift independently.',
    artifact: {
      title: 'Business Definition',
      description:
        'Locked record of business name, primary customer, conversion goals, and the allowed/forbidden claims set. Owner-approved deliverable.',
      required: true,
    },
    directive: `# Stage 1 — Business Intake / Definition

Lock the business definition for DAP.

Sub-deliverables (all required):
1. Business name, offer, and primary customer defined
2. Primary and secondary conversion goals documented
3. Allowed claims list documented
4. Forbidden claims list documented
5. Business registered in CBCC portfolio
6. CBCC workspace shell rendered for the project

Stop condition: business definition artifact reviewable in the stage page.
Do not begin Stage 2 until owner approval is recorded.`,
    requirements: [
      { key: 'business-named', label: 'Business name, offer, and customer defined' },
      { key: 'conversion-goal', label: 'Primary and secondary conversion goals documented' },
      { key: 'claims-set', label: 'Allowed and forbidden claims documented' },
      { key: 'portfolio-registered', label: 'Business registered in CBCC portfolio' },
    ],
    requiredApprovals: [
      'Business definition accepted',
      'Claims boundary accepted',
      'CBCC workspace shell accepted',
    ],
  },
  {
    id: 'discovery',
    order: 2,
    title: 'Stage 2 — Discovery / Scrape / Existing Asset Audit',
    description:
      'Systematically audit the existing site: scrape all pages, inventory content, audit copy for compliance, audit CTAs, audit SEO/AEO signals, identify stale or broken assets.',
    purpose:
      'Without knowing what exists, redesign is speculation. Discovery answers what the current site says, where it contradicts truth rules, and which assets survive into the rebuild.',
    artifact: {
      title: 'Discovery Audit',
      description:
        'Site scrape, pages inventory, copy audit, CTA audit, SEO/AEO audit, and customer-facing change summary.',
      required: true,
    },
    directive: `# Stage 2 — Discovery / Scrape / Existing Asset Audit

Conduct a full audit of the existing DAP site. Do not begin any rebuild work
until this stage is approved.

Sub-deliverables (all required):
1. Current site scrape — crawl all public URLs, record status codes, page titles, word counts
2. Pages inventory — list of all routes with purpose classification (landing / content / utility / broken)
3. Copy audit — identify copy that contradicts the 7 truth rules or uses forbidden claims
4. CTA audit — map every call-to-action and verify against the allowed CTA list from Stage 1
5. SEO/AEO audit — title tags, meta descriptions, H1s, structured data, answer-box eligibility
6. Design audit — visual consistency, layout issues, mobile breakpoints
7. Stale/broken assets — broken links, 404s, outdated images
8. Customer-facing change summary — plain-language summary of what users will see changed

Stop condition: evidence submitted (branch, commit, test count, audit findings).
Do not begin Stage 3 (Truth Schema) until owner approval is recorded.`,
    requirements: [
      { key: 'site-scrape', label: 'All public URLs crawled and status-coded' },
      { key: 'pages-inventory', label: 'Pages inventory complete with purpose classification' },
      { key: 'copy-audit', label: 'Copy audit identifies every forbidden claim with URL' },
      { key: 'cta-audit', label: 'CTA audit maps every call-to-action and assesses against allowed list' },
      { key: 'seo-audit', label: 'SEO/AEO audit identifies all metadata and schema gaps' },
      { key: 'change-summary', label: 'Plain-language customer-facing change summary' },
    ],
    requiredApprovals: [
      'Site scrape and pages inventory accepted',
      'Copy and CTA audit accepted',
      'SEO/AEO audit accepted',
      'Change summary accepted',
    ],
  },
  {
    id: 'truth-schema',
    order: 3,
    title: 'Stage 3 — Truth Schema / Compliance / Claims Lock',
    description:
      'Lock what DAP is, what DAP is not, all 7 truth rules, forbidden claims, required disclaimers, and compliance boundaries. No downstream page may contradict this schema.',
    purpose:
      'The truth schema is the single authority that prevents compliance failures across every page type. Without owner approval, all generated content lacks an authoritative source of truth.',
    artifact: {
      title: 'Truth Schema',
      description:
        'Locked record of truth rules, forbidden claims, required disclaimers, compliance boundaries, and safety flags governing all page generation.',
      required: true,
    },
    directive: `# Stage 3 — Truth Schema / Compliance / Claims Lock

Review and lock the DAP truth schema. Every downstream page inherits this lock.

Confirm:
- All 7 DAP truth rules are accurate and complete
- Forbidden claims list reflects every disqualifying phrase
- Required disclaimers cover the practice-pricing, savings, and PHI postures
- Compliance boundaries name what every page may and may not say
- Safety flags align with the locked positioning from Stage 4 (BrandScript)
- Page generation contract test suite is passing

Stop condition: truth schema artifact reviewable; tests green.
Do not begin Stage 4 (Positioning) until owner approval is recorded.`,
    requirements: [
      { key: 'truth-rules', label: 'All 7 truth rules defined and locked' },
      { key: 'forbidden-claims', label: 'Forbidden claims list documented' },
      { key: 'disclaimers', label: 'Required disclaimers documented' },
      { key: 'compliance-boundaries', label: 'Compliance boundaries documented' },
      { key: 'page-generation-tests', label: 'Page generation contract test suite passing' },
    ],
    requiredApprovals: [
      'All 7 truth rules accepted',
      'Forbidden claims list accepted',
      'Required disclaimers accepted',
      'Test coverage accepted',
    ],
  },
  {
    id: 'positioning',
    order: 4,
    title: 'Stage 4 — Positioning / StoryBrand / Messaging',
    description:
      'Define the customer problem, guide positioning, the plan, CTA strategy, stakes, success outcome, and tone and voice. This governs every customer-facing message.',
    purpose:
      'Without locked positioning, page copy defaults to generic marketing. A BrandScript ensures the site speaks to the customer problem first, guides them to action, and avoids the "information dump" pattern.',
    artifact: {
      title: 'BrandScript / Positioning Contract',
      description:
        'Character, problem (external/internal/philosophical), guide, plan, call to action, stakes, success outcome, and tone.',
      required: true,
    },
    directive: `# Stage 4 — Positioning / StoryBrand / Messaging

Build the DAP BrandScript contract.

Define:
- The character (the customer at the center of the story)
- The problem — external (high dental costs, no insurance), internal (anxiety
  about cost), philosophical (people deserve to know what they'll pay)
- The guide (DAP — shows the way, doesn't do the dental work)
- The plan (search → compare → contact practice)
- The call to action (find a participating practice)
- The stakes (avoid skipping care due to cost; success = affordable preventive care)
- Tone: clear, customer-first, not salesy, not clinical

Stop condition: BrandScript artifact reviewable.
Do not begin Stage 5 until owner approval is recorded.`,
    requirements: [
      { key: 'character', label: 'Character defined' },
      { key: 'problem', label: 'Problem defined (external, internal, philosophical)' },
      { key: 'guide', label: 'Guide positioning defined' },
      { key: 'plan', label: 'Plan defined (3 steps)' },
      { key: 'cta', label: 'Call-to-action defined' },
      { key: 'stakes', label: 'Stakes defined' },
      { key: 'tone', label: 'Tone and voice defined' },
    ],
    requiredApprovals: [
      'Character and problem framing accepted',
      'Guide positioning accepted',
      'CTA strategy accepted',
      'Tone and voice accepted',
    ],
  },
  {
    id: 'content-strategy',
    order: 5,
    title: 'Stage 5 — SEO / AEO / Core30 / Content Strategy',
    description:
      'Define the keyword strategy, AEO answer targets, Core30 keyword set, content calendar structure, and cluster architecture. Core30 is the primary deliverable.',
    purpose:
      'Without a defined keyword strategy, page generation is untargeted and the site will not rank or answer customer questions. Core30 defines the 30 highest-priority keywords governing homepage, city pages, and guide content.',
    artifact: {
      title: 'SEO / AEO / Core30 Strategy',
      description:
        'Core30 keyword set with intent + volume tier + target page; AEO answer targets; cluster architecture; pillar topics; city page keyword template.',
      required: true,
    },
    directive: `# Stage 5 — SEO / AEO / Core30 / Content Strategy

Define the complete SEO and AEO strategy.

Key deliverable — Core30 keyword set:
- 30 highest-priority keywords covering the project's primary topics
- Each keyword: intent classification (informational / navigational / commercial),
  estimated volume tier, target page type
- AEO answer targets: questions DAP should own in answer boxes and AI overviews

Also define:
- Content cluster architecture (hub/spoke or flat)
- Pillar content topics (top 5)
- City page keyword template
- Guide content keyword map

Stop condition: SEO/AEO artifact reviewable; Core30 list complete.
Do not begin Stage 6 until owner approval is recorded.`,
    requirements: [
      { key: 'core30', label: 'Core30 keyword set defined (30 keywords)' },
      { key: 'aeo-targets', label: 'At least 10 AEO answer targets defined' },
      { key: 'clusters', label: 'Content cluster architecture defined' },
      { key: 'city-template', label: 'City page keyword template defined' },
      { key: 'pillars', label: 'Pillar content topics defined (5 minimum)' },
    ],
    requiredApprovals: [
      'Core30 keyword set accepted',
      'AEO answer targets accepted',
      'Content cluster architecture accepted',
      'City page keyword strategy accepted',
    ],
  },
  {
    id: 'architecture',
    order: 6,
    title: 'Stage 6 — Page Architecture / Wireframes / Content Briefs',
    description:
      'Define the full page-type strategy: required sections per page type, SEO role, conversion role, CTA rules, wireframe order, and content brief templates.',
    purpose:
      'Page architecture governs what sections appear on each page, what claims are allowed, and what the conversion path is. Built on Discovery + Truth Schema + Positioning + SEO — not before them.',
    artifact: {
      title: 'Page Architecture',
      description:
        'Per-page-type contracts: sections, wireframe order, CTA rules, conversion path, content brief templates.',
      required: true,
    },
    directive: `# Stage 6 — Page Architecture / Wireframes / Content Briefs

Define the complete page architecture for the project.

Build on:
- Stage 2 (Discovery): what content currently exists and what must change
- Stage 3 (Truth Schema): what every page must and cannot say
- Stage 4 (Positioning): how every page should speak to the customer
- Stage 5 (SEO/AEO/Core30): which keywords each page type targets

Define:
- All page types (homepage, city page, practice page, guide, comparison, FAQ, blog article)
- Required sections per page type with wireframe order
- CTA rules per page type (allowed and forbidden)
- Conversion path per page type
- Content brief template per page type (Core30-governed)

Stop condition: page architecture artifact reviewable; per-page-type briefs complete.
Do not begin Stage 7 until owner approval is recorded.`,
    requirements: [
      { key: 'page-types', label: 'All page types defined with required sections' },
      { key: 'forbidden-per-type', label: 'Forbidden claims per page type locked (inherits Stage 3)' },
      { key: 'homepage-wireframe', label: 'Homepage wireframe order defined' },
      { key: 'cta-rules', label: 'CTA rules per page type defined' },
      { key: 'brief-template', label: 'Content brief template per page type defined (Core30-aware)' },
    ],
    requiredApprovals: [
      'All page-type contracts accepted',
      'Homepage wireframe order accepted',
      'CTA strategy per page type accepted',
      'Content brief template accepted',
    ],
  },
  {
    id: 'build-launch',
    order: 7,
    title: 'Stage 7 — Build / QA / Launch',
    description:
      'Implement the site from the approved Page Architecture. QA against truth rules, visual acceptance, SEO structure, CTA behavior. Merge to main and verify production deployment.',
    purpose:
      'Build without approved architecture, positioning, and SEO strategy produces a site that must be rebuilt. This stage runs only when all upstream stages are owner-approved.',
    artifact: {
      title: 'Build / QA / Launch Output',
      description:
        'Implemented page types, QA checklist results, production deployment record, post-launch checks.',
      required: true,
    },
    directive: `# Stage 7 — Build / QA / Launch

Prerequisites: Stages 1–6 must all be owner-approved before this directive
is acted on.

Build phase:
- Implement all page types from the Stage 6 Page Architecture
- Enforce all 7 truth rules on every page
- Use Core30 keywords from Stage 5 in page titles, H1s, and meta descriptions
- Apply BrandScript tone from Stage 4 to all copy

QA phase:
- All 7 truth rules verified on every public page
- No forbidden claims present anywhere
- Mobile layout verified on at least 2 breakpoints
- All links functional, no broken routes
- SEO metadata present on all pages
- CTA behavior verified (primary and secondary)

Launch phase:
- Owner reviews preview deploy — final visual and content check
- Merge to main (no --force)
- Verify production deployment completes
- Run post-launch checks and record evidence

Stop condition: production deployed; post-launch checklist complete.
Do not self-approve. Wait for owner approval.`,
    requirements: [
      { key: 'page-types-implemented', label: 'All page types from Stage 6 architecture implemented' },
      { key: 'truth-rules-enforced', label: 'All 7 truth rules enforced on every page' },
      { key: 'core30-applied', label: 'Core30 keywords applied in titles, H1s, and meta descriptions' },
      { key: 'qa-checklist', label: 'QA checklist: truth rules, visual, mobile, SEO, CTAs' },
      { key: 'production-deployed', label: 'Production deployment verified' },
      { key: 'post-launch', label: 'Post-launch checklist complete' },
    ],
    requiredApprovals: [
      'Build output accepted — all page types present',
      'QA checklist accepted — all checks pass',
      'Visual acceptance accepted',
      'Production deployment confirmed',
    ],
  },
])
