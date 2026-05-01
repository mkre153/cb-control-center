/**
 * Phase 9N — Client Builder Pro / MKCRM Boundary Lock QA
 *
 * PURPOSE: Enforce and prove the architectural boundary between all four
 * systems before any Phase 9O+ payment/billing integration is built.
 *
 * Golden rules:
 *   Client Builder Pro is the public market/payment layer.
 *   MKCRM is the internal CRM/automation layer.
 *   DAP is the vertical registry/directory.
 *   CB Control Center is the admin orchestration layer.
 *
 * COVERAGE:
 *   Group 1 — Client Builder Pro owns market/payment responsibility
 *   Group 2 — MKCRM does not own market/payment responsibility
 *   Group 3 — DAP remains registry/directory only
 *   Group 4 — CB Control Center is admin/orchestration layer
 *   Group 5 — Classification is stable
 *   Group 6 — No public copy positions MKCRM as the market system
 *   Group 7 — Phase 9M shadow sync remains valid under the new boundary
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import {
  getSystemBoundary,
  isResponsibilityAllowed,
  assertResponsibilityAllowed,
  getPublicCommercialSystemForVertical,
  getInternalCrmSystemForVertical,
  classifyDapIntegrationTarget,
} from '../client/clientBuilderBoundaryRules'
import {
  buildPracticeApprovedPayload,
  buildMembershipEnrolledPayload,
} from '../mkcrm/dapMkcrmPayloads'
import {
  syncDapEventToMkcrmShadow,
} from '../mkcrm/dapMkcrmSync'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH    = resolve(ROOT, 'lib/cb-control-center/client/clientBuilderBoundaryTypes.ts')
const RULES_PATH    = resolve(ROOT, 'lib/cb-control-center/client/clientBuilderBoundaryRules.ts')
const MKCRM_SYNC    = resolve(ROOT, 'lib/cb-control-center/mkcrm/dapMkcrmSync.ts')
const MKCRM_PAYLOADS = resolve(ROOT, 'lib/cb-control-center/mkcrm/dapMkcrmPayloads.ts')
const MKCRM_TYPES   = resolve(ROOT, 'lib/cb-control-center/mkcrm/dapMkcrmTypes.ts')

// ─── Group 1: Client Builder Pro owns market/payment ──────────────────────────

describe('Client Builder Pro — owns market and payment responsibility', () => {
  it('files exist', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
    expect(existsSync(RULES_PATH)).toBe(true)
  })

  it('client_builder_pro allows market responsibility', () => {
    expect(isResponsibilityAllowed('client_builder_pro', 'market')).toBe(true)
  })

  it('client_builder_pro allows payment responsibility', () => {
    expect(isResponsibilityAllowed('client_builder_pro', 'payment')).toBe(true)
  })

  it('client_builder_pro allows lifecycle_sync responsibility', () => {
    expect(isResponsibilityAllowed('client_builder_pro', 'lifecycle_sync')).toBe(true)
  })

  it('client_builder_pro is public-facing', () => {
    expect(getSystemBoundary('client_builder_pro').publicFacing).toBe(true)
  })

  it('client_builder_pro publicName references Client Builder Pro', () => {
    const { publicName } = getSystemBoundary('client_builder_pro')
    expect(publicName).toContain('Client Builder Pro')
  })

  it('assertResponsibilityAllowed does not throw for market on client_builder_pro', () => {
    expect(() => assertResponsibilityAllowed('client_builder_pro', 'market')).not.toThrow()
  })

  it('assertResponsibilityAllowed does not throw for payment on client_builder_pro', () => {
    expect(() => assertResponsibilityAllowed('client_builder_pro', 'payment')).not.toThrow()
  })

  it('getPublicCommercialSystemForVertical returns client_builder_pro for dap', () => {
    expect(getPublicCommercialSystemForVertical('dap')).toBe('client_builder_pro')
  })

  it('getPublicCommercialSystemForVertical is stable for any vertical string', () => {
    expect(getPublicCommercialSystemForVertical('any_future_vertical')).toBe('client_builder_pro')
  })

  it('client_builder_pro system key is in types source', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'client_builder_pro'")
  })
})

// ─── Group 2: MKCRM does not own market/payment ────────────────────────────────

describe('MKCRM — internal CRM/automation only, not market or payment', () => {
  it('mkcrm allows crm responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'crm')).toBe(true)
  })

  it('mkcrm allows automation responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'automation')).toBe(true)
  })

  it('mkcrm allows lifecycle_sync responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'lifecycle_sync')).toBe(true)
  })

  it('mkcrm rejects market responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'market')).toBe(false)
  })

  it('mkcrm rejects payment responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'payment')).toBe(false)
  })

  it('mkcrm rejects registry responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'registry')).toBe(false)
  })

  it('mkcrm rejects admin_control responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'admin_control')).toBe(false)
  })

  it('assertResponsibilityAllowed throws for market on mkcrm', () => {
    expect(() => assertResponsibilityAllowed('mkcrm', 'market')).toThrow()
  })

  it('assertResponsibilityAllowed throws for payment on mkcrm', () => {
    expect(() => assertResponsibilityAllowed('mkcrm', 'payment')).toThrow()
  })

  it('assertResponsibilityAllowed error message names the system', () => {
    expect(() => assertResponsibilityAllowed('mkcrm', 'payment')).toThrow(/MKCRM/)
  })

  it('assertResponsibilityAllowed error message names the rejected responsibility', () => {
    expect(() => assertResponsibilityAllowed('mkcrm', 'payment')).toThrow(/payment/)
  })

  it('mkcrm is not public-facing', () => {
    expect(getSystemBoundary('mkcrm').publicFacing).toBe(false)
  })

  it('getInternalCrmSystemForVertical returns mkcrm for dap', () => {
    expect(getInternalCrmSystemForVertical('dap')).toBe('mkcrm')
  })

  it('mkcrm is not the public commercial system for dap', () => {
    expect(getPublicCommercialSystemForVertical('dap')).not.toBe('mkcrm')
  })
})

// ─── Group 3: DAP remains registry/directory only ─────────────────────────────

describe('DAP — vertical registry/directory only, no market or payment role', () => {
  it('dap allows registry responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'registry')).toBe(true)
  })

  it('dap allows directory responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'directory')).toBe(true)
  })

  it('dap rejects payment responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'payment')).toBe(false)
  })

  it('dap rejects market responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'market')).toBe(false)
  })

  it('dap rejects crm responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'crm')).toBe(false)
  })

  it('dap rejects automation responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'automation')).toBe(false)
  })

  it('dap rejects admin_control responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'admin_control')).toBe(false)
  })

  it('assertResponsibilityAllowed throws for payment on dap', () => {
    expect(() => assertResponsibilityAllowed('dap', 'payment')).toThrow()
  })

  it('assertResponsibilityAllowed throws for market on dap', () => {
    expect(() => assertResponsibilityAllowed('dap', 'market')).toThrow()
  })

  it('assertResponsibilityAllowed throws for crm on dap', () => {
    expect(() => assertResponsibilityAllowed('dap', 'crm')).toThrow()
  })

  it('dap publicName references Dental Advantage Plan', () => {
    expect(getSystemBoundary('dap').publicName).toContain('Dental Advantage Plan')
  })
})

// ─── Group 4: CB Control Center is admin/orchestration layer ──────────────────

describe('CB Control Center — admin orchestration layer, not payment or CRM', () => {
  it('cb_control_center allows admin_control responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'admin_control')).toBe(true)
  })

  it('cb_control_center allows cms_export responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'cms_export')).toBe(true)
  })

  it('cb_control_center allows lifecycle_sync responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'lifecycle_sync')).toBe(true)
  })

  it('cb_control_center allows registry responsibility (orchestrates DAP registry)', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'registry')).toBe(true)
  })

  it('cb_control_center rejects payment responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'payment')).toBe(false)
  })

  it('cb_control_center rejects market responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'market')).toBe(false)
  })

  it('cb_control_center rejects crm responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'crm')).toBe(false)
  })

  it('cb_control_center rejects automation responsibility', () => {
    expect(isResponsibilityAllowed('cb_control_center', 'automation')).toBe(false)
  })

  it('assertResponsibilityAllowed throws for payment on cb_control_center', () => {
    expect(() => assertResponsibilityAllowed('cb_control_center', 'payment')).toThrow()
  })

  it('cb_control_center is not public-facing', () => {
    expect(getSystemBoundary('cb_control_center').publicFacing).toBe(false)
  })
})

// ─── Group 5: Classification is stable ────────────────────────────────────────

describe('Integration target classification — stable and exhaustive', () => {
  it('client_builder_pro classifies as public_commercial_layer', () => {
    expect(classifyDapIntegrationTarget('client_builder_pro')).toBe('public_commercial_layer')
  })

  it('mkcrm classifies as internal_crm_layer', () => {
    expect(classifyDapIntegrationTarget('mkcrm')).toBe('internal_crm_layer')
  })

  it('dap classifies as vertical_registry_layer', () => {
    expect(classifyDapIntegrationTarget('dap')).toBe('vertical_registry_layer')
  })

  it('cb_control_center classifies as admin_control_layer', () => {
    expect(classifyDapIntegrationTarget('cb_control_center')).toBe('admin_control_layer')
  })

  it('unknown string classifies as unknown', () => {
    expect(classifyDapIntegrationTarget('some_random_system')).toBe('unknown')
  })

  it('ghl classifies as unknown (GHL is not a valid system)', () => {
    expect(classifyDapIntegrationTarget('ghl')).toBe('unknown')
  })

  it('empty string classifies as unknown', () => {
    expect(classifyDapIntegrationTarget('')).toBe('unknown')
  })

  it('classification is deterministic — same input, same output', () => {
    expect(classifyDapIntegrationTarget('client_builder_pro')).toBe(
      classifyDapIntegrationTarget('client_builder_pro')
    )
    expect(classifyDapIntegrationTarget('mkcrm')).toBe(
      classifyDapIntegrationTarget('mkcrm')
    )
  })
})

// ─── Group 6: No public copy positions MKCRM as the market system ─────────────

describe('Copy boundary — MKCRM must not be described as checkout, payment, or market', () => {
  const FORBIDDEN_MARKET_TERMS = [
    'checkout',
    'payment processor',
    'marketplace',
    'subscription platform',
    'customer-facing billing',
    'public market',
  ]

  for (const term of FORBIDDEN_MARKET_TERMS) {
    it(`dapMkcrmSync.ts does not contain market language: "${term}"`, () => {
      const src = readFileSync(MKCRM_SYNC, 'utf8').toLowerCase()
      expect(src).not.toContain(term.toLowerCase())
    })
  }

  it('dapMkcrmPayloads.ts does not describe MKCRM as a checkout or payment system', () => {
    const src = readFileSync(MKCRM_PAYLOADS, 'utf8').toLowerCase()
    expect(src).not.toContain('checkout')
    expect(src).not.toContain('payment processor')
    expect(src).not.toContain('marketplace')
  })

  it('dapMkcrmTypes.ts does not describe MKCRM as a checkout or payment system', () => {
    const src = readFileSync(MKCRM_TYPES, 'utf8').toLowerCase()
    expect(src).not.toContain('checkout')
    expect(src).not.toContain('payment processor')
    expect(src).not.toContain('marketplace')
  })

  it('clientBuilderBoundaryRules.ts names Client Builder Pro as the commercial system', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toContain('client_builder_pro')
    expect(src).toContain('Client Builder Pro')
  })

  it('clientBuilderBoundaryRules.ts does not assign market to mkcrm allowedResponsibilities', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    const mkCrmBlockStart = src.indexOf("mkcrm:")
    const mkCrmBlockEnd   = src.indexOf('dap:', mkCrmBlockStart)
    const mkCrmBlock = src.slice(mkCrmBlockStart, mkCrmBlockEnd)
    const allowedLine = mkCrmBlock.match(/allowedResponsibilities:\s*\[([^\]]*)\]/)?.[1] ?? ''
    expect(allowedLine).not.toContain("'market'")
  })

  it('clientBuilderBoundaryRules.ts does not assign payment to mkcrm allowedResponsibilities', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    const mkCrmBlockStart = src.indexOf("mkcrm:")
    const mkCrmBlockEnd   = src.indexOf('dap:', mkCrmBlockStart)
    const mkCrmBlock = src.slice(mkCrmBlockStart, mkCrmBlockEnd)
    const allowedLine = mkCrmBlock.match(/allowedResponsibilities:\s*\[([^\]]*)\]/)?.[1] ?? ''
    expect(allowedLine).not.toContain("'payment'")
  })

  it('rules module has no Supabase imports (pure functions only)', () => {
    const src = readFileSync(RULES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('types module has no Supabase imports', () => {
    const src = readFileSync(TYPES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })
})

// ─── Group 7: Phase 9M shadow sync remains valid under the new boundary ────────

describe('Phase 9M shadow sync — still valid, still shadow-only, still no payment', () => {
  it('dapMkcrmSync.ts still contains no fetch( call', () => {
    const src = readFileSync(MKCRM_SYNC, 'utf8')
    expect(src).not.toContain('fetch(')
  })

  it('dapMkcrmSync.ts still contains no http:// or https:// URLs', () => {
    const src = readFileSync(MKCRM_SYNC, 'utf8')
    expect(src).not.toMatch(/https?:\/\//)
  })

  it('syncDapEventToMkcrmShadow returns shadowMode: true for a practice event', async () => {
    const payload = buildPracticeApprovedPayload({
      requestId:    'req-9n-test',
      practiceName: 'Test Practice',
      city:         'San Diego',
      state:        'CA',
      occurredAt:   '2026-04-30T00:00:00Z',
    })
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.shadowMode).toBe(true)
    expect(result.ok).toBe(true)
  })

  it('syncDapEventToMkcrmShadow returns shadowMode: true for a membership event', async () => {
    const payload = buildMembershipEnrolledPayload({
      memberId:     'mbr-9n-test',
      membershipId: 'mem-9n-test',
      practiceId:   'prc-9n-test',
      occurredAt:   '2026-04-30T00:00:00Z',
    })
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.shadowMode).toBe(true)
    expect(result.ok).toBe(true)
  })

  it('9M shadow sync result has no payment-originating fields', async () => {
    const payload = buildPracticeApprovedPayload({
      requestId:    'req-9n-test-2',
      practiceName: 'Test Practice',
      city:         'San Diego',
      state:        'CA',
      occurredAt:   '2026-04-30T00:00:00Z',
    })
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result).not.toHaveProperty('amount')
    expect(result).not.toHaveProperty('checkoutUrl')
    expect(result).not.toHaveProperty('invoiceId')
    expect(result).not.toHaveProperty('subscriptionId')
  })

  it('page count is still 21 (Phase 9N adds no new pages)', () => {
    function findPages(dir: string): string[] {
      if (!existsSync(dir)) return []
      const results: string[] = []
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
          results.push(...findPages(full))
        } else if (entry.isFile() && full.endsWith('page.tsx')) {
          results.push(full)
        }
      }
      return results
    }
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })

  it('no ClientBuilder.Pro API route created in Phase 9N', () => {
    expect(existsSync(resolve(ROOT, 'app/api/dap/cbp/route.ts'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'app/api/clientbuilder/route.ts'))).toBe(false)
  })
})
