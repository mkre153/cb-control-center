/**
 * DAP Build Ledger Tests
 *
 * PURPOSE: Verify the ledger schema, data integrity, and display component
 * meet the operator-updated ledger contract.
 *
 * COVERAGE:
 *   Group 1 — Schema integrity (all entries, required fields, valid types)
 *   Group 2 — Evidence integrity (discriminated union, field completeness)
 *   Group 3 — Completeness rules (status ↔ completedAt, verification level)
 *   Group 4 — Content accuracy (known phases present, test counts correct)
 *   Group 5 — Source file integrity (readFileSync checks)
 *   Group 6 — Display component renders correctly
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import React from 'react'
import {
  DAP_BUILD_LEDGER,
  getLedgerByStatus,
  getLatestLedgerEntry,
  getCompletedCount,
  type DapBuildStatus,
  type DapBuildVerification,
} from './dapBuildLedger'
import { DapBuildLedgerPanel } from '@/components/cb-control-center/DapBuildLedgerPanel'

const ROOT = resolve(__dirname, '../..')

const VALID_STATUSES: DapBuildStatus[] = ['complete', 'in_progress', 'blocked', 'pending']
const VALID_VERIFICATIONS: DapBuildVerification[] = [
  'verified_in_repo',
  'verified_by_test',
  'verified_by_deployment',
  'recorded_from_operator_report',
]
const VALID_EVIDENCE_TYPES = [
  'git_tag', 'git_branch', 'git_commit', 'vercel_url', 'file', 'test_suite',
]

// ─── Group 1: Schema integrity ────────────────────────────────────────────────

describe('Group 1 — Schema integrity', () => {
  it('ledger has at least one entry', () => {
    expect(DAP_BUILD_LEDGER.length).toBeGreaterThanOrEqual(1)
  })

  it('all entries have non-empty id', () => {
    for (const e of DAP_BUILD_LEDGER) {
      expect(e.id, `entry missing id`).toBeTruthy()
    }
  })

  it('all ids are unique', () => {
    const ids = DAP_BUILD_LEDGER.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all entries have non-empty title', () => {
    for (const e of DAP_BUILD_LEDGER) {
      expect(e.title, `${e.id} missing title`).toBeTruthy()
    }
  })

  it('all entries have non-empty summary', () => {
    for (const e of DAP_BUILD_LEDGER) {
      expect(e.summary, `${e.id} missing summary`).toBeTruthy()
    }
  })

  it('all statuses are valid', () => {
    for (const e of DAP_BUILD_LEDGER) {
      expect(VALID_STATUSES, `${e.id} has invalid status '${e.status}'`).toContain(e.status)
    }
  })

  it('all verification values are valid', () => {
    for (const e of DAP_BUILD_LEDGER) {
      expect(
        VALID_VERIFICATIONS,
        `${e.id} has invalid verification '${e.verification}'`
      ).toContain(e.verification)
    }
  })

  it('all entries have non-empty recordedAt', () => {
    for (const e of DAP_BUILD_LEDGER) {
      expect(e.recordedAt, `${e.id} missing recordedAt`).toBeTruthy()
    }
  })

  it('all recordedAt values are ISO date strings', () => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/
    for (const e of DAP_BUILD_LEDGER) {
      expect(e.recordedAt, `${e.id} recordedAt not ISO date`).toMatch(isoDate)
    }
  })
})

// ─── Group 2: Evidence integrity ──────────────────────────────────────────────

describe('Group 2 — Evidence integrity', () => {
  it('all evidence types are valid discriminants', () => {
    for (const e of DAP_BUILD_LEDGER) {
      for (const ev of e.evidence) {
        expect(VALID_EVIDENCE_TYPES, `${e.id} has unknown evidence type '${ev.type}'`).toContain(ev.type)
      }
    }
  })

  it('git_commit evidence has non-empty hash and message', () => {
    for (const e of DAP_BUILD_LEDGER) {
      for (const ev of e.evidence) {
        if (ev.type === 'git_commit') {
          expect(ev.hash, `${e.id} git_commit missing hash`).toBeTruthy()
          expect(ev.message, `${e.id} git_commit missing message`).toBeTruthy()
        }
      }
    }
  })

  it('test_suite evidence has passing >= 0', () => {
    for (const e of DAP_BUILD_LEDGER) {
      for (const ev of e.evidence) {
        if (ev.type === 'test_suite') {
          expect(ev.passing, `${e.id} test_suite has negative passing`).toBeGreaterThanOrEqual(0)
          expect(ev.name, `${e.id} test_suite missing name`).toBeTruthy()
        }
      }
    }
  })

  it('git_tag evidence has non-empty ref', () => {
    for (const e of DAP_BUILD_LEDGER) {
      for (const ev of e.evidence) {
        if (ev.type === 'git_tag') {
          expect(ev.ref, `${e.id} git_tag missing ref`).toBeTruthy()
        }
      }
    }
  })

  it('vercel_url evidence has non-empty url', () => {
    for (const e of DAP_BUILD_LEDGER) {
      for (const ev of e.evidence) {
        if (ev.type === 'vercel_url') {
          expect(ev.url, `${e.id} vercel_url missing url`).toBeTruthy()
        }
      }
    }
  })
})

// ─── Group 3: Completeness rules ──────────────────────────────────────────────

describe('Group 3 — Completeness rules', () => {
  it('complete entries have non-null completedAt', () => {
    for (const e of DAP_BUILD_LEDGER) {
      if (e.status === 'complete') {
        expect(e.completedAt, `complete entry ${e.id} has null completedAt`).not.toBeNull()
        expect(e.completedAt).toBeTruthy()
      }
    }
  })

  it('in_progress entries have null completedAt', () => {
    for (const e of DAP_BUILD_LEDGER) {
      if (e.status === 'in_progress') {
        expect(e.completedAt, `in_progress entry ${e.id} should have null completedAt`).toBeNull()
      }
    }
  })

  it('verified_by_deployment entries include a vercel_url or git_commit', () => {
    for (const e of DAP_BUILD_LEDGER) {
      if (e.verification === 'verified_by_deployment') {
        const hasDeploymentEvidence = e.evidence.some(
          ev => ev.type === 'vercel_url' || ev.type === 'git_commit'
        )
        expect(hasDeploymentEvidence, `${e.id} claims deployment verification but has no URL or commit`).toBe(true)
      }
    }
  })

  it('verified_by_test entries include a test_suite', () => {
    for (const e of DAP_BUILD_LEDGER) {
      if (e.verification === 'verified_by_test') {
        const hasTestSuite = e.evidence.some(ev => ev.type === 'test_suite')
        expect(hasTestSuite, `${e.id} claims test verification but has no test_suite evidence`).toBe(true)
      }
    }
  })

  it('test_suite passing counts are realistic (> 0)', () => {
    for (const e of DAP_BUILD_LEDGER) {
      for (const ev of e.evidence) {
        if (ev.type === 'test_suite') {
          expect(ev.passing, `${e.id} test_suite '${ev.name}' has 0 passing — suspicious`).toBeGreaterThan(0)
        }
      }
    }
  })
})

// ─── Group 4: Content accuracy ────────────────────────────────────────────────

describe('Group 4 — Content accuracy', () => {
  it('Phase 18B entry exists', () => {
    expect(DAP_BUILD_LEDGER.find(e => e.id === 'phase-18b-neil-llm-formatting')).toBeDefined()
  })

  it('Phase 18B test suite passes 74', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'phase-18b-neil-llm-formatting')!
    const suite = entry.evidence.find(ev => ev.type === 'test_suite') as { type: 'test_suite'; name: string; passing: number }
    expect(suite.passing).toBe(74)
  })

  it('Phase 18C entry exists', () => {
    expect(DAP_BUILD_LEDGER.find(e => e.id === 'phase-18c-page-generation-contract')).toBeDefined()
  })

  it('Phase 18C test suite passes 243', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'phase-18c-page-generation-contract')!
    const suite = entry.evidence.find(ev => ev.type === 'test_suite') as { type: 'test_suite'; name: string; passing: number }
    expect(suite.passing).toBe(243)
  })

  it('Phase 18D entry exists', () => {
    expect(DAP_BUILD_LEDGER.find(e => e.id === 'phase-18d-dap-page-brief-builder')).toBeDefined()
  })

  it('Phase 18D test suite passes 277', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'phase-18d-dap-page-brief-builder')!
    const suite = entry.evidence.find(ev => ev.type === 'test_suite') as { type: 'test_suite'; name: string; passing: number }
    expect(suite.passing).toBe(277)
  })

  it('Phase 18E entry exists and is complete', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'phase-18e-cbcc-workspace-shell')
    expect(entry).toBeDefined()
    expect(entry?.status).toBe('complete')
  })

  it('DAP archive entry exists and is complete', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'dap-archive-production-snapshot')
    expect(entry).toBeDefined()
    expect(entry?.status).toBe('complete')
  })

  it('DAP rebuild preparation entry exists and is in_progress', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'dap-rebuild-branch-preparation')
    expect(entry).toBeDefined()
    expect(entry?.status).toBe('in_progress')
  })

  it('archive entry verification is recorded_from_operator_report', () => {
    const entry = DAP_BUILD_LEDGER.find(e => e.id === 'dap-archive-production-snapshot')!
    expect(entry.verification).toBe('recorded_from_operator_report')
  })

  it('getLedgerByStatus returns only matching entries', () => {
    const complete = getLedgerByStatus('complete')
    expect(complete.every(e => e.status === 'complete')).toBe(true)
    expect(complete.length).toBe(getCompletedCount())
  })

  it('getLatestLedgerEntry returns the last entry', () => {
    const last = getLatestLedgerEntry()
    expect(last.id).toBe(DAP_BUILD_LEDGER[DAP_BUILD_LEDGER.length - 1].id)
  })
})

// ─── Group 5: Source file integrity ───────────────────────────────────────────

describe('Group 5 — Source file integrity', () => {
  it('dapBuildLedger.ts exports DAP_BUILD_LEDGER', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapBuildLedger.ts'), 'utf8')
    expect(src).toContain('DAP_BUILD_LEDGER')
  })

  it('dapBuildLedger.ts exports DapBuildVerification type', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapBuildLedger.ts'), 'utf8')
    expect(src).toContain('DapBuildVerification')
  })

  it('dapBuildLedger.ts exports DapBuildEvidence type', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapBuildLedger.ts'), 'utf8')
    expect(src).toContain('DapBuildEvidence')
  })

  it('dapBuildLedger.ts has recorded_from_operator_report level', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapBuildLedger.ts'), 'utf8')
    expect(src).toContain('recorded_from_operator_report')
  })

  it('DapBuildLedgerPanel.tsx exists', () => {
    const src = readFileSync(
      resolve(ROOT, 'components/cb-control-center/DapBuildLedgerPanel.tsx'),
      'utf8'
    )
    expect(src).toContain('DapBuildLedgerPanel')
  })

  it('DapBuildLedgerPanel.tsx contains Operator Updated label', () => {
    const src = readFileSync(
      resolve(ROOT, 'components/cb-control-center/DapBuildLedgerPanel.tsx'),
      'utf8'
    )
    expect(src).toContain('Operator Updated')
  })

  it('DapBuildLedgerPanel.tsx contains Not live synced disclaimer', () => {
    const src = readFileSync(
      resolve(ROOT, 'components/cb-control-center/DapBuildLedgerPanel.tsx'),
      'utf8'
    )
    expect(src).toContain('Not live synced')
  })

  it('build page imports DapBuildLedgerPanel', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).toContain('DapBuildLedgerPanel')
  })

  it('build page still imports SimulationShell', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).toContain('SimulationShell')
  })
})

// ─── Group 6: Display component renders correctly ─────────────────────────────

describe('Group 6 — Display component renders correctly', () => {
  function render() {
    return renderToString(React.createElement(DapBuildLedgerPanel))
  }

  it('renders without throwing', () => {
    expect(() => render()).not.toThrow()
  })

  it('has data-dap-build-ledger attribute', () => {
    expect(render()).toContain('data-dap-build-ledger')
  })

  it('renders Operator Updated badge', () => {
    expect(render()).toContain('Operator Updated')
  })

  it('renders Not live synced', () => {
    expect(render()).toContain('Not live synced')
  })

  it('renders data-ledger-mode-badge', () => {
    expect(render()).toContain('data-ledger-mode-badge')
  })

  it('renders at least one complete entry', () => {
    expect(render()).toContain('Complete')
  })

  it('renders at least one in-progress entry', () => {
    expect(render()).toContain('In Progress')
  })

  it('renders all ledger entry ids as data attributes', () => {
    const html = render()
    for (const entry of DAP_BUILD_LEDGER) {
      expect(html, `should render data-ledger-entry="${entry.id}"`).toContain(
        `data-ledger-entry="${entry.id}"`
      )
    }
  })

  it('renders test suite passing counts', () => {
    const html = render()
    expect(html).toContain('74 passing')
    expect(html).toContain('243 passing')
    expect(html).toContain('277 passing')
  })

  it('does not claim to be auto-synced or real-time', () => {
    const html = render()
    expect(html).not.toContain('auto-synced')
    expect(html).not.toContain('real-time')
    expect(html).not.toContain('automatically updated')
  })
})
