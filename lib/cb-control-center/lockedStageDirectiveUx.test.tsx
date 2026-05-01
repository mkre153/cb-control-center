/**
 * Locked-stage directive UX
 *
 * When a stage has unresolved blockers, the Claude Directive section must be
 * unmistakably labeled as a preview — directive content stays visible (for
 * transparency / planning), but the section title, warning banner, and helper
 * line all flip to make the locked state obvious and discourage social-bypass
 * copy-paste into Claude Code.
 *
 * Approved / awaiting-approval / no-blocker stages must keep the original UX.
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'

import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'
import { StageDirectivePanel } from '@/components/cb-control-center/StageDirectivePanel'
import {
  DAP_STAGE_GATES,
  type DapStageGate,
} from './dapStageGates'

function findStage(stageNumber: number): DapStageGate {
  const s = DAP_STAGE_GATES.find(g => g.stageNumber === stageNumber)
  if (!s) throw new Error(`stage ${stageNumber} missing from DAP_STAGE_GATES`)
  return s
}

function render(stage: DapStageGate): string {
  return renderToString(
    React.createElement(StageDetailPage, {
      stage,
      breadcrumbBase: '/businesses/dental-advantage-plan/build',
    }),
  )
}

// Strip React's HTML comment markers so substring assertions don't get
// tripped by `<!-- -->` injected between text and expressions.
function clean(html: string): string {
  return html.replace(/<!--\s*-->/g, '')
}

// ─── Locked stages ────────────────────────────────────────────────────────────
//
// Stage 7 (Build / QA / Launch) is the canonical locked stage in v1: it has a
// non-empty directive AND a non-empty blockers array.

describe('locked stage directive UX — Stage 7 (blockers present, directive present)', () => {
  const stage = findStage(7)
  const html = clean(render(stage))

  it('precondition: stage has at least one blocker', () => {
    expect(stage.blockers.length).toBeGreaterThan(0)
  })

  it('precondition: stage has a non-empty directive', () => {
    expect(stage.directive.trim().length).toBeGreaterThan(0)
  })

  it('section title reads "Directive Preview — Locked"', () => {
    expect(html).toContain('Directive Preview — Locked')
  })

  it('does NOT use the unlocked title "Claude Directive"', () => {
    expect(html).not.toContain('>Claude Directive<')
  })

  it('renders the locked-state warning banner above the directive', () => {
    expect(html).toContain('data-locked-directive-warning')
    expect(html).toMatch(
      /This directive is visible for planning only\. It is not authorized for execution until all blockers are cleared and the prior stage is owner-approved\./,
    )
  })

  it('renders the locked-state helper line under the directive', () => {
    expect(html).toContain('data-stage-directive-helper="locked"')
    expect(html).toContain('Do not copy this directive into Claude Code yet.')
  })

  it('does NOT render the unlocked helper line', () => {
    expect(html).not.toContain('data-stage-directive-helper="unlocked"')
    expect(html).not.toContain('Copy the directive above into Claude Code to issue or continue this stage.')
  })

  it('keeps the directive content itself visible (transparency rule)', () => {
    expect(html).toContain('data-stage-directive-panel')
    expect(html).toContain('data-stage-directive-locked="true"')
    // First marker line of the Stage 7 directive.
    expect(html).toContain('Stage 7 — Build / QA / Launch')
  })
})

// ─── Unlocked / approved / awaiting stages — UX unchanged ─────────────────────

describe('non-locked stage directive UX — unchanged behavior', () => {
  it('Stage 1 (approved, no blockers, has directive) renders the original "Claude Directive" title', () => {
    const stage = findStage(1)
    expect(stage.blockers.length).toBe(0)
    expect(stage.directive.trim().length).toBeGreaterThan(0)
    const html = clean(render(stage))
    expect(html).toContain('>Claude Directive<')
    expect(html).not.toContain('Directive Preview — Locked')
    expect(html).not.toContain('data-locked-directive-warning')
    expect(html).toContain('data-stage-directive-helper="unlocked"')
    expect(html).toContain('Copy the directive above into Claude Code to issue or continue this stage.')
  })

  it('Stage 3 (awaiting_owner_approval, no blockers, has directive) renders the original UX', () => {
    const stage = findStage(3)
    expect(stage.status).toBe('awaiting_owner_approval')
    expect(stage.blockers.length).toBe(0)
    const html = clean(render(stage))
    expect(html).toContain('>Claude Directive<')
    expect(html).not.toContain('Directive Preview — Locked')
    expect(html).not.toContain('data-locked-directive-warning')
    expect(html).toContain('data-stage-directive-helper="unlocked"')
  })
})

// ─── StageDirectivePanel unit-level ───────────────────────────────────────────

describe('StageDirectivePanel — locked prop drives helper copy + data attr', () => {
  it('locked=false (default) renders the original helper', () => {
    const html = renderToString(
      React.createElement(StageDirectivePanel, {
        directive: 'do the thing',
        stageId: 'stage-x',
      }),
    )
    expect(html).toContain('data-stage-directive-locked="false"')
    expect(html).toContain('data-stage-directive-helper="unlocked"')
    expect(html).toContain('Copy the directive above into Claude Code')
  })

  it('locked=true swaps helper to the locked copy', () => {
    const html = renderToString(
      React.createElement(StageDirectivePanel, {
        directive: 'do the thing',
        stageId: 'stage-x',
        locked: true,
      }),
    )
    expect(html).toContain('data-stage-directive-locked="true"')
    expect(html).toContain('data-stage-directive-helper="locked"')
    expect(html).toContain('Do not copy this directive into Claude Code yet.')
    expect(html).not.toContain('Copy the directive above into Claude Code to issue or continue this stage.')
  })

  it('returns null for empty directive regardless of locked', () => {
    const html = renderToString(
      React.createElement(StageDirectivePanel, {
        directive: '   ',
        stageId: 'stage-x',
        locked: true,
      }),
    )
    expect(html).toBe('')
  })
})

// ─── Sweep: every locked DAP stage with a directive flips to preview UX ───────

describe('locked stage directive UX — sweep across all DAP stages', () => {
  for (const stage of DAP_STAGE_GATES) {
    const isLocked = stage.blockers.length > 0
    const hasDirective = stage.directive.trim().length > 0
    if (!hasDirective) continue

    const expectation = isLocked ? 'locked preview UX' : 'unlocked UX'
    it(`Stage ${stage.stageNumber} (blockers=${stage.blockers.length}) → ${expectation}`, () => {
      const html = clean(render(stage))
      if (isLocked) {
        expect(html).toContain('Directive Preview — Locked')
        expect(html).toContain('data-locked-directive-warning')
        expect(html).toContain('data-stage-directive-helper="locked"')
      } else {
        expect(html).toContain('>Claude Directive<')
        expect(html).not.toContain('Directive Preview — Locked')
        expect(html).toContain('data-stage-directive-helper="unlocked"')
      }
    })
  }
})
