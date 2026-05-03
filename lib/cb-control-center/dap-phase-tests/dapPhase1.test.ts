import { describe, it, expect } from 'vitest'
import {
  getDefaultHowItWorksModel,
  getDefaultComparisonModel,
  getDefaultSavingsEducationModel,
  getDefaultFaqModel,
} from '../dapPublicSectionModels'
import { exportDapCmsSnapshot } from '../dapCmsExport'
import { getLaunchReadiness } from '../launchReadiness'
import { FORBIDDEN_HERO_PHRASES, FORBIDDEN_CITY_CLAIMS } from '../../dap/registry/dapDisplayRules'
import type { EnrichedBlocker } from '../types'

// ─── Section model safety ───────────────────────────────────────────────────

describe('Phase 1 — section model safety', () => {
  const allForbidden = [...FORBIDDEN_HERO_PHRASES, ...FORBIDDEN_CITY_CLAIMS]

  function collectModelText(obj: unknown): string {
    if (typeof obj === 'string') return obj
    if (Array.isArray(obj)) return obj.map(collectModelText).join(' ')
    if (obj && typeof obj === 'object') return Object.values(obj).map(collectModelText).join(' ')
    return ''
  }

  it('how-it-works model contains no forbidden phrases', () => {
    const text = collectModelText(getDefaultHowItWorksModel()).toLowerCase()
    for (const phrase of allForbidden) {
      expect(text, `Found forbidden phrase: "${phrase}"`).not.toContain(phrase.toLowerCase())
    }
  })

  it('comparison model contains no forbidden phrases', () => {
    const text = collectModelText(getDefaultComparisonModel()).toLowerCase()
    for (const phrase of allForbidden) {
      expect(text, `Found forbidden phrase: "${phrase}"`).not.toContain(phrase.toLowerCase())
    }
  })

  it('savings education model contains no forbidden phrases', () => {
    const text = collectModelText(getDefaultSavingsEducationModel()).toLowerCase()
    for (const phrase of allForbidden) {
      expect(text, `Found forbidden phrase: "${phrase}"`).not.toContain(phrase.toLowerCase())
    }
  })

  it('faq model (homepage) contains no forbidden phrases', () => {
    const text = collectModelText(getDefaultFaqModel('homepage')).toLowerCase()
    for (const phrase of allForbidden) {
      expect(text, `Found forbidden phrase: "${phrase}"`).not.toContain(phrase.toLowerCase())
    }
  })

  it('savings education model does not claim guaranteed savings', () => {
    const text = collectModelText(getDefaultSavingsEducationModel()).toLowerCase()
    expect(text).not.toContain('guaranteed')
    expect(text).not.toContain('you will save')
    expect(text).not.toContain('save exactly')
  })

  it('comparison model does not call DAP insurance', () => {
    const text = collectModelText(getDefaultComparisonModel()).toLowerCase()
    // "insurance" may appear in comparisons but not as a claim that DAP is insurance
    // The safe assertion: DAP is not described as an insurance plan
    expect(text).not.toContain('dap insurance')
    expect(text).not.toContain('dap is an insurance')
  })
})

// ─── CMS snapshot fixture gate ──────────────────────────────────────────────

describe('Phase 1 — CMS snapshot safety gates', () => {
  const snapshot = exportDapCmsSnapshot()

  it('snapshot has at least one city', () => {
    expect(snapshot.cities.length).toBeGreaterThan(0)
  })

  it('snapshot has at least one dentist page', () => {
    expect(snapshot.dentistPages.length).toBeGreaterThan(0)
  })

  it('no declined practices appear in dentistPages', () => {
    for (const d of snapshot.dentistPages) {
      expect(d.publicState, `Declined practice ${d.slug} in dentistPages`).not.toBe('internal_only')
    }
  })

  it('no declined practices appear in cities visiblePracticeSlugs', () => {
    const allDentistSlugs = new Set(snapshot.dentistPages.map(d => d.slug))
    for (const city of snapshot.cities) {
      for (const slug of city.visiblePracticeSlugs) {
        expect(allDentistSlugs.has(slug), `City ${city.slug} references unknown or declined slug: ${slug}`).toBe(true)
      }
    }
  })

  it('dentist pages do not expose PHI', () => {
    for (const d of snapshot.dentistPages) {
      // PHI markers: SSN, DOB, diagnosis, insurance ID
      const text = JSON.stringify(d).toLowerCase()
      expect(text).not.toContain('ssn')
      expect(text).not.toContain('date of birth')
      expect(text).not.toContain('diagnosis')
      expect(text).not.toContain('insurance id')
    }
  })

  it('decision pages contain no forbidden claims', () => {
    for (const d of snapshot.decisionPages) {
      for (const claim of d.forbiddenClaims) {
        expect(d.safeAnswer.toLowerCase(), `Decision page ${d.slug} violates its own forbiddenClaims`).not.toContain(claim.toLowerCase())
      }
    }
  })

  it('treatment pages contain no forbidden claims', () => {
    for (const t of snapshot.treatmentPages) {
      for (const claim of t.forbiddenClaims) {
        expect(t.safeAnswer.toLowerCase(), `Treatment page ${t.slug} violates its own forbiddenClaims`).not.toContain(claim.toLowerCase())
      }
    }
  })
})

