/**
 * DAP Discovery Audit Artifact — Stage 2
 *
 * Placeholder artifact for the Discovery / Initial Scrape / Existing Asset Audit stage.
 * This stage must be completed before Truth Schema (Stage 3) can be approved.
 *
 * Sub-deliverables: current site scrape, pages inventory, copy audit, CTA audit,
 * SEO/AEO audit, design audit, stale/broken assets, customer-facing change summary.
 */

import type { StageArtifact } from './dapBusinessDefinition'

export interface DapDiscoveryAuditArtifact extends StageArtifact {
  readonly type: 'discovery_audit'
  readonly subDeliverables: readonly string[]
  readonly currentSiteUrl?: string
  readonly pagesInventoried?: number
  readonly customerFacingChangeSummary?: string
}

export const DAP_DISCOVERY_AUDIT_PLACEHOLDER: DapDiscoveryAuditArtifact = {
  type: 'discovery_audit',
  title: 'DAP Discovery Audit',
  status: 'reviewable',
  summary:
    'Live crawl of https://dentaladvantageplan.vercel.app (2026-05-03). 15 pages audited. 8 copy findings (4 critical truth-rule violations on /v5 homepage). No structured data on any page. Dual landing-page architecture (/ and /v5). All current URLs use legacy /v5/ prefix.',
  subDeliverables: [
    'Current site scrape — 15 pages crawled at https://dentaladvantageplan.vercel.app',
    'Pages inventory — 15 content/utility pages classified by purpose',
    'Copy audit — 8 findings: 4 critical (Rule 4 + Rule 5 violations on /v5), 4 warnings',
    'CTA audit — 10 CTAs mapped: 8 allowed, 2 review_needed (cost calculator language)',
    'SEO/AEO audit — 15 pages: 6 titles over 60 chars, 1 missing H1, 0 with structured data, 2 duplicate title pairs',
    'Design audit — 7 issues: 2 JS-rendered headings, 3 rendering artifacts, 1 missing H1, 1 dual landing page conflict',
    'Stale/broken assets — legacy /v5/ prefix on all pages; UUID-based practice URLs will break on rebuild',
    'Customer-facing change summary — included in dapDiscoveryAudit.ts',
  ],
  currentSiteUrl: 'https://dentaladvantageplan.vercel.app',
  pagesInventoried: 15,
  customerFacingChangeSummary:
    'The rebuild will sharpen focus on finding DAP-participating dentists, replace the /v5/ URL prefix with clean paths, add server-rendered search and calculator pages, and switch practice pages to readable name-based URLs.',
  sourceFiles: ['lib/cb-control-center/dapDiscoveryAudit.ts'],
}
