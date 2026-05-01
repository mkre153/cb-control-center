/**
 * StageArtifactPanel — Render Tests
 *
 * PURPOSE: Verify the artifact panel renders the correct content so
 * the owner can inspect the artifact before approving a stage.
 *
 * COVERAGE:
 *   Group 1 — Business definition artifact renders correctly
 *   Group 2 — Approval metadata renders correctly
 *   Group 3 — Forbidden claims are visible
 *   Group 4 — StageGatePanel renders artifact for Stage 1
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { StageArtifactPanel } from './StageArtifactPanel'
import { StageGatePanel } from './StageGatePanel'
import { DAP_BUSINESS_DEFINITION } from '@/lib/cb-control-center/dapBusinessDefinition'

// ─── Group 1: Business definition artifact renders correctly ──────────────────

describe('Group 1 — Business definition artifact renders correctly', () => {
  function render() {
    return renderToString(React.createElement(StageArtifactPanel, { artifact: DAP_BUSINESS_DEFINITION }))
  }

  it('renders without throwing', () => {
    expect(() => render()).not.toThrow()
  })

  it('has data-stage-artifact-panel attribute', () => {
    expect(render()).toContain('data-stage-artifact-panel')
  })

  it('has data-artifact-type="business_definition"', () => {
    expect(render()).toContain('data-artifact-type="business_definition"')
  })

  it('renders artifact title', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.title)
  })

  it('renders artifact summary', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.summary)
  })

  it('has data-artifact-summary attribute', () => {
    expect(render()).toContain('data-artifact-summary')
  })

  it('renders business name', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.businessName)
  })

  it('renders parent company', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.parentCompany)
  })

  it('renders What DAP Is section', () => {
    const html = render()
    expect(html).toContain('What DAP Is')
    expect(html).toContain('registry')
  })

  it('renders What DAP Is Not section', () => {
    const html = render()
    expect(html).toContain('What DAP Is Not')
    expect(html).toContain('not dental insurance')
  })

  it('renders primary customer', () => {
    expect(render()).toContain('without dental insurance')
  })

  it('renders primary conversion goal', () => {
    expect(render()).toContain('search')
  })

  it('has data-claim-list="allowed"', () => {
    expect(render()).toContain('data-claim-list="allowed"')
  })

  it('has data-claim-list="forbidden"', () => {
    expect(render()).toContain('data-claim-list="forbidden"')
  })

  it('renders at least one allowed claim', () => {
    expect(render()).toContain('participating dentists')
  })

  it('renders at least one forbidden claim', () => {
    expect(render()).toContain('DAP is dental insurance')
  })

  it('renders source files', () => {
    expect(render()).toContain('dapBusinessDefinition.ts')
  })

  it('renders truth rules section', () => {
    const html = render()
    expect(html).toContain('Truth Rules')
    expect(html).toContain('PHI')
  })
})

// ─── Group 2: Approval metadata ───────────────────────────────────────────────

describe('Group 2 — Approval metadata renders correctly', () => {
  function render() {
    return renderToString(React.createElement(StageArtifactPanel, { artifact: DAP_BUSINESS_DEFINITION }))
  }

  it('has data-artifact-approval attribute', () => {
    expect(render()).toContain('data-artifact-approval')
  })

  it('renders approvedBy', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.approvedBy)
  })

  it('renders approvedAt date', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.approvedAt)
  })

  it('artifact status badge shows Approved', () => {
    const html = render()
    expect(html).toContain('data-artifact-status-badge')
    expect(html).toContain('Approved')
  })

  it('artifact status is set on the panel element', () => {
    expect(render()).toContain('data-artifact-status="approved"')
  })
})

// ─── Group 3: Forbidden claims are visible ────────────────────────────────────

describe('Group 3 — Forbidden claims are visible (no dangerous copy in the UI)', () => {
  function render() {
    return renderToString(React.createElement(StageArtifactPanel, { artifact: DAP_BUSINESS_DEFINITION }))
  }

  it('renders "DAP guarantees savings" as a forbidden claim (so owner sees it)', () => {
    expect(render()).toContain('DAP guarantees savings')
  })

  it('renders "DAP pays claims" as a forbidden claim', () => {
    expect(render()).toContain('DAP pays claims')
  })

  it('renders "DAP provides dental coverage" as a forbidden claim', () => {
    expect(render()).toContain('DAP provides dental coverage')
  })

  it('renders "DAP is accepted everywhere" as a forbidden claim', () => {
    expect(render()).toContain('DAP is accepted everywhere')
  })

  it('DAP_BUSINESS_DEFINITION allowed claims do not contain any forbidden phrases', () => {
    const text = DAP_BUSINESS_DEFINITION.allowedClaims.join(' ')
    expect(text).not.toContain('guaranteed savings')
    expect(text).not.toContain('dental coverage')
    expect(text).not.toContain('insurance alternative')
    expect(text).not.toContain('replace dental insurance')
  })
})

// ─── Group 4: StageGatePanel renders artifact for Stage 1 ────────────────────

describe('Group 4 — StageGatePanel renders artifact for Stage 1', () => {
  function render() {
    return renderToString(React.createElement(StageGatePanel))
  }

  it('StageGatePanel renders without throwing', () => {
    expect(() => render()).not.toThrow()
  })

  it('StageGatePanel renders data-stage-artifact-panel', () => {
    expect(render()).toContain('data-stage-artifact-panel')
  })

  it('StageGatePanel renders artifact summary', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.summary)
  })

  it('StageGatePanel renders at least one allowed claim', () => {
    expect(render()).toContain('participating dentists')
  })

  it('StageGatePanel renders at least one forbidden claim', () => {
    expect(render()).toContain('DAP is dental insurance')
  })

  it('StageGatePanel renders truth rules', () => {
    expect(render()).toContain('PHI')
  })

  it('StageGatePanel renders source files', () => {
    expect(render()).toContain('dapBusinessDefinition.ts')
  })

  it('StageGatePanel renders approval metadata for Stage 1', () => {
    expect(render()).toContain('data-artifact-approval')
    expect(render()).toContain('2026-04-30')
  })
})
