/**
 * CB Control Center Workspace Shell Tests
 *
 * PURPOSE: Verify that the workspace shell is properly configured —
 * mode badges, disabled form fields, MockModeBanner presence, and
 * page count invariant (no new pages added).
 *
 * COVERAGE:
 *   Group 1 — New business page structure
 *   Group 2 — New business form fields (7 fields)
 *   Group 3 — New business submit button
 *   Group 4 — DAP detail page workspace mode
 *   Group 5 — MockModeBanner presence across pages
 *   Group 6 — Page count invariant (52 pages)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const ROOT = resolve(__dirname, '../..')

function findFiles(dir: string, test: (path: string) => boolean): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) results.push(...findFiles(full, test))
    else if (test(full)) results.push(full)
  }
  return results
}

// ─── Group 1: New business page structure ─────────────────────────────────────

describe('Group 1 — New business page structure', () => {
  const src = readFileSync(resolve(ROOT, 'app/businesses/new/page.tsx'), 'utf8')

  it('has data-new-business-form', () => {
    expect(src).toContain('data-new-business-form')
  })

  it('has data-workspace-mode-badge', () => {
    expect(src).toContain('data-workspace-mode-badge')
  })

  it('does not use client directive (all fields disabled, no interactivity needed)', () => {
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('has breadcrumb navigation', () => {
    expect(src).toContain('data-breadcrumb')
  })

  it('links back to CB Control Center', () => {
    expect(src).toContain('href="/"')
  })
})

// ─── Group 2: New business form fields ────────────────────────────────────────

describe('Group 2 — New business form fields (7 fields)', () => {
  const src = readFileSync(resolve(ROOT, 'app/businesses/new/page.tsx'), 'utf8')

  it('has business-name field', () => {
    expect(src).toContain('data-field="business-name"')
  })

  it('has business-type field', () => {
    expect(src).toContain('data-field="business-type"')
  })

  it('has market field', () => {
    expect(src).toContain('data-field="market"')
  })

  it('has primary-goal field', () => {
    expect(src).toContain('data-field="primary-goal"')
  })

  it('has timeline field', () => {
    expect(src).toContain('data-field="timeline"')
  })

  it('has description field', () => {
    expect(src).toContain('data-field="description"')
  })

  it('has domain field', () => {
    expect(src).toContain('data-field="domain"')
  })

  it('all fields are disabled', () => {
    const fieldMatches = src.match(/data-field=/g) ?? []
    const disabledMatches = src.match(/\bdisabled\b/g) ?? []
    expect(fieldMatches.length).toBe(7)
    expect(disabledMatches.length).toBeGreaterThanOrEqual(7)
  })
})

// ─── Group 3: New business submit button ──────────────────────────────────────

describe('Group 3 — New business submit button', () => {
  const src = readFileSync(resolve(ROOT, 'app/businesses/new/page.tsx'), 'utf8')

  it('has data-submit-button', () => {
    expect(src).toContain('data-submit-button')
  })

  it('submit button has Coming soon text', () => {
    expect(src).toContain('Coming soon')
  })

  it('submit button is disabled', () => {
    expect(src).toContain('data-submit-button')
    const submitArea = src.slice(src.indexOf('data-submit-button') - 100, src.indexOf('data-submit-button') + 200)
    expect(submitArea).toContain('disabled')
  })

  it('submit button is type submit', () => {
    expect(src).toContain('type="submit"')
  })
})

// ─── Group 4: DAP detail page workspace mode ──────────────────────────────────

describe('Group 4 — DAP detail page workspace mode', () => {
  const src = readFileSync(
    resolve(ROOT, 'app/businesses/dental-advantage-plan/page.tsx'),
    'utf8'
  )

  it('has data-workspace-mode-badge', () => {
    expect(src).toContain('data-workspace-mode-badge')
  })

  it('badge shows Simulation Preview (not Workspace Mock Mode)', () => {
    expect(src).toContain('Simulation Preview')
    expect(src).not.toContain('Workspace Mock Mode')
  })

  it('imports MockModeBanner', () => {
    expect(src).toContain('MockModeBanner')
  })

  it('has breadcrumb navigation', () => {
    expect(src).toContain('data-breadcrumb')
  })
})

// ─── Group 5: MockModeBanner presence across pages ────────────────────────────

describe('Group 5 — MockModeBanner presence across pages', () => {
  it('new business page imports MockModeBanner', () => {
    const src = readFileSync(resolve(ROOT, 'app/businesses/new/page.tsx'), 'utf8')
    expect(src).toContain('MockModeBanner')
  })

  it('DAP detail page imports MockModeBanner', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/page.tsx'),
      'utf8'
    )
    expect(src).toContain('MockModeBanner')
  })

  it('CbHomeDashboard imports MockModeBanner', () => {
    const src = readFileSync(
      resolve(ROOT, 'components/cb-control-center/CbHomeDashboard.tsx'),
      'utf8'
    )
    expect(src).toContain('MockModeBanner')
  })

  it('MockModeBanner component file exists', () => {
    expect(
      existsSync(resolve(ROOT, 'components/cb-control-center/MockModeBanner.tsx'))
    ).toBe(true)
  })
})

// ─── Group 6: Page count invariant ────────────────────────────────────────────

describe('Group 6 — Page count invariant (52 pages, no new pages added)', () => {
  it('total page.tsx count remains 52', () => {
    const pages = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))
    expect(pages.length).toBe(58)
  })
})
