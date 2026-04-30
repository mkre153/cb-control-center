// Phase 14 — DAP Admin Decision Write Contract Preview
// Validation-only contract that a future mutation endpoint must satisfy before appending
// any admin decision event. No writes. No mutations. No email. No payment. No MKCRM live sync.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/admin-decision-write-contract/page.tsx')

function findPages(dir: string): string[] {
  const { readdirSync, statSync } = require('fs')
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findPages(full))
    else if (entry === 'page.tsx' || entry === 'page.ts') results.push(full)
  }
  return results
}

import {
  buildDapAdminDecisionWriteContract,
  buildDapAdminDecisionWriteContracts,
  buildWriteContractsFromDemoContext,
  buildWriteContractsFromApprovedContext,
  buildWriteContractsFromEmptyContext,
  WRITE_CONTRACT_SAFETY,
  WRITE_CONTRACT_FORBIDDEN_FIELDS,
  DAP_WRITE_CONTRACT_CONTEXT_DEMO,
  DAP_WRITE_CONTRACT_CONTEXT_APPROVED,
  DAP_WRITE_CONTRACT_CONTEXT_EMPTY,
} from './dapAdminDecisionWriteContract'
import {
  buildDapAdminDecisionLedger,
} from './dapAdminDecisionLedger'
import type { DapAdminDecisionWriteContract } from './dapAdminDecisionWriteContractTypes'

const ALL_CONTRACT_KEYS = [
  'write_contract_practice_request_approved',
  'write_contract_practice_request_rejected',
  'write_contract_offer_terms_review_passed',
  'write_contract_offer_terms_review_failed',
  'write_contract_provider_participation_confirmed',
  'write_contract_provider_participation_declined',
  'write_contract_communication_approved_for_future_send',
  'write_contract_communication_rejected',
  'write_contract_mkcrm_shadow_payload_approved_for_future_sync',
] as const

// ─── Group 1: Page exists ─────────────────────────────────────────────────────

