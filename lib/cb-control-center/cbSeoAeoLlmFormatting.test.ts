/**
 * Phase 18B — Neil-Style LLM-Friendly Page Formatting Standard
 *
 * PURPOSE: Lock the cbSeoAeoLlmFormatting contract so that the standard cannot
 * silently drift. All tests are structural (import + assertion) — no rendering.
 *
 * COVERAGE:
 *   Group 1 — Framework hierarchy: 5 layers, correct ranks
 *   Group 2 — Cannot-override contract: Neil is rank 5, cannot override 1–4
 *   Group 3 — Bottom-line rule: exact required string
 *   Group 4 — Section taxonomy: exactly 12 sections, all IDs present
 *   Group 5 — DAP page-type usage mapping: 7 entries, correct usage levels
 *   Group 6 — Homepage guardrail: usage='light', forbidden patterns, allowed sections
 *   Group 7 — Usage level ranking: none < light < medium < strong < very_strong < full
 *   Group 8 — DAP truth rules: is/isNot/forbiddenImplications all present
 *   Group 9 — Preview route exists
 */

import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

import {
  CB_FRAMEWORK_HIERARCHY,
  NEIL_LLM_CANNOT_OVERRIDE_LAYERS,
  NEIL_LLM_BOTTOM_LINE_RULE,
  NEIL_LLM_SECTIONS,
  DAP_NEIL_LLM_FORMATTING_USAGE,
  HOMEPAGE_GUARDRAIL,
  DAP_TRUTH_RULES,
  neilUsageRank,
  getNeilUsageForDapPage,
} from './cbSeoAeoLlmFormatting'

const ROOT = resolve(__dirname, '../..')

// ─── Group 1: Framework hierarchy ─────────────────────────────────────────────

describe('Group 1 — Framework hierarchy', () => {
  it('has exactly 5 framework layers', () => {
    expect(CB_FRAMEWORK_HIERARCHY).toHaveLength(5)
  })

  it('BrandScript is rank 1', () => {
    const layer = CB_FRAMEWORK_HIERARCHY.find(l => l.id === 'BrandScript')
    expect(layer?.rank).toBe(1)
  })

  it('DecisionLock is rank 2', () => {
    const layer = CB_FRAMEWORK_HIERARCHY.find(l => l.id === 'DecisionLock')
    expect(layer?.rank).toBe(2)
  })

  it('CBDesignEngine is rank 3', () => {
    const layer = CB_FRAMEWORK_HIERARCHY.find(l => l.id === 'CBDesignEngine')
    expect(layer?.rank).toBe(3)
  })

  it('CBSeoAeoCoreNate is rank 4', () => {
    const layer = CB_FRAMEWORK_HIERARCHY.find(l => l.id === 'CBSeoAeoCoreNate')
    expect(layer?.rank).toBe(4)
  })

  it('NeilLlmFormatting is rank 5', () => {
    const layer = CB_FRAMEWORK_HIERARCHY.find(l => l.id === 'NeilLlmFormatting')
    expect(layer?.rank).toBe(5)
  })

  it('ranks are unique and sequential 1–5', () => {
    const ranks = CB_FRAMEWORK_HIERARCHY.map(l => l.rank).sort((a, b) => a - b)
    expect(ranks).toEqual([1, 2, 3, 4, 5])
  })

  it('every layer has a non-empty description', () => {
    for (const layer of CB_FRAMEWORK_HIERARCHY) {
      expect(layer.description.length).toBeGreaterThan(10)
    }
  })
})

// ─── Group 2: Cannot-override contract ────────────────────────────────────────

describe('Group 2 — Neil cannot override layers 1–4', () => {
  it('NEIL_LLM_CANNOT_OVERRIDE_LAYERS has exactly 4 entries', () => {
    expect(NEIL_LLM_CANNOT_OVERRIDE_LAYERS).toHaveLength(4)
  })

  it('BrandScript is in the cannot-override list', () => {
    expect(NEIL_LLM_CANNOT_OVERRIDE_LAYERS).toContain('BrandScript')
  })

  it('DecisionLock is in the cannot-override list', () => {
    expect(NEIL_LLM_CANNOT_OVERRIDE_LAYERS).toContain('DecisionLock')
  })

  it('CBDesignEngine is in the cannot-override list', () => {
    expect(NEIL_LLM_CANNOT_OVERRIDE_LAYERS).toContain('CBDesignEngine')
  })

  it('CBSeoAeoCoreNate is in the cannot-override list', () => {
    expect(NEIL_LLM_CANNOT_OVERRIDE_LAYERS).toContain('CBSeoAeoCoreNate')
  })

  it('NeilLlmFormatting is NOT in the cannot-override list (it is the subject)', () => {
    expect(NEIL_LLM_CANNOT_OVERRIDE_LAYERS).not.toContain('NeilLlmFormatting')
  })

  it('NeilLlmFormatting rank is higher than all cannot-override layers', () => {
    const neilRank = CB_FRAMEWORK_HIERARCHY.find(l => l.id === 'NeilLlmFormatting')!.rank
    for (const id of NEIL_LLM_CANNOT_OVERRIDE_LAYERS) {
      const layer = CB_FRAMEWORK_HIERARCHY.find(l => l.id === id)!
      expect(neilRank).toBeGreaterThan(layer.rank)
    }
  })
})