// ─── Cities scaffold ─────────────────────────────────────────────────────────

describe('Phase 1 — cities scaffold', () => {
  const { cities } = exportDapCmsSnapshot()

  it('all cities have a slug', () => {
    for (const c of cities) {
      expect(c.slug).toBeTruthy()
      expect(c.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('all cities have seoTitle and seoDescription', () => {
    for (const c of cities) {
      expect(c.seoTitle).toBeTruthy()
      expect(c.seoDescription).toBeTruthy()
    }
  })

  it('city headings do not contain forbidden city claims', () => {
    for (const c of cities) {
      const heading = c.heading.toLowerCase()
      for (const phrase of FORBIDDEN_CITY_CLAIMS) {
        expect(heading, `City ${c.slug} heading contains forbidden phrase: "${phrase}"`).not.toContain(phrase.toLowerCase())
      }
    }
  })
})

// ─── Launch readiness logic ──────────────────────────────────────────────────

describe('Phase 1 — launch readiness', () => {
  function makeBlocker(id: string, status: 'open' | 'resolved'): EnrichedBlocker {
    return {
      id,
      title: id,
      severity: 'high',
      relatedSection: 'test',
      affectedFields: [],
      description: '',
      whyItMatters: '',
      requiredEvidence: [],
      resolutionOptions: [],
      gateCondition: '',
      downstreamUnlockImpact: [],
      resolutionStatus: status,
    }
  }

  it('education pages are always partial when all blockers open', () => {
    const blockers = ['eb-001', 'eb-002', 'eb-003', 'eb-004', 'eb-005'].map(id => makeBlocker(id, 'open'))
    const caps = getLaunchReadiness(blockers)
    const edCap = caps.find(c => c.question.includes('education'))!
    expect(edCap.status).toBe('partial')
  })

  it('provider pages blocked when eb-001 open', () => {
    const blockers = [makeBlocker('eb-001', 'open')]
    const caps = getLaunchReadiness(blockers)
    const providerCap = caps.find(c => c.question.includes('provider pages'))!
    expect(providerCap.status).toBe('no')
  })

  it('provider pages yes when eb-001 resolved', () => {
    const blockers = [makeBlocker('eb-001', 'resolved')]
    const caps = getLaunchReadiness(blockers)
    const providerCap = caps.find(c => c.question.includes('provider pages'))!
    expect(providerCap.status).toBe('yes')
  })

  it('join plan blocked when eb-002 or eb-004 open', () => {
    const blockers = [makeBlocker('eb-002', 'open'), makeBlocker('eb-004', 'open')]
    const caps = getLaunchReadiness(blockers)
    const joinCap = caps.find(c => c.question.includes('Join plan'))!
    expect(joinCap.status).toBe('no')
  })

  it('patient requests blocked when eb-003 open', () => {
    const blockers = [makeBlocker('eb-003', 'open')]
    const caps = getLaunchReadiness(blockers)
    const reqCap = caps.find(c => c.question.includes('patient requests'))!
    expect(reqCap.status).toBe('no')
  })

  it('returns exactly 6 capabilities', () => {
    const caps = getLaunchReadiness([])
    expect(caps).toHaveLength(6)
  })
})
