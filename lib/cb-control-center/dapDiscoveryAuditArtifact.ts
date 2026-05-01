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
  status: 'not_started',
  summary:
    'Systematic audit of the existing DAP site: scrape all pages, inventory content, audit copy for compliance, audit CTAs, audit SEO/AEO signals, identify stale or broken assets, and produce a customer-facing change summary.',
  subDeliverables: [
    'Current site scrape — full page inventory with URLs and response codes',
    'Pages inventory — list of all public routes with word count and purpose',
    'Copy audit — identify copy that contradicts truth rules or uses forbidden claims',
    'CTA audit — map all calls-to-action and verify against allowed CTA list',
    'SEO/AEO audit — title tags, meta descriptions, H1s, schema markup, answer boxes',
    'Design audit — visual consistency, layout issues, mobile breakpoints',
    'Stale/broken assets — broken links, outdated images, legacy v5 routes',
    'Customer-facing change summary — plain-language summary of what patients will see changed',
  ],
  sourceFiles: [],
}
