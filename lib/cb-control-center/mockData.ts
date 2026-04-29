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
} from './types'

export const MOCK_BUSINESS: BusinessRecord = {
  id: 'dap',
  name: 'Dental Advantage Plan',
  websiteUrl: 'https://dentaladvantageplan.vercel.app',
  category: 'Dental Membership Plan',
  pipelineStatus: 'In Progress',
  currentStage: 'Business Truth JSON',
  overallReadiness: 42,
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
