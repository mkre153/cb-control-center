// DAP Stage 2 Discovery Audit — Contract Tests
//
// These tests verify the type contracts and guard against the agent writing
// malformed output. They run in two phases:
//   Phase A — before the agent runs: status is not_started, result is null
//   Phase B — after the agent runs: status is submitted, result passes shape checks
//
// Phase B tests are skipped until the agent populates DAP_DISCOVERY_AUDIT.

import { describe, it, expect } from 'vitest'
import {
  DAP_DISCOVERY_AUDIT,
  DAP_DISCOVERY_AUDIT_STATUS,
  type DapDiscoveryAuditStatus,
} from './dapDiscoveryAudit'
import type {
  DapDiscoveryAuditResult,
  DapPageInventoryItem,
  DapCopyAuditFinding,
  DapCtaFinding,
  DapSeoAuditItem,
  DapPagePurpose,
} from './dapDiscoveryAuditTypes'

// ─── Phase A: pre-agent state ─────────────────────────────────────────────────

describe('DAP Discovery Audit — Phase A (before agent runs)', () => {
  it('audit status is not_started', () => {
    if (DAP_DISCOVERY_AUDIT_STATUS !== 'not_started') return
    expect(DAP_DISCOVERY_AUDIT_STATUS).toBe('not_started')
  })

  it('audit result is null when not started', () => {
    if (DAP_DISCOVERY_AUDIT_STATUS !== 'not_started') return
    expect(DAP_DISCOVERY_AUDIT).toBeNull()
  })
})

// ─── Phase B: post-agent shape guards ────────────────────────────────────────
//
// These run only when the agent has populated DAP_DISCOVERY_AUDIT.

describe('DAP Discovery Audit — Phase B (after agent runs)', () => {
  it.skipIf(DAP_DISCOVERY_AUDIT === null)('audit status is submitted or approved', () => {
    const validStatuses: DapDiscoveryAuditStatus[] = ['submitted', 'approved']
    expect(validStatuses).toContain(DAP_DISCOVERY_AUDIT_STATUS)
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('auditedAt is an ISO date string', () => {
    expect(DAP_DISCOVERY_AUDIT!.auditedAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('targetBaseUrl is a valid HTTPS URL', () => {
    expect(DAP_DISCOVERY_AUDIT!.targetBaseUrl).toMatch(/^https:\/\//)
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('totalPagesFound matches pagesInventory length', () => {
    const audit = DAP_DISCOVERY_AUDIT!
    expect(audit.totalPagesFound).toBe(audit.pagesInventory.length)
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('every pagesInventory item has url and path', () => {
    for (const item of DAP_DISCOVERY_AUDIT!.pagesInventory) {
      expect(item.url, `missing url in inventory item`).toBeTruthy()
      expect(item.path, `missing path for ${item.url}`).toBeTruthy()
    }
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('every pagesInventory item has a valid purpose', () => {
    const validPurposes: DapPagePurpose[] = ['landing', 'content', 'utility', 'broken', 'redirect', 'unknown']
    for (const item of DAP_DISCOVERY_AUDIT!.pagesInventory) {
      expect(validPurposes, `invalid purpose '${item.purpose}' for ${item.url}`).toContain(item.purpose)
    }
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('every copyAuditFinding has url, rule, and non-empty excerpt', () => {
    for (const finding of DAP_DISCOVERY_AUDIT!.copyAuditFindings) {
      expect(finding.url, `missing url in copy finding`).toBeTruthy()
      expect(finding.rule, `missing rule for finding on ${finding.url}`).toBeTruthy()
      expect(finding.excerpt.length, `empty excerpt for finding on ${finding.url}`).toBeGreaterThan(0)
    }
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('every ctaFinding has url, ctaText, and valid classification', () => {
    const validClass = ['allowed', 'forbidden', 'review_needed']
    for (const finding of DAP_DISCOVERY_AUDIT!.ctaFindings) {
      expect(finding.url, `missing url in CTA finding`).toBeTruthy()
      expect(finding.ctaText, `missing ctaText for finding on ${finding.url}`).toBeTruthy()
      expect(validClass, `invalid classification for ${finding.ctaText}`).toContain(finding.classification)
    }
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('every seoAudit item has url and issues array', () => {
    for (const item of DAP_DISCOVERY_AUDIT!.seoAudit) {
      expect(item.url, `missing url in SEO audit item`).toBeTruthy()
      expect(Array.isArray(item.issues), `issues must be an array for ${item.url}`).toBe(true)
    }
  })

  it.skipIf(DAP_DISCOVERY_AUDIT === null)('customerFacingChangeSummary is non-empty', () => {
    expect(DAP_DISCOVERY_AUDIT!.customerFacingChangeSummary.trim().length).toBeGreaterThan(0)
  })
})

// ─── Type contract compile-time checks ───────────────────────────────────────

describe('DAP Discovery Audit — type contract compilation', () => {
  it('DapDiscoveryAuditResult compiles with all required fields', () => {
    const sample: DapDiscoveryAuditResult = {
      auditedAt: '2026-01-01',
      targetBaseUrl: 'https://example.com',
      totalPagesFound: 1,
      pagesInventory: [],
      copyAuditFindings: [],
      ctaFindings: [],
      seoAudit: [],
      designAuditNotes: [],
      brokenAssets: [],
      customerFacingChangeSummary: 'Test summary.',
    }
    expect(sample.totalPagesFound).toBe(1)
  })

  it('DapPageInventoryItem compiles with all required fields', () => {
    const item: DapPageInventoryItem = {
      url: 'https://example.com/test',
      path: '/test',
      statusCode: 200,
      pageTitle: 'Test',
      h1: 'Test heading',
      metaDescription: null,
      wordCount: 50,
      purpose: 'content',
      hasStructuredData: false,
    }
    expect(item.statusCode).toBe(200)
  })

  it('DapCopyAuditFinding compiles with required and optional fields', () => {
    const finding: DapCopyAuditFinding = {
      url: 'https://example.com',
      rule: 'DAP is not dental insurance',
      excerpt: 'This plan provides insurance coverage',
      ruleNumber: 1,
      severity: 'critical',
    }
    expect(finding.severity).toBe('critical')
  })

  it('DapCtaFinding compiles with all required fields', () => {
    const finding: DapCtaFinding = {
      url: 'https://example.com',
      ctaText: 'Get coverage now',
      ctaHref: '/signup',
      classification: 'forbidden',
      reason: 'Uses insurance-adjacent language',
    }
    expect(finding.classification).toBe('forbidden')
  })

  it('DapSeoAuditItem compiles with all required fields', () => {
    const item: DapSeoAuditItem = {
      url: 'https://example.com',
      titleTag: 'Find a Dentist | DAP',
      titleTagLength: 22,
      metaDescription: null,
      metaDescriptionLength: 0,
      h1: 'Find a Participating Dentist',
      hasStructuredData: false,
      issues: ['Missing meta description'],
    }
    expect(item.issues).toHaveLength(1)
  })
})
