export const CBCC_STAGE_DEFINITIONS = Object.freeze([
  {
    number: 1,
    key: 'definition',
    title: 'Stage 1 — Business Intake / Definition',
    description:
      'Capture the canonical business definition: what the entity is, who it serves, what it commits to, and what it must never claim.',
    whyItMatters:
      'Every downstream stage — Truth Schema, Positioning, Content Strategy, Build — assumes a single source of truth about the business. Without an owner-locked definition, downstream artifacts drift and contradict each other.',
    requirements: [
      'Identity: legal name, brand name, primary URL, business model in one paragraph',
      'Audience: who is served and who is NOT served',
      'Promised outcomes: what the customer can expect from engaging the business',
      'Constraints: regulatory, geographic, legal, technical limits',
      'Forbidden claims: things the business must never assert',
    ],
    requiredApprovals: [
      'Owner has read the full business definition document',
      'Owner confirms claims and constraints reflect current reality',
      'Owner has reviewed the forbidden-claims list',
    ],
  },
  {
    number: 2,
    key: 'discovery',
    title: 'Stage 2 — Discovery / Scrape / Existing Asset Audit',
    description:
      'Audit existing public-facing assets, claims, and evidence already attached to the business: site, listings, press, social, agreements.',
    whyItMatters:
      'You cannot build a Truth Schema or correct positioning without first cataloging what is already published. Existing claims may contradict the locked business definition; those contradictions must surface before Stage 3.',
    requirements: [
      'Site crawl summary with all live pages and meta',
      'Inventory of public claims (taglines, hero copy, press, citations)',
      'Identification of contradictions vs. business definition',
      'Source list of canonical references (legal docs, agreements, customer agreements)',
    ],
    requiredApprovals: [
      'Owner has reviewed the asset audit',
      'Contradictions are flagged or resolved with explicit decisions',
    ],
  },
  {
    number: 3,
    key: 'truth-schema',
    title: 'Stage 3 — Truth Schema / Compliance / Claims Lock',
    description:
      'Lock the canonical truth schema: what claims are allowed, what is forbidden, what evidence is required, what disclaimers apply.',
    whyItMatters:
      'Truth Schema is the compliance backbone. Every page, headline, and AI-generated artifact downstream is graded against this lock. Approval here freezes the claim surface.',
    requirements: [
      'Allowed-claims list with required evidence per claim',
      'Forbidden-claims list with rationale',
      'Disclaimer copy required on regulated pages',
      'Safety flags for high-risk topics',
      'Governance rule: who can change claims after lock',
    ],
    requiredApprovals: [
      'Owner has read each allowed claim and confirmed evidence exists',
      'Owner has reviewed forbidden claims and disclaimer copy',
      'Owner accepts that subsequent stages may not introduce un-listed claims without re-approval',
    ],
  },
  {
    number: 4,
    key: 'positioning',
    title: 'Stage 4 — Positioning / StoryBrand / Messaging',
    description:
      'Define positioning, narrative, and the voice the business uses across pages — using StoryBrand framing within Truth Schema constraints.',
    whyItMatters:
      'Positioning that drifts from the locked truth schema produces non-compliant copy. Locking positioning early ensures all downstream pages and content briefs share one voice and one story.',
    requirements: [
      'One-sentence positioning statement',
      'StoryBrand 7-frame brief (character, problem, guide, plan, call, success, failure)',
      'Three-tier voice description (formal / functional / promotional)',
      'Audience-specific messaging variants if applicable',
    ],
    requiredApprovals: [
      'Owner has read the positioning statement and StoryBrand frames',
      'Positioning maps to allowed claims only — no forbidden claims sneak in',
    ],
  },
  {
    number: 5,
    key: 'content-strategy',
    title: 'Stage 5 — SEO / AEO / Core30 / Content Strategy',
    description:
      'Lay down the SEO/AEO content plan: Core30 topic clusters, target queries, content priority matrix, AEO answer surfaces.',
    whyItMatters:
      'Content built without a plan duplicates pages, cannibalizes rankings, and burns budget. The Core30 plan is the contract that downstream architecture and content briefs follow.',
    requirements: [
      'Core30 topic list (30 priority clusters)',
      'Target-query map per cluster',
      'AEO answer cards per question',
      'Internal-linking blueprint',
      'Publishing cadence and ownership',
    ],
    requiredApprovals: [
      'Owner has reviewed the Core30 list and approved topic priority',
      'Topic claims map to the locked Truth Schema',
    ],
  },
  {
    number: 6,
    key: 'architecture',
    title: 'Stage 6 — Page Architecture / Wireframes / Content Briefs',
    description:
      'Translate Core30 strategy into concrete page architecture, wireframes, and per-page content briefs.',
    whyItMatters:
      'A locked architecture prevents page sprawl during build. Per-page briefs give the build team an unambiguous spec — what goes on the page, what claims it makes, what evidence it cites.',
    requirements: [
      'Sitemap (URL plan) with one entry per Core30 cluster',
      'Wireframes for major page templates',
      'Per-page content briefs: H1, H2 plan, key claim, evidence citations, internal links',
      'Schema/markup plan',
    ],
    requiredApprovals: [
      'Owner has reviewed sitemap and template wireframes',
      'Per-page briefs cite Truth-Schema-locked evidence only',
    ],
  },
  {
    number: 7,
    key: 'build-launch',
    title: 'Stage 7 — Build / QA / Launch',
    description:
      'Execute the build, run QA against Truth Schema and content briefs, launch with monitoring, and hand off to operations.',
    whyItMatters:
      'Build without compliance QA risks publishing forbidden claims. Launch without a monitoring plan risks regressions. This stage closes the loop from definition to live site.',
    requirements: [
      'Implementation per per-page briefs',
      'QA pass: claim-grade against Truth Schema, evidence links resolved, disclaimers in place',
      'Performance + accessibility audit',
      'Launch plan with rollback criteria',
      'Post-launch monitoring + ownership',
    ],
    requiredApprovals: [
      'Owner has reviewed QA report and approved final claim grade',
      'Owner has signed the launch plan and confirmed rollback criteria',
    ],
  },
] as const)

export type CbccStageDefinition = (typeof CBCC_STAGE_DEFINITIONS)[number]

export function getStageDefinitionByNumber(n: number): CbccStageDefinition | null {
  return CBCC_STAGE_DEFINITIONS.find(s => s.number === n) ?? null
}
