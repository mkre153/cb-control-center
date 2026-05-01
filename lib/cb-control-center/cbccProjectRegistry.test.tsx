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
 * Group 8 — Pipeline renders Step 0 card + 7 stage cards (8 total) with correct hrefs
 * Group 9 — CBCC_STAGE_DEFINITIONS has 7 canonical entries with required fields
 * Group 10 — Stage detail renders all required sections (incl. deferred approval gate for generic)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { renderToString } from 'react-dom/server'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import React from 'react'

import { CbccProjectRegistry } from '@/components/cb-control-center/v2/CbccProjectRegistry'
import { CbccProjectIntakeForm } from '@/components/cb-control-center/v2/CbccProjectIntakeForm'
import { CbccStagePipeline } from '@/components/cb-control-center/v2/CbccStagePipeline'
import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'
import { DeferredApprovalGate } from '@/components/cb-control-center/DeferredApprovalGate'
import { CBCC_STAGE_DEFINITIONS } from '@/lib/cb-control-center/cbccStageDefinitions'
import { buildGenericStageGate } from '@/lib/cb-control-center/cbccProjectStageAdapter'
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
    html = renderToString(<CbccProjectIntakeForm defaultShowIntake />)
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
      if (!html) html = renderToString(<CbccProjectIntakeForm defaultShowIntake />)
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
    it(`Stage ${n} row exposes data-cbcc-stage-status="locked"`, () => {
      expect(html).toContain(`data-cbcc-stage-number="${n}"`)
      const lockMatches = html.match(/data-cbcc-stage-status="locked"/g) ?? []
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

  it('Stage 1 row exposes data-cbcc-stage-status="available"', () => {
    expect(html).toContain('data-cbcc-stage-number="1"')
    const idx = html.indexOf('data-cbcc-stage-number="1"')
    const after = html.slice(idx, idx + 300)
    expect(after).toContain('data-cbcc-stage-status="available"')
  })

  it('Stages 2–7 still expose data-cbcc-stage-status="locked"', () => {
    const lockMatches = html.match(/data-cbcc-stage-status="locked"/g) ?? []
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
    const urlPhase = renderToString(React.createElement(CbccProjectIntakeForm))
    const intakePhase = renderToString(<CbccProjectIntakeForm defaultShowIntake />)
    return urlPhase + intakePhase
  }

  function pipelineHtml() {
    const project = makeProject({ charterApproved: false })
    const stages = makeStages()
    return renderToString(React.createElement(CbccStagePipeline, { project, stages }))
  }

  function stageDetailHtml() {
    const project = makeProject({ slug: 'generic-co' })
    const row = makeStages()[2] // Stage 3
    const stage = buildGenericStageGate(project, row)!
    return renderToString(
      React.createElement(StageDetailPage, {
        stage,
        breadcrumbBase: '/projects/generic-co',
        breadcrumbTrail: [
          { label: 'CB Control Center', href: '/' },
          { label: project.name, href: '/projects/generic-co' },
          { label: 'Build Pipeline', href: '/projects/generic-co' },
        ],
      })
    )
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

  for (const term of FORBIDDEN_TERMS) {
    it(`CbccStagePipeline (generic) does not contain "${term}"`, () => {
      expect(pipelineHtml()).not.toContain(term)
    })
  }

  for (const term of FORBIDDEN_TERMS) {
    it(`StageDetailPage (generic) does not contain "${term}"`, () => {
      expect(stageDetailHtml()).not.toContain(term)
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
    'app/projects/[slug]/stages/[stageNumber]/page.tsx',
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

// ─── Group 8: Pipeline renders Step 0 + 7 stages with correct hrefs ──────────

describe('Group 8 — Pipeline renders Step 0 card + 7 stage cards (8 total)', () => {
  let html: string

  beforeAll(() => {
    const project = makeProject({ slug: 'test-project', charterApproved: false })
    const stages = makeStages()
    html = renderToString(
      React.createElement(CbccStagePipeline, { project, stages })
    )
  })

  it('renders exactly one Step 0 card', () => {
    const matches = html.match(/data-step-zero-card/g) ?? []
    expect(matches.length).toBe(1)
  })

  it('Step 0 card exposes data-step-zero-status', () => {
    expect(html).toContain('data-step-zero-status="no_charter"')
  })

  it('Step 0 card links to /projects/test-project/charter', () => {
    expect(html).toContain('href="/projects/test-project/charter"')
  })

  it('renders exactly 7 stage rows', () => {
    const matches = html.match(/data-cbcc-stage-row/g) ?? []
    expect(matches.length).toBe(7)
  })

  for (let n = 1; n <= 7; n++) {
    it(`stage ${n} card links to /projects/test-project/stages/${n}`, () => {
      expect(html).toContain(`href="/projects/test-project/stages/${n}"`)
    })
  }

  it('Step 0 action label reflects no_charter state', () => {
    expect(html).toContain('Generate Charter')
  })

  it('after charter generated (charterJson set), Step 0 status is awaiting_approval', () => {
    const project = makeProject({
      slug: 'test-project',
      charterApproved: false,
      charterJson: { whatThisIs: 'x', whatThisIsNot: 'y', whoItServes: 'z', allowedClaims: [], forbiddenClaims: [], requiredEvidence: [], approvalAuthority: 'owner', presetStages: [] },
    })
    const stages = makeStages()
    const h = renderToString(React.createElement(CbccStagePipeline, { project, stages }))
    expect(h).toContain('data-step-zero-status="awaiting_approval"')
    expect(h).toContain('Review Charter')
  })

  it('after charter approved, Step 0 status is approved', () => {
    const project = makeProject({ slug: 'test-project', charterApproved: true })
    const stages = makeStages()
    const h = renderToString(React.createElement(CbccStagePipeline, { project, stages }))
    expect(h).toContain('data-step-zero-status="approved"')
    expect(h).toContain('View Charter')
  })
})

// ─── Group 9: Canonical stage definitions ─────────────────────────────────────

describe('Group 9 — CBCC_STAGE_DEFINITIONS canonical entries', () => {
  const EXPECTED_KEYS = [
    'definition',
    'discovery',
    'truth-schema',
    'positioning',
    'content-strategy',
    'architecture',
    'build-launch',
  ] as const

  it('has exactly 7 entries', () => {
    expect(CBCC_STAGE_DEFINITIONS.length).toBe(7)
  })

  for (let i = 0; i < EXPECTED_KEYS.length; i++) {
    const expectedKey = EXPECTED_KEYS[i]
    const expectedNumber = i + 1
    it(`stage ${expectedNumber} has canonical key "${expectedKey}"`, () => {
      const def = CBCC_STAGE_DEFINITIONS[i]
      expect(def.number).toBe(expectedNumber)
      expect(def.key).toBe(expectedKey)
      expect(def.title).toMatch(new RegExp(`^Stage ${expectedNumber} —`))
    })
  }

  for (const def of CBCC_STAGE_DEFINITIONS) {
    it(`stage ${def.number} has non-empty whyItMatters/requirements/requiredApprovals`, () => {
      expect(def.whyItMatters.length).toBeGreaterThan(0)
      expect(def.requirements.length).toBeGreaterThan(0)
      expect(def.requiredApprovals.length).toBeGreaterThan(0)
    })
  }
})

// ─── Group 10: Stage detail page sections ─────────────────────────────────────

describe('Group 10 — Stage detail page renders all required sections', () => {
  function renderGeneric(rowOverrides: Partial<ProjectStage> = {}) {
    const project = makeProject({ slug: 'generic-co' })
    const row = { ...makeStages()[2], ...rowOverrides } // Stage 3
    const stage = buildGenericStageGate(project, row)!
    return renderToString(
      React.createElement(StageDetailPage, {
        stage,
        breadcrumbBase: '/projects/generic-co',
        breadcrumbTrail: [
          { label: 'CB Control Center', href: '/' },
          { label: project.name, href: '/projects/generic-co' },
          { label: 'Build Pipeline', href: '/projects/generic-co' },
        ],
      })
    )
  }

  it('locked stage renders status badge', () => {
    const html = renderGeneric({ stageStatus: 'locked' })
    expect(html).toContain('Not Started')
  })

  it('locked stage renders purpose section (whyItMatters)', () => {
    const html = renderGeneric({ stageStatus: 'locked' })
    expect(html).toMatch(/Why this stage matters/i)
  })

  it('locked stage renders evidence trail section', () => {
    const html = renderGeneric({ stageStatus: 'locked' })
    expect(html).toMatch(/Evidence Trail/i)
  })

  it('locked stage renders next-stage unlock rule section', () => {
    const html = renderGeneric({ stageStatus: 'locked' })
    expect(html).toMatch(/Next-Stage Unlock Rule/i)
  })

  it('locked stage renders anti-bypass banner', () => {
    const html = renderGeneric({ stageStatus: 'locked' })
    expect(html).toContain('data-anti-bypass-rule')
  })

  it('approved stage renders approval metadata', () => {
    const html = renderGeneric({
      stageStatus: 'approved',
      approved: true,
      approvedAt: '2026-04-01',
      approvedBy: 'owner@example.com',
    })
    expect(html).toContain('2026-04-01')
    expect(html).toMatch(/Approved by Owner/i)
  })

  it('locked stage renders prerequisite text indicating prior stage approval needed', () => {
    const html = renderGeneric({ stageStatus: 'locked' })
    // React injects HTML comments between text/expression boundaries; strip them.
    const stripped = html.replace(/<!--\s*-->/g, '')
    expect(stripped).toMatch(/Stage 2 must be owner-approved/i)
  })

  it('DeferredApprovalGate renders the deferred-state copy', () => {
    const html = renderToString(React.createElement(DeferredApprovalGate))
    expect(html).toMatch(/Approval gate/i)
    expect(html).toMatch(/later v2 pass/i)
    expect(html).toContain('data-approval-gate-deferred')
  })

  it('v2 stage detail route source wires DeferredApprovalGate for non-DAP projects', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/projects/[slug]/stages/[stageNumber]/page.tsx'),
      'utf-8',
    )
    expect(src).toContain('DeferredApprovalGate')
    // Ensure DAP path is excluded from deferred-gate rendering
    expect(src).toMatch(/!isDap/)
  })
})

// ─── Group 11: New-project seeding integrity (DB-gated) ──────────────────────
// Pure-helper coverage lives in cbccProjectRepository.test.ts (always runs).
// This group exercises ensureProjectStages against a live Supabase instance
// and is skipped when the service-role key is unavailable (typical CI).

const HAS_SUPABASE = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

describe.skipIf(!HAS_SUPABASE)('Group 11 — ensureProjectStages idempotency (live DB)', () => {
  it('inserts 7 rows on a fresh project, then is a no-op on second call', async () => {
    const { createProject, ensureProjectStages, getProjectStages } =
      await import('./cbccProjectRepository')
    const slug = `seed-test-${Date.now()}`
    const project = await createProject({
      slug,
      name: 'Seeding Integrity Test',
      businessType: 'test',
      primaryGoal: 'test',
      targetCustomer: 'test',
      knownConstraints: 'test',
      forbiddenClaims: 'test',
      sourceUrlsNotes: 'test',
      desiredOutputType: 'test',
      approvalOwner: 'test@example.com',
    })

    const second = await ensureProjectStages(project.id)
    expect(second.inserted).toBe(0)
    expect(second.updatedReconciled).toBe(0)
    expect(second.unchanged).toBe(7)

    const rows = await getProjectStages(project.id)
    expect(rows.length).toBe(7)
    expect(rows.map(r => r.stageNumber).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7])
    const expectedKeys = ['definition', 'discovery', 'truth-schema', 'positioning', 'content-strategy', 'architecture', 'build-launch']
    expect(rows.map(r => r.stageKey)).toEqual(expectedKeys)
  })
})

