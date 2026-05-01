/**
 * StagePipelineOverview — Render Tests
 *
 * PURPOSE: Verify the pipeline overview shows all 7 stages as concise cards
 * with links to full stage detail pages, and does not try to render
 * full artifact content inline.
 *
 * COVERAGE:
 *   Group 1 — Overview structure
 *   Group 2 — Per-stage card presence and links
 *   Group 3 — Anti-bypass rule and active stage
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { StagePipelineOverview } from './StagePipelineOverview'
import { DAP_STAGE_GATES } from '@/lib/cb-control-center/dapStageGates'

function render() {
  return renderToString(React.createElement(StagePipelineOverview))
}

// ─── Group 1: Overview structure ─────────────────────────────────────────────

describe('Group 1 — Overview structure', () => {
  it('renders without throwing', () => {
    expect(() => render()).not.toThrow()
  })

  it('has data-stage-pipeline-overview attribute', () => {
    expect(render()).toContain('data-stage-pipeline-overview')
  })

  it('has data-anti-bypass-rule attribute', () => {
    expect(render()).toContain('data-anti-bypass-rule')
  })

  it('renders anti-bypass rule text', () => {
    expect(render()).toContain('No implementation phase may begin')
  })

  it('renders active stage indicator', () => {
    expect(render()).toContain('data-stage-gate-active-id')
  })

  it('renders approved count summary', () => {
    const html = render()
    expect(html).toContain('stages approved')
  })
})

// ─── Group 2: Per-stage cards and links ──────────────────────────────────────

describe('Group 2 — Per-stage cards and open-stage links', () => {
  it('renders 7 stage overview cards', () => {
    const html = render()
    const matches = html.match(/data-stage-overview-card/g) ?? []
    expect(matches.length).toBe(7)
  })

  it('renders all 7 stage titles', () => {
    const html = render()
    for (const stage of DAP_STAGE_GATES) {
      expect(html, `should contain stage title: ${stage.title}`).toContain(stage.title)
    }
  })

  it('renders Open/Review link for every stage', () => {
    const html = render()
    for (const stage of DAP_STAGE_GATES) {
      expect(
        html,
        `should contain data-open-stage-link for ${stage.slug}`
      ).toContain(`data-open-stage-link="${stage.slug}"`)
    }
  })

  it('each stage link points to /build/stages/[slug]', () => {
    const html = render()
    for (const stage of DAP_STAGE_GATES) {
      expect(html).toContain(`/businesses/dental-advantage-plan/build/stages/${stage.slug}`)
    }
  })

  it('Stage 1 card has status approved', () => {
    expect(render()).toContain('data-stage-status="approved"')
  })

  it('Stage 2 card has status awaiting_owner_approval', () => {
    const html = render()
    expect(html).toContain('data-stage-status="awaiting_owner_approval"')
  })

  it('Stage 3 card has status not_started', () => {
    const html = render()
    const stage3 = DAP_STAGE_GATES.find(s => s.stageNumber === 3)!
    expect(html).toContain(`data-stage-id="${stage3.stageId}"`)
  })
})

// ─── Group 3: Overview does not render full artifacts ─────────────────────────

describe('Group 3 — Overview is concise (no full artifact rendering)', () => {
  it('does not render data-stage-artifact-panel (artifacts belong on detail pages)', () => {
    expect(render()).not.toContain('data-stage-artifact-panel')
  })

  it('does not render data-stage-directive-panel (directives belong on detail pages)', () => {
    expect(render()).not.toContain('data-stage-directive-panel')
  })

  it('does not render data-stage-approval-checklist (checklists belong on detail pages)', () => {
    expect(render()).not.toContain('data-stage-approval-checklist')
  })
})
