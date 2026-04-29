import type {
  BusinessRecord,
  PipelineStage,
  PipelineBlocker,
  CrawlOutput,
  CurrentCommand,
  BusinessTruthRecord,
  StrategyRecord,
  PagePlanItem,
  ActivityEvent,
  InitialInput,
  TruthSection,
  EnrichedBlocker,
} from './types'

// Schema must be defined first — MOCK_BUSINESS.overallReadiness is derived from it.

export const MOCK_BUSINESS_TRUTH_SCHEMA: TruthSection[] = [
  {
    id: 'business-identity',
    name: 'Business Identity',
    fields: [
      { id: 'bi-name', label: 'Business Name', value: 'Dental Advantage Plan', status: 'confirmed' },
      { id: 'bi-category', label: 'Category', value: 'Dental membership plan', status: 'confirmed' },
      { id: 'bi-website', label: 'Source Website', value: 'https://dentaladvantageplan.vercel.app', status: 'confirmed' },
    ],
  },
  {
    id: 'audience',
    name: 'Audience',
    fields: [
      { id: 'au-primary', label: 'Primary Customer', value: 'Patients without dental insurance who need affordable dental care', status: 'confirmed' },
      { id: 'au-problem', label: 'Primary Problem', value: 'Patients delay care or pay full price out of pocket because they do not have insurance', status: 'confirmed' },
      { id: 'au-segment', label: 'Secondary Segment', value: null, status: 'needs_confirmation' },
      { id: 'au-geography', label: 'Geographic Scope', value: null, status: 'needs_confirmation' },
    ],
  },
  {
    id: 'core-offer',
    name: 'Core Offer',
    fields: [
      { id: 'co-offer', label: 'Offer', value: 'A dental membership plan that gives members access to reduced dental pricing at participating practices', status: 'confirmed' },
      { id: 'co-decision', label: 'Decision Question', value: 'Is Dental Advantage Plan available for my dental care need — and if not, should I request it near me or at my preferred dentist?', status: 'confirmed' },
      { id: 'co-activation', label: 'Activation Path', value: null, status: 'needs_confirmation' },
      { id: 'co-exclusions', label: 'Plan Exclusions / Limitations', value: null, status: 'needs_confirmation' },
    ],
  },
  {
    id: 'pricing-savings',
    name: 'Pricing & Savings Logic',
    fields: [
      { id: 'ps-individual', label: 'Adult Annual Premium', value: '$450/year — confirmed, Irene Olaes DDS (source: plan PDF; brochure confirmation pending)', status: 'confirmed' },
      { id: 'ps-family', label: 'Child Annual Premium', value: '$350/year per child age 17 and under — confirmed, Irene Olaes DDS (per member, not a family bundle)', status: 'confirmed' },
      { id: 'ps-savings-example', label: 'Patient-Facing Savings Example', value: null, status: 'needs_confirmation' },
      { id: 'ps-discount-rate', label: 'Discount Rate / Special Pricing', value: '25% off non-covered procedures; ClearCorrect $1,000 off; Bleaching $100 off — from plan PDF, full brochure confirmation pending', status: 'needs_confirmation' },
      { id: 'ps-billing-model', label: 'Billing Model / Renewal Terms', value: 'Annual per member — renewal and cancellation terms not yet confirmed', status: 'needs_confirmation' },
    ],
  },
  {
    id: 'practice-availability',
    name: 'Practice Availability',
    fields: [
      { id: 'pa-count', label: 'Number of Participating Practices', value: null, status: 'needs_confirmation' },
      { id: 'pa-locations', label: 'Practice Locations / Geographic Coverage', value: null, status: 'needs_confirmation' },
      { id: 'pa-source', label: 'Practice Data Source of Truth', value: null, status: 'needs_confirmation' },
    ],
  },
  {
    id: 'trust-proof',
    name: 'Trust & Proof',
    fields: [
      { id: 'tp-no-claims', label: 'No Insurance Claims Required', value: 'Confirmed — no claims process', status: 'confirmed' },
      { id: 'tp-no-waiting', label: 'No Waiting Period', value: 'Confirmed — use plan immediately', status: 'confirmed' },
      { id: 'tp-testimonials', label: 'Patient Testimonials', value: null, status: 'missing' },
      { id: 'tp-savings-proof', label: 'Verified Savings Examples', value: null, status: 'needs_confirmation' },
    ],
  },
  {
    id: 'decision-logic',
    name: 'Decision Logic',
    fields: [
      { id: 'dl-trigger', label: 'Primary Purchase Trigger', value: 'Upcoming dental visit without insurance coverage', status: 'confirmed' },
      { id: 'dl-objection', label: 'Primary Objection', value: null, status: 'needs_confirmation' },
      { id: 'dl-urgency', label: 'Urgency Signal', value: null, status: 'needs_confirmation' },
      { id: 'dl-comparison', label: 'Key Comparison (Plan vs. Insurance)', value: null, status: 'needs_confirmation' },
    ],
  },
]