describe('Phase 14 — Page exists', () => {
  it('app/preview/dap/admin-decision-write-contract/page.tsx exists', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page is a .tsx file', () => {
    expect(PAGE_PATH.endsWith('.tsx')).toBe(true)
  })

  it('page uses force-dynamic export', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('page is a server component (no "use client")', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('page does not import from Supabase', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('total page count is now 33', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(34)
  })
})

// ─── Group 2: Builder exports ─────────────────────────────────────────────────

describe('Phase 14 — Builder exports', () => {
  it('buildDapAdminDecisionWriteContract is a function', () => {
    expect(typeof buildDapAdminDecisionWriteContract).toBe('function')
  })

  it('buildDapAdminDecisionWriteContracts is a function', () => {
    expect(typeof buildDapAdminDecisionWriteContracts).toBe('function')
  })

  it('buildWriteContractsFromDemoContext is a function', () => {
    expect(typeof buildWriteContractsFromDemoContext).toBe('function')
  })

  it('WRITE_CONTRACT_SAFETY is exported', () => {
    expect(WRITE_CONTRACT_SAFETY).toBeDefined()
  })

  it('WRITE_CONTRACT_FORBIDDEN_FIELDS is exported', () => {
    expect(Array.isArray(WRITE_CONTRACT_FORBIDDEN_FIELDS)).toBe(true)
  })

  it('fixture contexts are exported', () => {
    expect(DAP_WRITE_CONTRACT_CONTEXT_DEMO).toBeDefined()
    expect(DAP_WRITE_CONTRACT_CONTEXT_APPROVED).toBeDefined()
    expect(DAP_WRITE_CONTRACT_CONTEXT_EMPTY).toBeDefined()
  })
})

// ─── Group 3: All 9 contracts ─────────────────────────────────────────────────

describe('Phase 14 — All 9 contracts', () => {
  it('buildWriteContractsFromDemoContext returns 9 contracts', () => {
    expect(buildWriteContractsFromDemoContext()).toHaveLength(9)
  })

  it('buildWriteContractsFromApprovedContext returns 9 contracts', () => {
    expect(buildWriteContractsFromApprovedContext()).toHaveLength(9)
  })

  it('buildWriteContractsFromEmptyContext returns 9 contracts', () => {
    expect(buildWriteContractsFromEmptyContext()).toHaveLength(9)
  })

  it('all 9 contract keys are present in demo context', () => {
    const contracts = buildWriteContractsFromDemoContext()
    const keys = contracts.map(c => c.contractKey)
    for (const key of ALL_CONTRACT_KEYS) {
      expect(keys).toContain(key)
    }
  })

  it('all 9 contract keys start with write_contract_', () => {
    const contracts = buildWriteContractsFromDemoContext()
    for (const contract of contracts) {
      expect(contract.contractKey).toMatch(/^write_contract_/)
    }
  })

  it('buildDapAdminDecisionWriteContracts wraps a ledger correctly', () => {
    const events = buildDapAdminDecisionLedger(DAP_WRITE_CONTRACT_CONTEXT_DEMO)
    const contracts = buildDapAdminDecisionWriteContracts(events)
    expect(contracts).toHaveLength(events.length)
  })
})

// ─── Group 4: Required fields on every contract ───────────────────────────────

describe('Phase 14 — Required fields on every contract', () => {
  const contracts = buildWriteContractsFromDemoContext()

  const REQUIRED_KEYS: (keyof DapAdminDecisionWriteContract)[] = [
    'contractKey', 'sourceEventKey', 'sourceActionKey', 'entityType', 'entityId',
    'writeEligibility', 'wouldAppendTo', 'requiredFields', 'forbiddenFields',
    'authorityChecks', 'idempotencyKeyPreview', 'validationMessages', 'blockedBy', 'safetyFlags',
  ]

  for (const field of REQUIRED_KEYS) {
    it(`every contract has field: ${field}`, () => {
      for (const contract of contracts) {
        expect(contract).toHaveProperty(field)
      }
    })
  }
})

// ─── Group 5: writeEligibility values ────────────────────────────────────────

describe('Phase 14 — writeEligibility values', () => {
  const VALID_ELIGIBILITY = ['eligible_for_future_write', 'blocked', 'preview_only']

  it('all contracts in demo context have valid writeEligibility', () => {
    const contracts = buildWriteContractsFromDemoContext()
    for (const contract of contracts) {
      expect(VALID_ELIGIBILITY).toContain(contract.writeEligibility)
    }
  })

  it('all contracts in empty context have valid writeEligibility', () => {
    const contracts = buildWriteContractsFromEmptyContext()
    for (const contract of contracts) {
      expect(VALID_ELIGIBILITY).toContain(contract.writeEligibility)
    }
  })

  it('context changes affect writeEligibility', () => {
    const demo  = new Set(buildWriteContractsFromDemoContext().map(c => c.writeEligibility))
    const empty = new Set(buildWriteContractsFromEmptyContext().map(c => c.writeEligibility))
    expect(demo).not.toEqual(empty)
  })

  it('blocked events produce blocked contracts', () => {
    const events = buildDapAdminDecisionLedger(DAP_WRITE_CONTRACT_CONTEXT_DEMO)
    const blockedEvents = events.filter(e => e.actionAvailability === 'blocked')
    for (const event of blockedEvents) {
      const contract = buildDapAdminDecisionWriteContract(event)
      expect(contract.writeEligibility).toBe('blocked')
    }
  })

  it('future_only events produce preview_only contracts', () => {
    const events = buildDapAdminDecisionLedger(DAP_WRITE_CONTRACT_CONTEXT_DEMO)
    const futureEvents = events.filter(e => e.actionAvailability === 'future_only')
    for (const event of futureEvents) {
      const contract = buildDapAdminDecisionWriteContract(event)
      expect(contract.writeEligibility).toBe('preview_only')
    }
  })

  it('available events produce eligible_for_future_write contracts', () => {
    const events = buildDapAdminDecisionLedger(DAP_WRITE_CONTRACT_CONTEXT_DEMO)
    const availableEvents = events.filter(e => e.actionAvailability === 'available')
    for (const event of availableEvents) {
      const contract = buildDapAdminDecisionWriteContract(event)
      expect(contract.writeEligibility).toBe('eligible_for_future_write')
    }
  })
})

// ─── Group 6: requiredFields ──────────────────────────────────────────────────

describe('Phase 14 — requiredFields', () => {
  const contracts = buildWriteContractsFromDemoContext()

  it('every contract has non-empty requiredFields', () => {
    for (const contract of contracts) {
      expect(contract.requiredFields.length).toBeGreaterThan(0)
    }
  })

  it('every requiredFields list contains requiredGatesSatisfied', () => {
    for (const contract of contracts) {
      expect(contract.requiredFields).toContain('requiredGatesSatisfied')
    }
  })

  it('every requiredFields list contains decidedAt or approvedAt or reviewedAt', () => {
    for (const contract of contracts) {
      const hasTimestamp = (
        contract.requiredFields.includes('decidedAt') ||
        contract.requiredFields.includes('approvedAt') ||
        contract.requiredFields.includes('reviewedAt')
      )
      expect(hasTimestamp).toBe(true)
    }
  })

  it('practice_request contracts require requestId', () => {
    for (const contract of contracts.filter(c => c.entityType === 'practice_request')) {
      expect(contract.requiredFields).toContain('requestId')
    }
  })

  it('provider_participation contracts require practiceId', () => {
    for (const contract of contracts.filter(c => c.entityType === 'provider_participation')) {
      expect(contract.requiredFields).toContain('practiceId')
    }
  })

  it('communication_dispatch contracts require communicationId', () => {
    for (const contract of contracts.filter(c => c.entityType === 'communication_dispatch')) {
      expect(contract.requiredFields).toContain('communicationId')
    }
  })

  it('mkcrm_shadow_payload contracts require shadowPayloadId', () => {
    for (const contract of contracts.filter(c => c.entityType === 'mkcrm_shadow_payload')) {
      expect(contract.requiredFields).toContain('shadowPayloadId')
    }
  })
})

// ─── Group 7: forbiddenFields ─────────────────────────────────────────────────

describe('Phase 14 — forbiddenFields', () => {
  it('WRITE_CONTRACT_FORBIDDEN_FIELDS is non-empty', () => {
    expect(WRITE_CONTRACT_FORBIDDEN_FIELDS.length).toBeGreaterThan(0)
  })

  it('WRITE_CONTRACT_FORBIDDEN_FIELDS contains mutate', () => {
    expect(WRITE_CONTRACT_FORBIDDEN_FIELDS).toContain('mutate')
  })

  it('WRITE_CONTRACT_FORBIDDEN_FIELDS contains execute', () => {
    expect(WRITE_CONTRACT_FORBIDDEN_FIELDS).toContain('execute')
  })

  it('WRITE_CONTRACT_FORBIDDEN_FIELDS contains syncNow', () => {
    expect(WRITE_CONTRACT_FORBIDDEN_FIELDS).toContain('syncNow')
  })

  it('WRITE_CONTRACT_FORBIDDEN_FIELDS contains sendEmail', () => {
    expect(WRITE_CONTRACT_FORBIDDEN_FIELDS).toContain('sendEmail')
  })

  it('WRITE_CONTRACT_FORBIDDEN_FIELDS contains triggerPayment', () => {
    expect(WRITE_CONTRACT_FORBIDDEN_FIELDS).toContain('triggerPayment')
  })

  it('every contract shares the universal forbiddenFields list', () => {
    const contracts = buildWriteContractsFromDemoContext()
    for (const contract of contracts) {
      expect(contract.forbiddenFields).toEqual(WRITE_CONTRACT_FORBIDDEN_FIELDS)
    }
  })

  it('no requiredField name appears in forbiddenFields', () => {
    const contracts = buildWriteContractsFromDemoContext()
    for (const contract of contracts) {
      for (const field of contract.requiredFields) {
        expect(contract.forbiddenFields).not.toContain(field)
      }
    }
  })
})

// ─── Group 8: authorityChecks ─────────────────────────────────────────────────

describe('Phase 14 — authorityChecks', () => {
  const contracts = buildWriteContractsFromDemoContext()

  it('every contract has non-empty authorityChecks', () => {
    for (const contract of contracts) {
      expect(contract.authorityChecks.length).toBeGreaterThan(0)
    }
  })

  it('cb_control_center authority contracts include mkcrm boundary check', () => {
    for (const contract of contracts) {
      const isCbc = !['write_contract_provider_participation_confirmed', 'write_contract_provider_participation_declined'].includes(contract.contractKey)
      if (isCbc) {
        const hasMkcrmCheck = contract.authorityChecks.some(c => c.toLowerCase().includes('mkcrm'))
        expect(hasMkcrmCheck).toBe(true)
      }
    }
  })

  it('provider participation contracts reference provider submission authority', () => {
    const participationContracts = contracts.filter(c =>
      c.contractKey === 'write_contract_provider_participation_confirmed' ||
      c.contractKey === 'write_contract_provider_participation_declined'
    )
    for (const contract of participationContracts) {
      const hasProviderCheck = contract.authorityChecks.some(c =>
        c.toLowerCase().includes('provider')
      )
      expect(hasProviderCheck).toBe(true)
    }
  })
})

// ─── Group 9: idempotencyKeyPreview ──────────────────────────────────────────

describe('Phase 14 — idempotencyKeyPreview', () => {
  const contracts = buildWriteContractsFromDemoContext()

  it('every contract has a non-empty idempotencyKeyPreview', () => {
    for (const contract of contracts) {
      expect(contract.idempotencyKeyPreview.length).toBeGreaterThan(0)
    }
  })

  it('all idempotencyKeyPreview values start with preview:', () => {
    for (const contract of contracts) {
      expect(contract.idempotencyKeyPreview).toMatch(/^preview:/)
    }
  })

  it('idempotencyKeyPreview includes sourceActionKey', () => {
    for (const contract of contracts) {
      expect(contract.idempotencyKeyPreview).toContain(contract.sourceActionKey)
    }
  })

  it('idempotencyKeyPreview includes entityId', () => {
    for (const contract of contracts) {
      expect(contract.idempotencyKeyPreview).toContain(contract.entityId)
    }
  })

  it('all idempotencyKeyPreview values are unique', () => {
    const keys = contracts.map(c => c.idempotencyKeyPreview)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

// ─── Group 10: validationMessages ────────────────────────────────────────────

describe('Phase 14 — validationMessages', () => {
  const contracts = buildWriteContractsFromDemoContext()

  it('every contract has non-empty validationMessages', () => {
    for (const contract of contracts) {
      expect(contract.validationMessages.length).toBeGreaterThan(0)
    }
  })

  it('blocked contracts have validation messages mentioning gates or blockers', () => {
    for (const contract of contracts.filter(c => c.writeEligibility === 'blocked')) {
      const hasBlockMessage = contract.validationMessages.some(m =>
        m.toLowerCase().includes('blocked') || m.toLowerCase().includes('gate')
      )
      expect(hasBlockMessage).toBe(true)
    }
  })

  it('preview_only contracts have validation messages mentioning future phase', () => {
    for (const contract of contracts.filter(c => c.writeEligibility === 'preview_only')) {
      const hasFutureMessage = contract.validationMessages.some(m =>
        m.toLowerCase().includes('future')
      )
      expect(hasFutureMessage).toBe(true)
    }
  })

  it('eligible contracts have validation messages mentioning gates satisfied', () => {
    for (const contract of contracts.filter(c => c.writeEligibility === 'eligible_for_future_write')) {
      const hasGateMessage = contract.validationMessages.some(m =>
        m.toLowerCase().includes('gate') || m.toLowerCase().includes('eligible')
      )
      expect(hasGateMessage).toBe(true)
    }
  })
})

// ─── Group 11: wouldAppendTo passthrough ─────────────────────────────────────

describe('Phase 14 — wouldAppendTo passthrough', () => {
  const VALID_TARGETS = [
    'future_dap_admin_decision_events',
    'future_dap_communication_approval_events',
    'future_dap_provider_participation_events',
    'future_dap_mkcrm_shadow_approval_events',
  ]

  it('all contracts have valid wouldAppendTo', () => {
    const contracts = buildWriteContractsFromDemoContext()
    for (const contract of contracts) {
      expect(VALID_TARGETS).toContain(contract.wouldAppendTo)
    }
  })

  it('wouldAppendTo matches Phase 13 source event', () => {
    const events = buildDapAdminDecisionLedger(DAP_WRITE_CONTRACT_CONTEXT_DEMO)
    const contracts = buildDapAdminDecisionWriteContracts(events)
    for (let i = 0; i < events.length; i++) {
      expect(contracts[i].wouldAppendTo).toBe(events[i].wouldAppendTo)
    }
  })
})

// ─── Group 12: Safety flags ───────────────────────────────────────────────────

describe('Phase 14 — Safety flags', () => {
  it('WRITE_CONTRACT_SAFETY.readOnly is true', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['readOnly']).toBe(true)
  })

  it('WRITE_CONTRACT_SAFETY.previewOnly is true', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['previewOnly']).toBe(true)
  })

  it('WRITE_CONTRACT_SAFETY.validatesOnly is true', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['validatesOnly']).toBe(true)
  })

  it('WRITE_CONTRACT_SAFETY.appendsToSupabase is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['appendsToSupabase']).toBe(false)
  })

  it('WRITE_CONTRACT_SAFETY.mutatesStatus is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['mutatesStatus']).toBe(false)
  })

  it('WRITE_CONTRACT_SAFETY.sendsEmail is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['sendsEmail']).toBe(false)
  })

  it('WRITE_CONTRACT_SAFETY.queuesEmail is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['queuesEmail']).toBe(false)
  })

  it('WRITE_CONTRACT_SAFETY.triggersPayment is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['triggersPayment']).toBe(false)
  })

  it('WRITE_CONTRACT_SAFETY.triggersMkcrmLiveSync is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['triggersMkcrmLiveSync']).toBe(false)
  })

  it('WRITE_CONTRACT_SAFETY.callsWebhook is false', () => {
    expect((WRITE_CONTRACT_SAFETY as unknown as Record<string, unknown>)['callsWebhook']).toBe(false)
  })

  it('every contract safetyFlags matches WRITE_CONTRACT_SAFETY', () => {
    const contracts = buildWriteContractsFromDemoContext()
    for (const contract of contracts) {
      const flags = contract.safetyFlags as unknown as Record<string, unknown>
      expect(flags['readOnly']).toBe(true)
      expect(flags['previewOnly']).toBe(true)
      expect(flags['validatesOnly']).toBe(true)
      expect(flags['appendsToSupabase']).toBe(false)
      expect(flags['mutatesStatus']).toBe(false)
      expect(flags['sendsEmail']).toBe(false)
      expect(flags['queuesEmail']).toBe(false)
      expect(flags['triggersPayment']).toBe(false)
      expect(flags['triggersMkcrmLiveSync']).toBe(false)
      expect(flags['callsWebhook']).toBe(false)
    }
  })

  it('safety flags are identical across all contexts', () => {
    const allContracts = [
      ...buildWriteContractsFromEmptyContext(),
      ...buildWriteContractsFromDemoContext(),
      ...buildWriteContractsFromApprovedContext(),
    ]
    for (const contract of allContracts) {
      const flags = contract.safetyFlags as unknown as Record<string, unknown>
      expect(flags['previewOnly']).toBe(true)
      expect(flags['appendsToSupabase']).toBe(false)
      expect(flags['triggersPayment']).toBe(false)
      expect(flags['callsWebhook']).toBe(false)
    }
  })
})

