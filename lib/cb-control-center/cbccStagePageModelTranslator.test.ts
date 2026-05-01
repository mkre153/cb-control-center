import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'

import {
  buildDapStageGateFromEngine,
  TRANSLATOR_DAP_PROJECT_ID,
} from './cbccStagePageModelTranslator'
import { DAP_BUSINESS_DEFINITION, DAP_PROJECT_ID, DAP_TRUTH_SCHEMA } from '@/lib/cbcc/adapters/dap'
import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'

describe('cbccStagePageModelTranslator — identity', () => {
  it('exports the canonical DAP project id', () => {
    expect(TRANSLATOR_DAP_PROJECT_ID).toBe(DAP_PROJECT_ID)
  })

  it('returns null for stage numbers outside 1..7', () => {
    expect(buildDapStageGateFromEngine(0)).toBeNull()
    expect(buildDapStageGateFromEngine(8)).toBeNull()
    expect(buildDapStageGateFromEngine(-1)).toBeNull()
  })
})

describe('cbccStagePageModelTranslator — Stage 1 (approved, has artifact)', () => {
  const gate = buildDapStageGateFromEngine(1)!

  it('produces a non-null gate', () => {
    expect(gate).not.toBeNull()
  })

  it('uses canonical title and stage number', () => {
    expect(gate.stageNumber).toBe(1)
    expect(gate.title).toMatch(/Stage 1 — Business Intake/i)
  })

  it('flags approved + nextStageUnlocked', () => {
    expect(gate.status).toBe('approved')
    expect(gate.approvedByOwner).toBe(true)
    expect(gate.approvedAt).toBeTruthy()
    expect(gate.nextStageUnlocked).toBe(true)
  })

  it('attaches the business definition artifact', () => {
    expect(gate.artifact).toBe(DAP_BUSINESS_DEFINITION)
  })

  it('exposes purpose (whyItMatters) and requirements', () => {
    expect(gate.whyItMatters.length).toBeGreaterThan(0)
    expect(gate.requirements.length).toBeGreaterThan(0)
  })

  it('locked-state blockers are absent for approved stages', () => {
    expect(gate.blockers).toEqual([])
  })
})

describe('cbccStagePageModelTranslator — Stage 3 (locked behind Stage 2)', () => {
  const gate = buildDapStageGateFromEngine(3)!

  it('renders as not_started (locked)', () => {
    expect(gate.status).toBe('not_started')
    expect(gate.approvedByOwner).toBe(false)
    expect(gate.approvedAt).toBeNull()
  })

  it('attaches the truth schema artifact even while locked', () => {
    expect(gate.artifact).toBe(DAP_TRUTH_SCHEMA)
  })

  it('surfaces a blocker explaining the predecessor lock', () => {
    expect(gate.blockers.length).toBeGreaterThan(0)
    expect(gate.blockers.join(' ')).toMatch(/discovery|predecessor/i)
  })

  it('still has useful purpose + requirements content (locked stages are not empty)', () => {
    expect(gate.whyItMatters.length).toBeGreaterThan(0)
    expect(gate.requirements.length).toBeGreaterThan(0)
  })
})

describe('cbccStagePageModelTranslator — full 7-stage walkthrough', () => {
  for (let n = 1; n <= 7; n++) {
    const gate = buildDapStageGateFromEngine(n)!

    it(`Stage ${n} produces a non-null gate`, () => {
      expect(gate).not.toBeNull()
      expect(gate.stageNumber).toBe(n)
    })

    it(`Stage ${n} title starts with "Stage ${n} —"`, () => {
      expect(gate.title.startsWith(`Stage ${n} —`)).toBe(true)
    })

    it(`Stage ${n} has non-empty requirements + requiredApprovals`, () => {
      expect(gate.requirements.length).toBeGreaterThan(0)
      expect(gate.requiredApprovals.length).toBeGreaterThan(0)
    })

    it(`Stage ${n} carries an artifact (real or placeholder) for owner review context`, () => {
      expect(gate.artifact).toBeTruthy()
    })
  }
})

describe('cbccStagePageModelTranslator — renders inside <StageDetailPage>', () => {
  it('Stage 1 detail renders the canonical title, badge, and approved metadata', () => {
    const gate = buildDapStageGateFromEngine(1)!
    const html = renderToString(
      React.createElement(StageDetailPage, {
        stage: gate,
        breadcrumbBase: '/projects/dental-advantage-plan',
        breadcrumbTrail: [
          { label: 'CB Control Center', href: '/' },
          { label: 'Dental Advantage Plan', href: '/projects/dental-advantage-plan' },
          { label: 'Build Pipeline', href: '/projects/dental-advantage-plan' },
        ],
      }),
    )
    expect(html).toContain('Stage 1 — Business Intake / Definition')
    expect(html).toContain('Approved')
    expect(html).toContain('data-anti-bypass-rule')
  })

  it('Stage 3 (locked) detail still renders purpose + artifact + blockers sections', () => {
    const gate = buildDapStageGateFromEngine(3)!
    const html = renderToString(
      React.createElement(StageDetailPage, {
        stage: gate,
        breadcrumbBase: '/projects/dental-advantage-plan',
        breadcrumbTrail: [
          { label: 'CB Control Center', href: '/' },
          { label: 'Dental Advantage Plan', href: '/projects/dental-advantage-plan' },
          { label: 'Build Pipeline', href: '/projects/dental-advantage-plan' },
        ],
      }),
    )
    expect(html).toMatch(/Stage 3 — Truth Schema/i)
    expect(html).toMatch(/Why this stage matters/i)
    expect(html).toMatch(/Blockers \/ Dependencies/i)
    // Truth schema artifact body should render
    expect(html).toContain('truth_schema')
  })
})
