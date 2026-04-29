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
      { id: 'co-decision', label: 'Decision Question', value: 'Should I join this plan now so my next visit costs less instead of paying full price out of pocket?', status: 'confirmed' },
      { id: 'co-activation', label: 'Activation Path', value: null, status: 'needs_confirmation' },
      { id: 'co-exclusions', label: 'Plan Exclusions', value: null, status: 'missing' },
    ],
  },
  {
    id: 'pricing-savings',
    name: 'Pricing & Savings Logic',
    fields: [
      { id: 'ps-individual', label: 'Individual Plan Price', value: null, status: 'needs_confirmation' },
      { id: 'ps-family', label: 'Family Plan Price', value: null, status: 'needs_confirmation' },
      { id: 'ps-savings-example', label: 'Savings Example (Patient-Facing)', value: null, status: 'needs_confirmation' },
      { id: 'ps-discount-rate', label: 'Discount Rate or Range', value: null, status: 'missing' },
      { id: 'ps-billing-model', label: 'Billing Model (Monthly / Annual)', value: null, status: 'missing' },
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
      { id: 'tp-savings-proof', label: 'Verified Savings Examples', value: null, status: 'blocked' },
    ],
  },
  {
    id: 'decision-logic',
    name: 'Decision Logic',
    fields: [
      { id: 'dl-trigger', label: 'Primary Purchase Trigger', value: 'Upcoming dental visit without insurance coverage', status: 'confirmed' },
      { id: 'dl-objection', label: 'Primary Objection', value: null, status: 'needs_confirmation' },
      { id: 'dl-urgency', label: 'Urgency Signal', value: null, status: 'needs_confirmation' },
      { id: 'dl-comparison', label: 'Key Comparison (Plan vs. Insurance)', value: null, status: 'blocked' },
    ],
  },
]

// 27 fields: 10 confirmed, 11 needs_confirmation, 4 missing, 2 blocked
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
    'Should I join this plan now so my next dental visit costs less instead of paying full price out of pocket?',
}

export const MOCK_CURRENT_COMMAND: CurrentCommand = {
  stage: 'Business Truth JSON',
  status: 'blocked',
  primaryBlocker: 'Pricing model is not yet normalized into patient-facing plan logic.',
  whyItMatters:
    'Core 30 pages cannot be generated safely until pricing, savings logic, included benefits, and activation path are represented as structured truth.',
  wrongNextMove: 'Do not generate Core 30 or AI-search pages from crawl copy alone.',
  correctNextAction:
    'Normalize DAP pricing, benefits, savings logic, practice availability, and activation path into Business Truth JSON.',
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
    'Should I join this plan now so my next visit costs less instead of paying full price out of pocket?',
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
    'Should I join this plan now so my next visit costs less instead of paying full price out of pocket?',
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
    title: 'Plan pricing is not confirmed',
    severity: 'high',
    relatedSection: 'Pricing & Savings Logic',
    affectedFields: ['Individual Plan Price', 'Family Plan Price', 'Savings Example', 'Discount Rate', 'Billing Model'],
    description: 'Exact membership plan prices have not been confirmed. The crawl contains pricing language but the source values are unverified.',
    whyItMatters: 'Savings claims, decision pages, and Core 30 page copy all depend on accurate pricing. Generating pages before this is confirmed risks publishing false claims.',
    requiredEvidence: [
      'Confirmed individual plan price (e.g., $X/month or $X/year)',
      'Confirmed family plan price if applicable',
      'At least one verified patient-facing savings example',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm pricing and enter values' },
      { type: 'defer', label: 'Defer — mark as pending and continue with placeholder copy' },
    ],
    gateCondition: 'All Pricing & Savings Logic fields must reach "confirmed" status before Business Truth JSON can be finalized.',
    downstreamUnlockImpact: [
      'Business Truth JSON → Finalized',
      'StoryBrand Diagnosis → Unlocked',
      'Core 30 Pages → Unlocked',
      'Decision Pages → Savings claim copy unblocked',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-002',
    title: 'Participating practice data needs validation',
    severity: 'medium',
    relatedSection: 'Practice Availability',
    affectedFields: ['Number of Participating Practices', 'Practice Locations', 'Practice Data Source of Truth'],
    description: 'The number and locations of participating dental practices have not been validated against a confirmed source of truth.',
    whyItMatters: 'Location-based AI search pages (e.g., "dental savings plan near me") require accurate practice coverage data. Incorrect availability claims undermine trust.',
    requiredEvidence: [
      'Confirmed count of participating practices',
      'Geographic coverage area or list of locations',
      'Identified source of truth for practice data (database, spreadsheet, or API)',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm practice count and coverage area' },
      { type: 'defer', label: 'Defer — generate pages without location-specific claims' },
    ],
    gateCondition: 'Practice Availability section must be confirmed or explicitly deferred before location-based page variants can be generated.',
    downstreamUnlockImpact: [
      'Location pages → Unlocked',
      '"Near me" query variants → Unlocked',
      'Practice finder feature → Data source established',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-003',
    title: 'Primary decision question not locked',
    severity: 'medium',
    relatedSection: 'Decision Logic',
    affectedFields: ['Primary Objection', 'Urgency Signal', 'Key Comparison'],
    description: 'The decision question has a draft but the full decision logic section — objection, urgency signal, and plan vs. insurance comparison — is incomplete.',
    whyItMatters: 'The homepage hero, StoryBrand diagnosis, and all decision-layer pages derive from the locked decision question and supporting logic. A draft decision question produces inconsistent messaging.',
    requiredEvidence: [
      'Confirmed primary patient objection (e.g., "Is this worth it if I only go once a year?")',
      'Identified urgency signal (e.g., "Upcoming appointment without coverage")',
      'Confirmed key comparison angle (plan vs. insurance)',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm decision logic fields' },
      { type: 'defer', label: 'Defer — lock decision question only, mark logic fields as pending' },
    ],
    gateCondition: 'Decision question must be locked and at least one supporting logic field confirmed before StoryBrand Diagnosis can begin.',
    downstreamUnlockImpact: [
      'StoryBrand Diagnosis → Decision question locked as input',
      'Homepage hero copy → Unlocked',
      'Decision pages → Primary message confirmed',
    ],
    resolutionStatus: 'open',
  },
]