// 27 fields: 12 confirmed, 14 needs_confirmation, 1 missing, 0 blocked → 44% readiness
function schemaReadiness(schema: TruthSection[]): number {
  const total = schema.reduce((n, s) => n + s.fields.length, 0)
  const confirmed = schema.reduce((n, s) => n + s.fields.filter(f => f.status === 'confirmed').length, 0)
  return total > 0 ? Math.round((confirmed / total) * 100) : 0
}

export const MOCK_BUSINESS: BusinessRecord = {
  id: 'dap',
  name: 'Dental Advantage Plan',
  websiteUrl: 'https://dentaladvantageplan.vercel.app',
  category: 'Dental Membership Plan',
  pipelineStatus: 'In Progress',
  currentStage: 'Business Truth JSON',
  overallReadiness: schemaReadiness(MOCK_BUSINESS_TRUTH_SCHEMA),
  primaryDecision:
    'Is Dental Advantage Plan available for my dental care need — and if not, should I request it near me or at my preferred dentist?',
}

export const MOCK_CURRENT_COMMAND: CurrentCommand = {
  stage: 'Business Truth JSON',
  status: 'blocked',
  primaryBlocker: 'Plan terms and network availability must be confirmed before decision pages or patient-facing copy can be finalized.',
  whyItMatters:
    'Pricing is partially confirmed from the Irene Olaes plan PDF, but the full brochure, exclusions, activation timing, and renewal terms are unconfirmed. Network availability is confirmed for only one practice — the system must not imply broader coverage.',
  wrongNextMove: 'Do not generate Core 30 pages, claim DAP is broadly available, or imply coverage beyond confirmed participating practices.',
  correctNextAction:
    'Confirm the current plan brochure with Irene Olaes DDS. Establish the full participating practice list. Define the unavailable-area user path (request/waitlist flow).',
  stageLocked: false,
}

