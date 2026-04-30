/**
 * Phase 17B — CB Control Center Home Dashboard
 *
 * PURPOSE: Verify the business portfolio data model and home dashboard component
 * are correct, and that the navigation architecture reflects the correct
 * parent-child structure: CB Control Center → Business/Market → Build Pipeline.
 *
 * COVERAGE:
 *   Group 1 — Portfolio data model integrity
 *   Group 2 — Required businesses present
 *   Group 3 — New business action
 *   Group 4 — Navigation architecture (route files + import structure)
 *   Group 5 — Safety (no forbidden terms in new files)
 *   Group 6 — CbHomeDashboard renders correctly
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import React from 'react'
import { CB_BUSINESS_PORTFOLIO } from './cbBusinessPortfolioData'
import { CbHomeDashboard } from '@/components/cb-control-center/CbHomeDashboard'

const ROOT = resolve(__dirname, '../..')

// ─── Group 1: Portfolio data model integrity ──────────────────────────────────

describe('Group 1 — Portfolio data model', () => {
  it('portfolio has at least 2 businesses', () => {
    expect(CB_BUSINESS_PORTFOLIO.businesses.length).toBeGreaterThanOrEqual(2)
  })

  it('all businesses have required non-empty fields', () => {
    for (const b of CB_BUSINESS_PORTFOLIO.businesses) {
      expect(b.slug, `${b.slug} missing slug`).toBeTruthy()
      expect(b.name, `${b.slug} missing name`).toBeTruthy()
      expect(b.description, `${b.slug} missing description`).toBeTruthy()
      expect(b.category, `${b.slug} missing category`).toBeTruthy()
      expect(b.status, `${b.slug} missing status`).toBeTruthy()
      expect(b.statusLabel, `${b.slug} missing statusLabel`).toBeTruthy()
      expect(b.nextAction, `${b.slug} missing nextAction`).toBeTruthy()
      expect(b.detailPath, `${b.slug} missing detailPath`).toBeTruthy()
    }
  })

  it('all business slugs are unique', () => {
    const slugs = CB_BUSINESS_PORTFOLIO.businesses.map(b => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all detailPaths follow /businesses/[slug] pattern', () => {
    for (const b of CB_BUSINESS_PORTFOLIO.businesses) {
      expect(b.detailPath).toBe(`/businesses/${b.slug}`)
    }
  })

  it('all non-null buildPaths follow /businesses/[slug]/build pattern', () => {
    for (const b of CB_BUSINESS_PORTFOLIO.businesses) {
      if (b.buildPath !== null) {
        expect(b.buildPath).toBe(`/businesses/${b.slug}/build`)
      }
    }
  })

  it('readinessPercent is null or a number in [0, 100]', () => {
    for (const b of CB_BUSINESS_PORTFOLIO.businesses) {
      if (b.readinessPercent !== null) {
        expect(b.readinessPercent).toBeGreaterThanOrEqual(0)
        expect(b.readinessPercent).toBeLessThanOrEqual(100)
      }
    }
  })
})

// ─── Group 2: Required businesses present ─────────────────────────────────────

describe('Group 2 — Required businesses present', () => {
  it('Dental Advantage Plan is present', () => {
    const dap = CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'dental-advantage-plan')
    expect(dap).toBeDefined()
  })

  it('DAP status is blocked', () => {
    const dap = CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'dental-advantage-plan')
    expect(dap?.status).toBe('blocked')
  })

  it('DAP has a buildPath pointing to the build pipeline route', () => {
    const dap = CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'dental-advantage-plan')
    expect(dap?.buildPath).toBe('/businesses/dental-advantage-plan/build')
  })

  it('Client Builder Pro is present', () => {
    const cbp = CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'client-builder-pro')
    expect(cbp).toBeDefined()
  })

  it('RenuGut is present', () => {
    expect(CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'renu-gut')).toBeDefined()
  })

  it('POCONS USA is present', () => {
    expect(CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'pocons-usa')).toBeDefined()
  })

  it('AI Digital Staffing is present', () => {
    expect(
      CB_BUSINESS_PORTFOLIO.businesses.find(b => b.slug === 'ai-digital-staffing')
    ).toBeDefined()
  })

  it('exactly 5 businesses in portfolio', () => {
    expect(CB_BUSINESS_PORTFOLIO.businesses.length).toBe(5)
  })
})

// ─── Group 3: New business action ─────────────────────────────────────────────

describe('Group 3 — New business action', () => {
  it('label is non-empty', () => {
    expect(CB_BUSINESS_PORTFOLIO.newBusinessAction.label).toBeTruthy()
  })

  it('path is /businesses/new', () => {
    expect(CB_BUSINESS_PORTFOLIO.newBusinessAction.path).toBe('/businesses/new')
  })

  it('description is non-empty', () => {
    expect(CB_BUSINESS_PORTFOLIO.newBusinessAction.description).toBeTruthy()
  })
})

// ─── Group 4: Navigation architecture ────────────────────────────────────────

describe('Group 4 — Navigation architecture', () => {
  it('app/businesses/dental-advantage-plan/build/page.tsx exists', () => {
    expect(
      existsSync(resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'))
    ).toBe(true)
  })

  it('app/businesses/dental-advantage-plan/page.tsx exists', () => {
    expect(
      existsSync(resolve(ROOT, 'app/businesses/dental-advantage-plan/page.tsx'))
    ).toBe(true)
  })

  it('app/businesses/new/page.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'app/businesses/new/page.tsx'))).toBe(true)
  })

  it('app/page.tsx does NOT import SimulationShell (DAP pipeline no longer the opening screen)', () => {
    const src = readFileSync(resolve(ROOT, 'app/page.tsx'), 'utf8')
    expect(src).not.toContain('SimulationShell')
  })

  it('app/page.tsx imports CbHomeDashboard', () => {
    const src = readFileSync(resolve(ROOT, 'app/page.tsx'), 'utf8')
    expect(src).toContain('CbHomeDashboard')
  })

  it('DAP build pipeline page imports SimulationShell', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).toContain('SimulationShell')
  })

  it('DAP build pipeline page has a breadcrumb back to CB Control Center', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).toContain('data-breadcrumb')
    expect(src).toContain('CB Control Center')
  })

  it('DAP build pipeline page links back to /', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/dental-advantage-plan/build/page.tsx'),
      'utf8'
    )
    expect(src).toContain('href="/"')
  })
})

// ─── Group 5: Safety — no forbidden terms in new portfolio files ───────────────

describe('Group 5 — Portfolio safety', () => {
  const FORBIDDEN_TERMS = [
    'sentAt',
    'queuedAt',
    'emailBody',
    'dispatchEmail',
    'sendEmail',
    'paymentCta',
    'phi',
  ]

  it('cbBusinessPortfolioData.ts contains no forbidden dispatch/payment/PHI terms', () => {
    const src = readFileSync(
      resolve(ROOT, 'lib/cb-control-center/cbBusinessPortfolioData.ts'),
      'utf8'
    )
    for (const term of FORBIDDEN_TERMS) {
      expect(src, `should not contain '${term}'`).not.toContain(term)
    }
  })

  it('CbHomeDashboard.tsx contains no forbidden dispatch/payment/PHI terms', () => {
    const src = readFileSync(
      resolve(ROOT, 'components/cb-control-center/CbHomeDashboard.tsx'),
      'utf8'
    )
    for (const term of FORBIDDEN_TERMS) {
      expect(src, `CbHomeDashboard should not contain '${term}'`).not.toContain(term)
    }
  })

  it('new business page contains no forbidden terms', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/businesses/new/page.tsx'),
      'utf8'
    )
    for (const term of FORBIDDEN_TERMS) {
      expect(src, `new business page should not contain '${term}'`).not.toContain(term)
    }
  })

  it('portfolio data implies no payment authority', () => {
    // All detail paths go to /businesses/*, not /checkout or /payment
    for (const b of CB_BUSINESS_PORTFOLIO.businesses) {
      expect(b.detailPath).not.toContain('checkout')
      expect(b.detailPath).not.toContain('payment')
    }
  })
})

// ─── Group 6: CbHomeDashboard renders correctly ───────────────────────────────

describe('Group 6 — CbHomeDashboard renders correctly', () => {
  function render() {
    return renderToString(React.createElement(CbHomeDashboard))
  }

  it('renders without throwing', () => {
    expect(() => render()).not.toThrow()
  })

  it('has data-cb-home-dashboard attribute', () => {
    expect(render()).toContain('data-cb-home-dashboard')
  })

  it('has data-business-list attribute', () => {
    expect(render()).toContain('data-business-list')
  })

  it('has data-start-new-business action', () => {
    expect(render()).toContain('data-start-new-business')
  })

  it('has data-new-business-card', () => {
    expect(render()).toContain('data-new-business-card')
  })

  it('has data-needs-attention section (DAP is blocked)', () => {
    expect(render()).toContain('data-needs-attention')
  })

  it('renders all 5 business names', () => {
    const html = render()
    const businesses = CB_BUSINESS_PORTFOLIO.businesses
    for (const b of businesses) {
      expect(html, `should contain ${b.name}`).toContain(b.name)
    }
  })

  it('renders Start New Business label', () => {
    expect(render()).toContain('Start New Business')
  })

  it('renders a link to DAP build pipeline', () => {
    expect(render()).toContain('/businesses/dental-advantage-plan/build')
  })

  it('renders a link to /businesses/new', () => {
    expect(render()).toContain('/businesses/new')
  })

  it('renders CB Control Center heading', () => {
    expect(render()).toContain('CB Control Center')
  })

  it('does not imply universal availability', () => {
    const html = render()
    expect(html).not.toContain('available everywhere')
    expect(html).not.toContain('all areas')
    expect(html).not.toContain('universally available')
  })

  it('does not contain payment or CRM dispatch language', () => {
    const html = render()
    expect(html).not.toContain('sentAt')
    expect(html).not.toContain('queuedAt')
    expect(html).not.toContain('emailBody')
  })
})

// ─── Group 7: System Contracts section ───────────────────────────────────────

describe('Group 7 — System Contracts section', () => {
  function render() {
    return renderToString(React.createElement(CbHomeDashboard))
  }

  it('has data-system-contracts container', () => {
    expect(render()).toContain('data-system-contracts')
  })

  it('renders link to LLM Page Formatting Standard', () => {
    expect(render()).toContain('/preview/cbseoaeo/llm-page-format')
  })

  it('renders link to Page Generation Contracts', () => {
    expect(render()).toContain('/preview/cbseoaeo/page-generation-contract')
  })

  it('renders link to DAP Page Briefs', () => {
    expect(render()).toContain('/preview/dap/page-briefs')
  })

  it('renders link to DAP Onboarding Preview', () => {
    expect(render()).toContain('/preview/dap/onboarding')
  })

  it('renders link to DAP Member Status Preview', () => {
    expect(render()).toContain('/preview/dap/member-status')
  })

  it('has data-system-contract-link on contract links', () => {
    expect(render()).toContain('data-system-contract-link')
  })

  it('has View System Contracts header action', () => {
    expect(render()).toContain('View System Contracts')
  })
})

// ─── Group 8: Workspace mode ──────────────────────────────────────────────────

describe('Group 8 — Workspace mode', () => {
  function render() {
    return renderToString(React.createElement(CbHomeDashboard))
  }

  it('has data-workspace-mode-badge', () => {
    expect(render()).toContain('data-workspace-mode-badge')
  })

  it('badge text contains Workspace Mock Mode', () => {
    expect(render()).toContain('Workspace Mock Mode')
  })

  it('MockModeBanner renders with Mock Mode text', () => {
    expect(render()).toContain('Mock Mode')
  })

  it('MockModeBanner renders with amber styling', () => {
    expect(render()).toContain('amber')
  })

  it('MockModeBanner text confirms no real connections', () => {
    expect(render()).toContain('No crawler')
  })
})