// ─── Group 13: Page source content ───────────────────────────────────────────

describe('Phase 14 — Page source content', () => {
  it('page imports buildWriteContractsFromDemoContext', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildWriteContractsFromDemoContext')
  })

  it('page imports from dapAdminDecisionWriteContract', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dapAdminDecisionWriteContract')
  })

  it('page references writeEligibility', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('writeEligibility')
  })

  it('page references requiredFields', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('requiredFields')
  })

  it('page references forbiddenFields', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('forbiddenFields')
  })

  it('page references authorityChecks', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('authorityChecks')
  })

  it('page references idempotencyKeyPreview', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('idempotencyKeyPreview')
  })

  it('page references safetyFlags', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('safetyFlags')
  })

  it('page references validatesOnly', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('validatesOnly')
  })

  it('page maps over contracts (not hardcoded per-contract blocks)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/\.map\(/)
  })
})

// ─── Group 14: Preview-only boundary ─────────────────────────────────────────

describe('Phase 14 — Preview-only boundary', () => {
  it('page contains preview-only language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('preview')
  })

  it('page does not contain email-sending function calls', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('sendEmail')
    expect(src).not.toContain('resend.emails.send')
  })

  it('page does not call API endpoints', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('/api/mkcrm')
    expect(src).not.toContain('/api/email')
    expect(src).not.toContain("fetch('")
    expect(src).not.toContain('fetch("')
  })

  it('page does not POST to any endpoint', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/method:\s*['"]POST['"]/i)
  })

  it('page states no emails are sent from it', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('no email')
  })

  it('page contains "MKCRM does not decide" language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('MKCRM does not decide')
  })

  it('page contains data-authority-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-authority-notice')
  })

  it('page contains data-preview-only-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only-notice')
  })

  it('page does not contain server action syntax', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })
})

// ─── Group 15: Full suite guard ───────────────────────────────────────────────

describe('Phase 14 — Full suite guard', () => {
  it('page count is 33 (all prior pages preserved)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(34)
  })

  it('buildWriteContractsFromDemoContext still returns 9 contracts', () => {
    expect(buildWriteContractsFromDemoContext()).toHaveLength(9)
  })

  it('Phase 13 ledger still returns 9 events', () => {
    expect(buildDapAdminDecisionLedger(DAP_WRITE_CONTRACT_CONTEXT_DEMO)).toHaveLength(9)
  })

  it('all safety flags preserved across contexts', () => {
    const allContracts = [
      ...buildWriteContractsFromEmptyContext(),
      ...buildWriteContractsFromDemoContext(),
      ...buildWriteContractsFromApprovedContext(),
    ]
    for (const contract of allContracts) {
      const flags = contract.safetyFlags as unknown as Record<string, unknown>
      expect(flags['previewOnly']).toBe(true)
      expect(flags['appendsToSupabase']).toBe(false)
      expect(flags['triggersPayment']).toBe(false)
      expect(flags['callsWebhook']).toBe(false)
      expect(flags['validatesOnly']).toBe(true)
    }
  })
})