// ─── Group 3: Bottom-line rule ────────────────────────────────────────────────

describe('Group 3 — Bottom-line rule', () => {
  it('NEIL_LLM_BOTTOM_LINE_RULE is a non-empty string', () => {
    expect(typeof NEIL_LLM_BOTTOM_LINE_RULE).toBe('string')
    expect(NEIL_LLM_BOTTOM_LINE_RULE.length).toBeGreaterThan(20)
  })

  it('mentions "structure layer only"', () => {
    expect(NEIL_LLM_BOTTOM_LINE_RULE).toContain('structure layer only')
  })

  it('mentions BrandScript', () => {
    expect(NEIL_LLM_BOTTOM_LINE_RULE).toContain('BrandScript')
  })

  it('mentions Decision Lock', () => {
    expect(NEIL_LLM_BOTTOM_LINE_RULE).toContain('Decision Lock')
  })

  it('mentions CBDesignEngine', () => {
    expect(NEIL_LLM_BOTTOM_LINE_RULE).toContain('CBDesignEngine')
  })

  it('states those layers "always win"', () => {
    expect(NEIL_LLM_BOTTOM_LINE_RULE).toContain('always win')
  })
})

// ─── Group 4: Section taxonomy ────────────────────────────────────────────────

describe('Group 4 — Section taxonomy: 12 sections', () => {
  it('has exactly 12 sections', () => {
    expect(NEIL_LLM_SECTIONS).toHaveLength(12)
  })

  const REQUIRED_SECTION_IDS = [
    'direct_answer_hero',
    'quick_summary',
    'toc',
    'question_h2s',
    'definition_blocks',
    'comparison_table',
    'when_it_makes_sense',
    'watchouts',
    'entity_reinforcement',
    'faq',
    'final_cta',
    'footer_disclaimer',
  ] as const

  for (const id of REQUIRED_SECTION_IDS) {
    it(`section "${id}" exists`, () => {
      expect(NEIL_LLM_SECTIONS.some(s => s.id === id)).toBe(true)
    })
  }

  it('every section has a non-empty label', () => {
    for (const s of NEIL_LLM_SECTIONS) {
      expect(s.label.length).toBeGreaterThan(2)
    }
  })

  it('every section has a non-empty description', () => {
    for (const s of NEIL_LLM_SECTIONS) {
      expect(s.description.length).toBeGreaterThan(10)
    }
  })

  it('every section has at least one requiredAt usage level', () => {
    for (const s of NEIL_LLM_SECTIONS) {
      expect(s.requiredAt.length).toBeGreaterThan(0)
    }
  })

  it('final_cta and footer_disclaimer are required at light (lowest visible usage)', () => {
    const finalCta = NEIL_LLM_SECTIONS.find(s => s.id === 'final_cta')!
    const disclaimer = NEIL_LLM_SECTIONS.find(s => s.id === 'footer_disclaimer')!
    expect(finalCta.requiredAt).toContain('light')
    expect(disclaimer.requiredAt).toContain('light')
  })

  it('comparison_table is required at very_strong and full only', () => {
    const table = NEIL_LLM_SECTIONS.find(s => s.id === 'comparison_table')!
    expect(table.requiredAt).toContain('very_strong')
    expect(table.requiredAt).toContain('full')
    expect(table.requiredAt).not.toContain('light')
    expect(table.requiredAt).not.toContain('medium')
    expect(table.requiredAt).not.toContain('strong')
  })
})

// ─── Group 5: DAP page-type usage mapping ─────────────────────────────────────

describe('Group 5 — DAP page-type usage mapping', () => {
  it('has exactly 7 page types', () => {
    expect(Object.keys(DAP_NEIL_LLM_FORMATTING_USAGE)).toHaveLength(7)
  })

  it('homepage maps to usage "light"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.homepage.usage).toBe('light')
  })

  it('howItWorks maps to usage "strong"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.howItWorks.usage).toBe('strong')
  })

  it('compare maps to usage "very_strong"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.compare.usage).toBe('very_strong')
  })

  it('guide maps to usage "very_strong"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.guide.usage).toBe('very_strong')
  })

  it('cityPage maps to usage "very_strong"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.cityPage.usage).toBe('very_strong')
  })

  it('practicePage maps to usage "medium"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.practicePage.usage).toBe('medium')
  })

  it('blogFaqPage maps to usage "full"', () => {
    expect(DAP_NEIL_LLM_FORMATTING_USAGE.blogFaqPage.usage).toBe('full')
  })

  it('every entry has a non-empty primaryFramework', () => {
    for (const [, entry] of Object.entries(DAP_NEIL_LLM_FORMATTING_USAGE)) {
      expect(entry.primaryFramework.length).toBeGreaterThan(3)
    }
  })

  it('getNeilUsageForDapPage returns correct usage for each page type', () => {
    expect(getNeilUsageForDapPage('homepage')).toBe('light')
    expect(getNeilUsageForDapPage('compare')).toBe('very_strong')
    expect(getNeilUsageForDapPage('blogFaqPage')).toBe('full')
  })
})

