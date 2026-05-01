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