export const MOCK_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'site-crawl',
    name: 'Site Crawl',
    status: 'complete',
    summary: 'Raw site content captured from homepage, guide, pricing, and FAQ pages.',
    blockers: [],
    artifacts: ['raw_crawl.json', 'page_inventory.json', 'extracted_copy.md'],
    artifactCount: 3,
    primaryAction: 'Review crawl',
    lastUpdated: 'Today 9:12 AM',
  },
  {
    id: 'business-truth-json',
    name: 'Business Truth JSON',
    status: 'blocked',
    summary: 'Core facts extracted, but pricing needs confirmation before this record can be finalized.',
    blockers: ['Pricing not confirmed', 'Offer terms need validation'],
    artifacts: ['business_truth_draft.json'],
    artifactCount: 1,
    primaryAction: 'Validate truth',
    lastUpdated: 'Today 9:18 AM',
  },
  {
    id: 'storybrand-diagnosis',
    name: 'StoryBrand Diagnosis',
    status: 'not_started',
    locked: true,
    summary: 'Translate business truth into decision strategy and StoryBrand positioning.',
    blockers: ['Business Truth JSON must be finalized first'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Build diagnosis',
  },
  {
    id: 'ai-search-strategy',
    name: 'AI Search Strategy',
    status: 'not_started',
    locked: true,
    summary: 'Develop AI-search-ready query map, entity gap analysis, and search strategy.',
    blockers: ['StoryBrand Diagnosis required'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Build strategy',
  },
  {
    id: 'core-30-pages',
    name: 'Core 30 Pages',
    status: 'not_started',
    locked: true,
    summary: 'Prepare AI-search-ready Core 30 page inputs for CBSEOAEO.',
    blockers: ['Business Truth JSON and strategy required'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Prepare Core 30',
  },
  {
    id: 'qa-approval',
    name: 'QA / Approval',
    status: 'not_started',
    locked: true,
    summary: 'Review and approve all generated assets before publishing.',
    blockers: ['No approved pages yet'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Start QA',
  },
  {
    id: 'publish-monitor',
    name: 'Publish / Monitor',
    status: 'not_started',
    locked: true,
    summary: 'Export or publish approved assets and begin monitoring.',
    blockers: ['No approved pages'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Publish assets',
  },
]

export const MOCK_CRAWL_OUTPUT: CrawlOutput = {
  crawlRunId: 'crawl_dap_001',
  status: 'complete',
  pagesFound: [
    {
      title: 'Dental Advantage Plan Homepage',
      url: '/',
      signals: ['hero', 'CTA', 'membership language', 'no insurance language'],
    },
    {
      title: 'Guide',
      url: '/guide',
      signals: ['education', 'comparison', 'patient questions'],
    },
    {
      title: 'FAQ',
      url: '/faq',
      signals: ['objections', 'plan explanation', 'usage details'],
    },
  ],
  extractedSignals: {
    headlines: 4,
    ctas: 6,
    pricingMentions: 3,
    trustSignals: 2,
    faqs: 8,
  },
}

export const MOCK_BUSINESS_TRUTH: BusinessTruthRecord = {
  business_name: 'Dental Advantage Plan',
  category: 'Dental membership plan',
  primary_customer: 'Patients without dental insurance who need affordable dental care',
  primary_problem: 'Patients delay care or pay full price out of pocket because they do not have insurance',
  offer: 'A dental membership plan that gives members access to reduced dental pricing at participating practices',
  decision_question:
    'Is Dental Advantage Plan available for my dental care need — and if not, should I request it near me or at my preferred dentist?',
  pricing_status: 'Needs confirmation',
  trust_signals: [
    'No insurance claims',
    'No waiting periods',
    'Use at participating dental practices',
  ],
  known_gaps: [
    'Exact plan pricing is not confirmed',
    'Participating practice list needs validation',
    'Savings examples need source confirmation',
  ],
}

export const MOCK_BLOCKERS: PipelineBlocker[] = [
  {
    id: 'b-001',
    severity: 'high',
    stage: 'Business Truth JSON',
    blocker: 'Exact plan pricing is not confirmed',
    whyItMatters:
      'Pricing is required before savings claims and decision pages can be generated safely.',
    nextAction: 'Confirm whether pricing mentions are actual membership prices or examples.',
  },
  {
    id: 'b-002',
    severity: 'medium',
    stage: 'Business Truth JSON',
    blocker: 'Participating dentist data needs validation',
    whyItMatters: 'The decision engine depends on real dentist availability and location signals.',
    nextAction: 'Review current practice records and confirm source of truth.',
  },
  {
    id: 'b-003',
    severity: 'medium',
    stage: 'StoryBrand Diagnosis',
    blocker: 'Decision question has not been locked inside CB Control Center',
    whyItMatters: 'The homepage, Core 30, and decision pages need a shared decision target.',
    nextAction: 'Confirm the primary decision question.',
  },
]

export const MOCK_STRATEGY: StrategyRecord = {
  storybrandStatus: 'Not Started',
  decisionStatus: 'Draft',
  currentDecisionQuestion:
    'Is Dental Advantage Plan available for my dental care need — and if not, should I request it near me or at my preferred dentist?',
  positioningAngle: 'No insurance? Start here.',
  homepageGoal:
    'Help patients decide whether joining the plan now is better than paying full price at their next visit.',
  nextStrategyAction: 'Validate Business Truth JSON before drafting final StoryBrand diagnosis.',
}

export const MOCK_PAGES: PagePlanItem[] = [
  { title: 'Dental membership plan vs insurance', status: 'Not Ready', reason: 'Business Truth JSON not validated' },
  { title: 'Dentist without insurance near me', status: 'Not Ready', reason: 'Business Truth JSON not validated' },
  { title: 'Dental savings plan near me', status: 'Not Ready', reason: 'Business Truth JSON not validated' },
  { title: 'Affordable dental care without insurance', status: 'Not Ready', reason: 'Business Truth JSON not validated' },
  { title: 'How dental membership plans work', status: 'Not Ready', reason: 'Business Truth JSON not validated' },
]

export const MOCK_INITIAL_INPUT: InitialInput = {
  businessName: 'Dental Advantage Plan',
  sourceWebsite: 'https://dentaladvantageplan.vercel.app',
  businessType: 'Dental Membership Plan',
  pipelineGoal: 'Create an AI-search-ready business truth record and Core 30 page system.',
  seedCustomerDecision:
    'Should I join this plan now so my next dental visit costs less instead of paying full price out of pocket?',
  inputStatus: 'accepted',
}

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { timestamp: 'Today 9:12 AM', description: 'Site crawl completed for Dental Advantage Plan' },
  { timestamp: 'Today 9:15 AM', description: 'Business Truth JSON draft created' },
  { timestamp: 'Today 9:18 AM', description: 'Pricing blocker detected — pipeline paused at Business Truth JSON' },
  { timestamp: 'Today 9:22 AM', description: 'Pipeline status set to Blocked' },
]

export const MOCK_ENRICHED_BLOCKERS: EnrichedBlocker[] = [
  {
    id: 'eb-001',
    title: 'Plan terms need final confirmation',
    severity: 'high',
    relatedSection: 'Pricing & Savings Logic',
    affectedFields: ['Patient-Facing Savings Example', 'Discount Rate / Special Pricing', 'Billing Model / Renewal Terms', 'Plan Exclusions / Limitations'],
    description: 'The plan PDF provides pricing for Irene Olaes DDS ($450 adult / $350 child, 25% discount). However, the full brochure, exclusion language, activation timing, and renewal/cancellation terms have not been confirmed. The system must not make final savings claims until the current practice-approved brochure is confirmed.',
    whyItMatters: 'Generating savings copy or decision pages from partial plan terms risks publishing inaccurate claims. The PDF may not reflect the current effective version. Exclusion language and activation rules materially affect the patient decision.',
    requiredEvidence: [
      'Current approved plan brochure (with effective date)',
      'Confirmation from Irene Olaes DDS that the PDF terms are still current',
      'Full exclusion and limitation language',
      'Activation timing — can patient use the plan immediately at enrollment?',
      'Renewal and cancellation terms',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm current brochure and enter confirmed terms' },
      { type: 'defer', label: 'Defer — publish with PDF-sourced terms and disclaimer pending confirmation' },
    ],
    gateCondition: 'Pricing & Savings Logic fields with confirmed or explicitly deferred status before savings copy, patient-facing examples, and decision pages can be finalized.',
    downstreamUnlockImpact: [
      'Patient-Facing Savings Example → Unlocked',
      'Plan vs. Insurance comparison copy → Unlocked',
      'Core 30 page briefs → Pricing inputs confirmed',
      'Decision pages → Final copy unblocked',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-002',
    title: 'Network availability not confirmed',
    severity: 'high',
    relatedSection: 'Practice Availability',
    affectedFields: ['Number of Participating Practices', 'Practice Locations / Geographic Coverage', 'Practice Data Source of Truth'],
    description: 'DAP is currently confirmed for exactly one participating practice — Irene Olaes DDS. The system must not imply that other San Diego dentists accept or offer the plan. The decision engine cannot route users to a confirmed provider without a validated practice list.',
    whyItMatters: 'The primary user journey depends on whether DAP is available at or near the patient\'s preferred provider. Without a confirmed practice list, routing users to unavailable coverage destroys trust and produces a dead end. Language implying broad availability ("San Diego dentists," "dentists near you") is false until the network is confirmed.',
    requiredEvidence: [
      'Full list of participating practices with acceptance status',
      'Geographic coverage — ZIP codes or cities where DAP is active',
      'Source of truth for practice data (CRM, portal, or database)',
      'Clarity on whether non-participating dentists can be solicited to join',
      'Whether all participating practices use the same plan terms ($450/$350)',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm full practice list and coverage area' },
      { type: 'defer', label: 'Defer — scope messaging to "currently available at select practices" and launch with Olaes only' },
    ],
    gateCondition: 'Practice Availability must be confirmed or explicitly scoped before location-based pages, ZIP routing logic, and any network availability claims can be generated.',
    downstreamUnlockImpact: [
      'Location pages ("near me" variants) → Unlocked',
      'ZIP search routing → Implementable',
      'Unavailable-area user path → Can be designed',
      'Network size claims → Safe to include in copy',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-003',
    title: 'Unavailable-area user path not finalized',
    severity: 'medium',
    relatedSection: 'Decision Logic',
    affectedFields: ['Primary Objection', 'Urgency Signal', 'Key Comparison (Plan vs. Insurance)'],
    description: 'When a user searches a ZIP, city, or preferred dentist where DAP is not available, the system has no confirmed honest next step. The current decision model assumes availability. Without a request/waitlist path, users in uncovered areas hit a dead end — or worse, are silently routed past a coverage gap.',
    whyItMatters: 'Sending a patient down a "join now" path when DAP is not available in their area destroys trust and produces a zero-conversion dead end. The request/waitlist path, consent language for contacting preferred dentists, and user messaging for "not yet available near you" must be finalized before launch.',
    requiredEvidence: [
      'Approved request or waitlist flow design',
      'Consent language for contacting the patient\'s preferred dentist',
      'User-facing message for "DAP not yet available near you"',
      'Practice recruitment workflow and expected timeline',
      'Follow-up expectation for patients who submit a request',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Define and confirm unavailable-area path' },
      { type: 'defer', label: 'Defer — suppress search results in uncovered areas with a "coming soon" message until path is finalized' },
    ],
    gateCondition: 'Decision Logic must include a confirmed or explicitly deferred unavailable-area path before the system is safe to use with real users outside confirmed coverage areas.',
    downstreamUnlockImpact: [
      'ZIP search results → Safe for launch in all areas',
      'Request/waitlist flow → Designed and copywritten',
      'Decision pages → Both available and unavailable branches complete',
      'StoryBrand Diagnosis → Full conditional decision logic confirmed',
    ],
    resolutionStatus: 'open',
  },
]
