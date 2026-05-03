// Type contracts for the DAP Stage 2 Discovery Audit.
// The Stage 2 agent writes dapDiscoveryAudit.ts using these types.
// These types are locked — the agent must not redefine them.

export type DapPagePurpose =
  | 'landing'
  | 'content'
  | 'utility'
  | 'broken'
  | 'redirect'
  | 'unknown'

export interface DapPageInventoryItem {
  url: string
  path: string
  statusCode: number | null
  pageTitle: string | null
  h1: string | null
  metaDescription: string | null
  wordCount: number
  purpose: DapPagePurpose
  hasStructuredData: boolean
}

export interface DapCopyAuditFinding {
  url: string
  rule: string
  excerpt: string
  ruleNumber?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  severity: 'critical' | 'warning'
}

export interface DapCtaFinding {
  url: string
  ctaText: string
  ctaHref: string
  classification: 'allowed' | 'forbidden' | 'review_needed'
  reason?: string
}

export interface DapSeoAuditItem {
  url: string
  titleTag: string | null
  titleTagLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  h1: string | null
  hasStructuredData: boolean
  issues: ReadonlyArray<string>
}

export interface DapBrokenAsset {
  url: string
  linkedFrom: string
  statusCode: number | null
  assetType: 'broken_link' | 'legacy_route' | '404' | 'redirect_chain'
}

export interface DapDesignAuditNote {
  url: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}

export interface DapDiscoveryAuditResult {
  auditedAt: string
  targetBaseUrl: string
  totalPagesFound: number
  pagesInventory: ReadonlyArray<DapPageInventoryItem>
  copyAuditFindings: ReadonlyArray<DapCopyAuditFinding>
  ctaFindings: ReadonlyArray<DapCtaFinding>
  seoAudit: ReadonlyArray<DapSeoAuditItem>
  designAuditNotes: ReadonlyArray<DapDesignAuditNote>
  brokenAssets: ReadonlyArray<DapBrokenAsset>
  customerFacingChangeSummary: string
  agentNotes?: string
}
