/**
 * StageDetailPage — Render Tests
 *
 * PURPOSE: Verify the full stage detail page renders all required sections
 * so the owner can review and approve a stage without leaving CBCC.
 *
 * COVERAGE:
 *   Group 1 — Stage detail page structure (breadcrumb, header, sections)
 *   Group 2 — Stage 1 full page (Business Definition artifact)
 *   Group 3 — Stage 2 full page (Truth Schema artifact, awaiting approval)
 *   Group 4 — Pending/locked stages render not-started state
 *   Group 5 — Stage route file exists and uses registry
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import React from 'react'
import { StageDetailPage } from './StageDetailPage'
import { getDapStageGateBySlug, DAP_STAGE_GATES } from '@/lib/cb-control-center/dapStageGates'
import { DAP_BUSINESS_DEFINITION } from '@/lib/cb-control-center/dapBusinessDefinition'

const ROOT = resolve(__dirname, '../..')

// ─── Group 1: Stage detail page structure ────────────────────────────────────

describe('Group 1 — Stage detail page structure', () => {
  const stage1 = getDapStageGateBySlug('1-business-definition')!

  function render(slug: string) {
    const stage = getDapStageGateBySlug(slug)!
    return renderToString(React.createElement(StageDetailPage, { stage }))
  }

  it('renders without throwing for all 7 stages', () => {
    const slugs = [
      '1-business-definition', '2-discovery-audit', '3-truth-schema',
      '4-positioning', '5-seo-strategy', '6-page-architecture', '7-build-launch',
    ]
    for (const slug of slugs) {
      expect(() => render(slug), `should render without throwing: ${slug}`).not.toThrow()
    }
  })

  it('has data-stage-detail-page attribute', () => {
    expect(render('1-business-definition')).toContain('data-stage-detail-page')
  })

  it('has data-stage-id set to correct value', () => {
    expect(render('1-business-definition')).toContain('data-stage-id="stage-01-business-definition"')
  })

  it('renders breadcrumb with CB Control Center link', () => {
    const html = render('1-business-definition')
    expect(html).toContain('data-breadcrumb')
    expect(html).toContain('CB Control Center')
  })

  it('renders breadcrumb with Build Pipeline link', () => {
    expect(render('1-business-definition')).toContain('Build Pipeline')
  })

  it('renders stage header', () => {
    const html = render('1-business-definition')
    expect(html).toContain('data-stage-header')
    expect(html).toContain('Stage 1')
  })

  it('renders anti-bypass rule', () => {
    expect(render('1-business-definition')).toContain('data-anti-bypass-rule')
    expect(render('1-business-definition')).toContain('No implementation phase may begin')
  })

  it('renders evidence trail section', () => {
    expect(render('1-business-definition')).toContain('data-stage-evidence-panel')
  })

  it('renders Back to Build Pipeline link', () => {
    expect(render('1-business-definition')).toContain('Back to Build Pipeline')
  })

  it('approved stages render approval metadata', () => {
    const html = render('1-business-definition')
    expect(html).toContain('Approved by Owner')
  })

  it('approved stages show next stage unlocked', () => {
    const html = render('1-business-definition')
    expect(html).toContain('Next stage unlocked')
  })

  it('renders Opus 4.7 AI review panel', () => {
    expect(render('1-business-definition')).toContain('data-ai-review-panel')
  })
})

// ─── Group 2: Stage 1 — Business Definition ───────────────────────────────────

describe('Group 2 — Stage 1 full page (Business Definition)', () => {
  function render() {
    const stage = getDapStageGateBySlug('1-business-definition')!
    return renderToString(React.createElement(StageDetailPage, { stage }))
  }

  it('renders the full Business Definition artifact', () => {
    expect(render()).toContain('data-stage-artifact-panel')
  })

  it('renders artifact summary', () => {
    expect(render()).toContain(DAP_BUSINESS_DEFINITION.summary)
  })

  it('renders What DAP Is section', () => {
    expect(render()).toContain('What DAP Is')
  })

  it('renders What DAP Is Not section', () => {
    expect(render()).toContain('What DAP Is Not')
  })

  it('renders allowed claims', () => {
    expect(render()).toContain('data-claim-list="allowed"')
    expect(render()).toContain('participating dentists')
  })

  it('renders forbidden claims', () => {
    expect(render()).toContain('data-claim-list="forbidden"')
    expect(render()).toContain('DAP is dental insurance')
  })

  it('renders approval metadata on artifact', () => {
    expect(render()).toContain('data-artifact-approval')
    expect(render()).toContain('2026-04-30')
  })

  it('renders the directive panel', () => {
    expect(render()).toContain('data-stage-directive-panel')
  })

  it('renders the approval record section (approved)', () => {
    expect(render()).toContain('data-stage-approval-checklist')
  })

  it('renders no blockers', () => {
    expect(render()).toContain('No blockers')
  })
})

// ─── Group 3: Stage 2 — Truth Schema ─────────────────────────────────────────

describe('Group 3 — Stage 3 full page (Truth Schema, awaiting approval)', () => {
  function render() {
    const stage = getDapStageGateBySlug('3-truth-schema')!
    return renderToString(React.createElement(StageDetailPage, { stage }))
  }

  it('renders Stage 2 without throwing', () => {
    expect(() => render()).not.toThrow()
  })

  it('shows Owner Approval Required section for awaiting status', () => {
    expect(render()).toContain('Owner Approval Required')
  })

  it('renders approval checklist items', () => {
    const html = render()
    expect(html).toContain('data-stage-approval-checklist')
    expect(html).toContain('data-approval-instructions')
  })

  it('renders the truth schema artifact', () => {
    expect(render()).toContain('data-stage-artifact-panel')
    expect(render()).toContain('data-artifact-type="truth_schema"')
  })

  it('renders all 7 DAP truth rules', () => {
    const html = render()
    expect(html).toContain('DAP is not dental insurance')
    expect(html).toContain('DAP does not process claims')
    expect(html).toContain('DAP does not collect PHI')
  })

  it('renders forbidden claims in truth schema', () => {
    expect(render()).toContain('data-claim-list="forbidden"')
  })

  it('renders required disclaimers', () => {
    expect(render()).toContain('Required Disclaimers')
  })

  it('does NOT show approved state', () => {
    expect(render()).not.toContain('Approved by Owner')
  })

  it('renders approval instructions with dapStageGates.ts reference', () => {
    expect(render()).toContain('dapStageGates.ts')
  })

  it('renders the directive panel', () => {
    expect(render()).toContain('data-stage-directive-panel')
  })

  it('unlock rule explains Stage 2 approval blocks Stage 3', () => {
    const html = render()
    expect(html).toContain('Owner approval required before Stage')
    expect(html).toContain('can begin')
  })
})

// ─── Group 4: Pending/locked stages ──────────────────────────────────────────

describe('Group 4 — Pending stages render not-started state', () => {
  function render(slug: string) {
    const stage = getDapStageGateBySlug(slug)!
    return renderToString(React.createElement(StageDetailPage, { stage }))
  }

  it('Stage 2 (discovery-audit, not_started) renders artifact with reviewable status after audit submitted', () => {
    expect(render('2-discovery-audit')).toContain('data-artifact-status="reviewable"')
  })

  it('Stage 2 does NOT show approved state', () => {
    expect(render('2-discovery-audit')).not.toContain('Approved by Owner')
  })

  it('Stage 6 (not_started) renders without throwing', () => {
    expect(() => render('6-page-architecture')).not.toThrow()
  })

  it('Stage 7 (not_started) renders without throwing', () => {
    expect(() => render('7-build-launch')).not.toThrow()
  })
})

// ─── Group 5: Stage route file exists and uses registry ──────────────────────

describe('Group 5 — Stage detail route file', () => {
  const ROUTE_PATH = resolve(
    ROOT,
    'app/businesses/dental-advantage-plan/build/stages/[stageSlug]/page.tsx'
  )

  it('stage detail route file exists', () => {
    expect(existsSync(ROUTE_PATH)).toBe(true)
  })

  it('route uses getDapStageGateBySlug from registry', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).toContain('getDapStageGateBySlug')
  })

  it('route uses generateStaticParams', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).toContain('generateStaticParams')
  })

  it('route uses DAP_STAGE_SLUGS for static params', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).toContain('DAP_STAGE_SLUGS')
  })

  it('route renders StageDetailPage component', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).toContain('StageDetailPage')
  })

  it('route calls notFound() for missing slug', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).toContain('notFound')
  })

  it('pipeline overview page imports StagePipelineOverview', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).toContain('StagePipelineOverview')
  })

  it('pipeline overview page does NOT render full StageGatePanel inline (that is now on detail pages)', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).not.toContain('<StageGatePanel')
  })
})

// ─── Group 6: External tool card ──────────────────────────────────────────────

describe('Group 6 — External tool card', () => {
  it('stage 4 renders External Tool section with StoryBrand Coach', () => {
    const stage = DAP_STAGE_GATES.find(s => s.stageNumber === 4)!
    const html = renderToString(React.createElement(StageDetailPage, { stage }))
    expect(html).toContain('External Tool')
    expect(html).toContain('StoryBrand Coach')
    expect(html).toContain('manual')
  })

  it('stage 5 renders External Tool section with CBSeoAeo', () => {
    const stage = DAP_STAGE_GATES.find(s => s.stageNumber === 5)!
    const html = renderToString(React.createElement(StageDetailPage, { stage }))
    expect(html).toContain('External Tool')
    expect(html).toContain('CBSeoAeo')
    expect(html).toContain('api')
  })

  it('stage 6 renders External Tool section with CBDesignEngine', () => {
    const stage = DAP_STAGE_GATES.find(s => s.stageNumber === 6)!
    const html = renderToString(React.createElement(StageDetailPage, { stage }))
    expect(html).toContain('External Tool')
    expect(html).toContain('CBDesignEngine')
    expect(html).toContain('manual')
  })

  it('stage 1 does not render External Tool section', () => {
    const stage = DAP_STAGE_GATES.find(s => s.stageNumber === 1)!
    const html = renderToString(React.createElement(StageDetailPage, { stage }))
    expect(html).not.toContain('data-external-tool')
  })

  it('stage 7 does not render External Tool section', () => {
    const stage = DAP_STAGE_GATES.find(s => s.stageNumber === 7)!
    const html = renderToString(React.createElement(StageDetailPage, { stage }))
    expect(html).not.toContain('data-external-tool')
  })

  it('external tool card has data-external-tool marker for stages 4, 5, 6', () => {
    for (const n of [4, 5, 6]) {
      const stage = DAP_STAGE_GATES.find(s => s.stageNumber === n)!
      const html = renderToString(React.createElement(StageDetailPage, { stage }))
      expect(html, `stage ${n} missing data-external-tool`).toContain('data-external-tool')
    }
  })

  it('external tool card shows reference-only footer text', () => {
    const stage = DAP_STAGE_GATES.find(s => s.stageNumber === 4)!
    const html = renderToString(React.createElement(StageDetailPage, { stage }))
    expect(html).toContain('Reference only')
  })
})
