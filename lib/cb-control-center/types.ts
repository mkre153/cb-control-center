export type PipelineStatus = "complete" | "in_progress" | "blocked" | "not_started"
export type BlockerSeverity = "high" | "medium" | "low"

export interface BusinessRecord {
  id: string
  name: string
  websiteUrl: string
  category: string
  pipelineStatus: string
  currentStage: string
  overallReadiness: number
}

export interface PipelineStage {
  id: string
  name: string
  status: PipelineStatus
  summary: string
  blockers: string[]
  artifacts: string[]
  artifactCount: number
  primaryAction: string
  lastUpdated?: string
}

export interface PipelineBlocker {
  id: string
  severity: BlockerSeverity
  stage: string
  blocker: string
  whyItMatters: string
  nextAction: string
}

export interface CrawlPage {
  title: string
  url: string
  signals: string[]
}

export interface CrawlOutput {
  crawlRunId: string
  status: PipelineStatus
  pagesFound: CrawlPage[]
  extractedSignals: {
    headlines: number
    ctas: number
    pricingMentions: number
    trustSignals: number
    faqs: number
  }
}

export interface CurrentCommand {
  stage: string
  status: PipelineStatus
  primaryBlocker: string
  whyItMatters: string
  wrongNextMove: string
  correctNextAction: string
  stageLocked: boolean
}

export interface BusinessTruthRecord {
  business_name: string
  category: string
  primary_customer: string
  primary_problem: string
  offer: string
  decision_question: string
  pricing_status: string
  trust_signals: string[]
  known_gaps: string[]
}

export interface StrategyRecord {
  storybrandStatus: string
  decisionStatus: string
  currentDecisionQuestion: string
  positioningAngle: string
  homepageGoal: string
  nextStrategyAction: string
}

export interface PagePlanItem {
  title: string
  status: string
  reason: string
}

export interface ActivityEvent {
  timestamp: string
  description: string
}
