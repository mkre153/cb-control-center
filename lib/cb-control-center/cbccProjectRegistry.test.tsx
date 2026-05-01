/**
 * CBCC v2 — Project Registry and Step 0 governance tests
 *
 * Group 1 — Project registry renders with data-cbcc-project-registry
 * Group 2 — Empty state renders when no projects
 * Group 3 — Intake form has all 9 required data-field inputs
 * Group 4 — Stage pipeline: all 7 stages locked before charter approval
 * Group 5 — Stage pipeline: Stage 1 available after charter approval, 2–7 locked
 * Group 6 — No DAP/dental/vertical copy in generic v2 UI
 * Group 7 — Route files exist
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { renderToString } from 'react-dom/server'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import React from 'react'

import { CbccProjectRegistry } from '@/components/cb-control-center/v2/CbccProjectRegistry'
import { CbccProjectIntakeForm } from '@/components/cb-control-center/v2/CbccProjectIntakeForm'
import { CbccStagePipeline } from '@/components/cb-control-center/v2/CbccStagePipeline'
import type { CbccProject, ProjectStage } from '@/lib/cb-control-center/cbccProjectTypes'

const ROOT = resolve(__dirname, '../..')

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<CbccProject> = {}): CbccProject {
  return {
    id: 'test-id',
    slug: 'test-project',
    name: 'Test Project',
    businessType: 'SaaS',
    primaryGoal: 'Get customers',
    targetCustomer: 'SMBs',
    knownConstraints: 'None',
    forbiddenClaims: 'No guarantees',
    sourceUrlsNotes: 'https://example.com',
    desiredOutputType: 'Website',
    approvalOwner: 'owner@example.com',
    charterJson: null,
    charterGeneratedAt: null,
    charterModel: null,
    charterApproved: false,
    charterApprovedAt: null,
    charterApprovedBy: null,
    charterVersion: 1,
    charterHash: null,
    projectStatus: 'step_0_draft',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

function makeStages(): ProjectStage[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `stage-${i + 1}`,
    projectId: 'test-id',
    stageNumber: i + 1,
    stageKey: `key-${i + 1}`,
    stageTitle: `Stage ${i + 1}`,
    stageStatus: 'locked' as const,
    approved: false,
    approvedAt: null,
    approvedBy: null,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  }))
}

// ─── Group 1: Registry renders ────────────────────────────────────────────────

describe('Group 1 — CbccProjectRegistry renders', () => {
  it('renders data-cbcc-project-registry attribute', () => {
    const html = renderToString(
      React.createElement(CbccProjectRegistry, { projects: [] })
    )
    expect(html).toContain('data-cbcc-project-registry')
  })

  it('renders project list when projects exist', () => {
    const projects = [makeProject({ name: 'Alpha Project', slug: 'alpha' })]
    const html = renderToString(
      React.createElement(CbccProjectRegistry, { projects })
    )
    expect(html).toContain('Alpha Project')
  })

  it('renders Create Project link to /projects/new', () => {
    const html = renderToString(
      React.createElement(CbccProjectRegistry, { projects: [] })
    )
    expect(html).toContain('/projects/new')
    expect(html).toContain('New Project')
  })
})

// ─── Group 2: Empty state ─────────────────────────────────────────────────────

describe('Group 2 — Empty state', () => {
  it('renders data-empty-state when no projects', () => {
    const html = renderToString(
      React.createElement(CbccProjectRegistry, { projects: [] })
    )
    expect(html).toContain('data-empty-state')
  })

  it('does not render data-empty-state when projects exist', () => {
    const projects = [makeProject()]
    const html = renderToString(
      React.createElement(CbccProjectRegistry, { projects })
    )
    expect(html).not.toContain('data-empty-state')
  })
})

// ─── Group 3: Intake form fields ──────────────────────────────────────────────

describe('Group 3 — Intake form has all 9 data-field inputs', () => {
  // defaultShowIntake=true bypasses the URL-entry phase so data-field inputs are visible
  let html: string

  it('renders without throwing', () => {
    html = renderToString(React.createElement(CbccProjectIntakeForm, { defaultShowIntake: true }))
    expect(html).toBeTruthy()
  })

  const REQUIRED_FIELDS = [
    'name',
    'businessType',
    'primaryGoal',
    'targetCustomer',
    'knownConstraints',
    'forbiddenClaims',
    'sourceUrlsNotes',
    'desiredOutputType',
    'approvalOwner',
  ]

  for (const field of REQUIRED_FIELDS) {
    it(`has data-field="${field}"`, () => {
      if (!html) html = renderToString(React.createElement(CbccProjectIntakeForm, { defaultShowIntake: true }))
      expect(html).toContain(`data-field="${field}"`)
    })
  }

  it('URL phase renders data-url-entry and hides data-field inputs by default', () => {
    const urlHtml = renderToString(React.createElement(CbccProjectIntakeForm))
    expect(urlHtml).toContain('name="url"')
    expect(urlHtml).not.toContain('data-field="name"')
  })
})

// ─── Group 4: Stage pipeline — all 7 locked before charter approval ───────────

describe('Group 4 — Stage pipeline: all 7 stages locked before charter approval', () => {
  let html: string

  beforeAll(() => {
    const project = makeProject({ charterApproved: false })
    const stages = makeStages()
    html = renderToString(
      React.createElement(CbccStagePipeline, { project, stages })
    )
  })

  it('renders data-stage-pipeline', () => {
    expect(html).toContain('data-stage-pipeline')
  })

  for (let n = 1; n <= 7; n++) {
    it(`Stage ${n} renders data-stage-status="locked"`, () => {
      expect(html).toContain(`data-stage-number="${n}"`)
      // Count locked stages — must be all 7
      const lockMatches = html.match(/data-stage-status="locked"/g) ?? []
      expect(lockMatches.length).toBe(7)
    })
  }
})

// ─── Group 5: Stage pipeline — Stage 1 available after charter approval ───────

describe('Group 5 — Stage pipeline: Stage 1 available after charter approval, Stages 2–7 locked', () => {
  let html: string

  beforeAll(() => {
    const project = makeProject({ charterApproved: true })
    const stages = makeStages().map(s =>
      s.stageNumber === 1 ? { ...s, stageStatus: 'available' as const } : s
    )
    html = renderToString(
      React.createElement(CbccStagePipeline, { project, stages })
    )
  })

  it('Stage 1 renders data-stage-status="available"', () => {
    expect(html).toContain('data-stage-number="1"')
    // The first occurrence of data-stage-status after data-stage-number="1" should be "available"
    const idx = html.indexOf('data-stage-number="1"')
    const after = html.slice(idx, idx + 200)
    expect(after).toContain('data-stage-status="available"')
  })

  it('Stages 2–7 still render data-stage-status="locked"', () => {
    const lockMatches = html.match(/data-stage-status="locked"/g) ?? []
    expect(lockMatches.length).toBe(6)
  })
})

// ─── Group 6: No DAP/vertical copy in generic v2 UI ──────────────────────────

describe('Group 6 — No DAP or vertical copy in generic v2 UI', () => {
  const FORBIDDEN_TERMS = [
    'Dental Advantage Plan',
    'DAP',
    'dental',
    'insurance',
    'patients',
    'practice',
    'provider',
    'membership',
  ]

  function registryHtml() {
    return renderToString(
      React.createElement(CbccProjectRegistry, { projects: [] })
    )
  }

  function intakeHtml() {
    // Test both phases for forbidden terms
    const urlPhase = renderToString(React.createElement(CbccProjectIntakeForm))
    const intakePhase = renderToString(React.createElement(CbccProjectIntakeForm, { defaultShowIntake: true }))
    return urlPhase + intakePhase
  }

  for (const term of FORBIDDEN_TERMS) {
    it(`CbccProjectRegistry does not contain "${term}"`, () => {
      expect(registryHtml()).not.toContain(term)
    })
  }

  for (const term of FORBIDDEN_TERMS) {
    it(`CbccProjectIntakeForm does not contain "${term}"`, () => {
      expect(intakeHtml()).not.toContain(term)
    })
  }

  it('app/page.tsx does not contain DAP copy', () => {
    const src = readFileSync(resolve(ROOT, 'app/page.tsx'), 'utf-8')
    for (const term of FORBIDDEN_TERMS) {
      expect(src, `app/page.tsx should not contain "${term}"`).not.toContain(term)
    }
  })
})

// ─── Group 7: Route files exist ───────────────────────────────────────────────

describe('Group 7 — Route files exist', () => {
  const ROUTES = [
    'app/projects/page.tsx',
    'app/projects/new/page.tsx',
    'app/projects/[slug]/page.tsx',
    'app/projects/[slug]/charter/page.tsx',
  ]

  for (const route of ROUTES) {
    it(`${route} exists`, () => {
      expect(existsSync(resolve(ROOT, route))).toBe(true)
    })
  }

  it('app/page.tsx imports CbccProjectRegistry', () => {
    const src = readFileSync(resolve(ROOT, 'app/page.tsx'), 'utf-8')
    expect(src).toContain('CbccProjectRegistry')
  })
})