// ─── Group 6: Homepage guardrail ──────────────────────────────────────────────

describe('Group 6 — Homepage guardrail', () => {
  it('pageType is "homepage"', () => {
    expect(HOMEPAGE_GUARDRAIL.pageType).toBe('homepage')
  })

  it('usage is "light" (never more on homepage)', () => {
    expect(HOMEPAGE_GUARDRAIL.usage).toBe('light')
  })

  it('reason mentions BrandScript-first', () => {
    expect(HOMEPAGE_GUARDRAIL.reason.toLowerCase()).toContain('brandscript')
  })

  it('forbiddenLeadPatterns has at least 3 patterns', () => {
    expect(HOMEPAGE_GUARDRAIL.forbiddenLeadPatterns.length).toBeGreaterThanOrEqual(3)
  })

  it('FAQ as first section is forbidden on homepage', () => {
    const patterns = HOMEPAGE_GUARDRAIL.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('faq')
  })

  it('comparison table above the fold is forbidden on homepage', () => {
    const patterns = HOMEPAGE_GUARDRAIL.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('comparison table')
  })

  it('allowedSections includes final_cta and footer_disclaimer', () => {
    expect(HOMEPAGE_GUARDRAIL.allowedSections).toContain('final_cta')
    expect(HOMEPAGE_GUARDRAIL.allowedSections).toContain('footer_disclaimer')
  })

  it('requiredStructure mentions BrandScript hero first', () => {
    expect(HOMEPAGE_GUARDRAIL.requiredStructure.toLowerCase()).toContain('brandscript hero first')
  })
})

// ─── Group 7: Usage level ranking ─────────────────────────────────────────────

describe('Group 7 — Usage level ranking: none < light < medium < strong < very_strong < full', () => {
  it('none rank is 0', () => {
    expect(neilUsageRank('none')).toBe(0)
  })

  it('light rank > none', () => {
    expect(neilUsageRank('light')).toBeGreaterThan(neilUsageRank('none'))
  })

  it('medium rank > light', () => {
    expect(neilUsageRank('medium')).toBeGreaterThan(neilUsageRank('light'))
  })

  it('strong rank > medium', () => {
    expect(neilUsageRank('strong')).toBeGreaterThan(neilUsageRank('medium'))
  })

  it('very_strong rank > strong', () => {
    expect(neilUsageRank('very_strong')).toBeGreaterThan(neilUsageRank('strong'))
  })

  it('full rank > very_strong (full is the maximum)', () => {
    expect(neilUsageRank('full')).toBeGreaterThan(neilUsageRank('very_strong'))
  })

  it('full rank is 5', () => {
    expect(neilUsageRank('full')).toBe(5)
  })
})

// ─── Group 8: DAP truth rules ─────────────────────────────────────────────────

describe('Group 8 — DAP truth rules', () => {
  it('is[] has at least 2 true statements', () => {
    expect(DAP_TRUTH_RULES.is.length).toBeGreaterThanOrEqual(2)
  })

  it('isNot[] includes "Dental insurance"', () => {
    expect(DAP_TRUTH_RULES.isNot.some(s => s.toLowerCase().includes('dental insurance'))).toBe(true)
  })

  it('isNot[] includes payment processor', () => {
    expect(DAP_TRUTH_RULES.isNot.some(s => s.toLowerCase().includes('payment processor'))).toBe(true)
  })

  it('isNot[] includes insurance carrier', () => {
    expect(DAP_TRUTH_RULES.isNot.some(s => s.toLowerCase().includes('insurance carrier'))).toBe(true)
  })

  it('forbiddenImplications[] includes "guaranteed savings"', () => {
    expect(DAP_TRUTH_RULES.forbiddenImplications).toContain('guaranteed savings')
  })

  it('forbiddenImplications[] includes "guaranteed coverage"', () => {
    expect(DAP_TRUTH_RULES.forbiddenImplications).toContain('guaranteed coverage')
  })

  it('forbiddenImplications[] includes "universal availability"', () => {
    expect(DAP_TRUTH_RULES.forbiddenImplications).toContain('universal availability')
  })

  it('forbiddenImplications[] includes DAP-pays implication', () => {
    const joined = DAP_TRUTH_RULES.forbiddenImplications.join(' ').toLowerCase()
    expect(joined).toContain('dap pays')
  })

  it('forbiddenImplications[] includes DAP-sets-pricing implication', () => {
    const joined = DAP_TRUTH_RULES.forbiddenImplications.join(' ').toLowerCase()
    expect(joined).toContain('dap sets pricing')
  })
})

// ─── Group 9: Preview route exists ───────────────────────────────────────────

describe('Group 9 — Preview route exists', () => {
  it('app/preview/cbseoaeo/llm-page-format/page.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/cbseoaeo/llm-page-format/page.tsx'))).toBe(true)
  })
})
