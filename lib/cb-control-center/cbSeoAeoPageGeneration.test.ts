/**
 * Phase 18C — CBSeoAeo Page Generation Contract
 *
 * PURPOSE: Lock the page generation contract so no page type can silently
 * relax safety flags, claim levels, or truth-rule requirements.
 * All tests are structural (import + assertion) — no generation, no rendering.
 *
 * COVERAGE:
 *   Group 1  — All 8 required page types exist in the contract map
 *   Group 2  — Homepage contract: Neil=light, no generic article mode, required intents
 *   Group 3  — Safety flags locked on every page type (all 8 flags verified)
 *   Group 4  — Guide / FAQ / Comparison Neil formatting levels
 *   Group 5  — City page: local discovery intent required
 *   Group 6  — Practice page: PHI and insurance claims forbidden
 *   Group 7  — Neil formatting cannot override strategy (any page type)
 *   Group 8  — DAP truth rules required on every page type
 *   Group 9  — Comparison page: comparison table required
 *   Group 10 — No page type permits unsupported savings or insurance replacement claims
 *   Group 11 — Preview route exists and is read-only
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import {
  CB_SEOAEO_PAGE_CONTRACTS,
  LOCKED_SAFETY_FLAGS,
  DAP_REQUIRED_TRUTH_RULES,
  getAllPageTypes,
  getPageContract,
  getHomepageContract,
} from './cbSeoAeoPageGeneration'

const ROOT = resolve(__dirname, '../..')

const ALL_PAGE_TYPES = getAllPageTypes()

// ─── Group 1: All 8 page types exist ─────────────────────────────────────────

describe('Group 1 — All 8 required page types exist', () => {
  const REQUIRED = [
    'homepage',
    'guide',
    'comparison',
    'faq',
    'city_page',
    'practice_page',
    'blog_article',
    'decision_education',
  ] as const

  it('contract map has exactly 8 page types', () => {
    expect(Object.keys(CB_SEOAEO_PAGE_CONTRACTS)).toHaveLength(8)
  })

  for (const pt of REQUIRED) {
    it(`"${pt}" contract exists`, () => {
      expect(CB_SEOAEO_PAGE_CONTRACTS[pt]).toBeDefined()
    })
  }

  it('every contract has a non-empty pageType field', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).pageType).toBeTruthy()
    }
  })

  it('every contract has a non-empty primaryFramework', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).primaryFramework.length).toBeGreaterThan(3)
    }
  })

  it('every contract has a non-empty strategicPurpose', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).strategicPurpose.length).toBeGreaterThan(10)
    }
  })

  it('every contract has a non-empty conversionRole', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).conversionRole.length).toBeGreaterThan(5)
    }
  })

  it('every contract has at least 1 required section', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).requiredSections.length).toBeGreaterThan(0)
    }
  })

  it('every contract has at least 1 forbidden claim', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).forbiddenClaims.length).toBeGreaterThan(0)
    }
  })

  it('every contract has at least 1 forbidden lead pattern', () => {
    for (const pt of ALL_PAGE_TYPES) {
      expect(getPageContract(pt).forbiddenLeadPatterns.length).toBeGreaterThan(0)
    }
  })
})

// ─── Group 2: Homepage contract ───────────────────────────────────────────────

describe('Group 2 — Homepage contract: Neil=light, BrandScript leads, no generic article mode', () => {
  const hp = getHomepageContract()

  it('homepage Neil usage is "light"', () => {
    expect(hp.neilLlmFormattingUsage).toBe('light')
  })

  it('homepage primaryFramework is BrandScript + conversion', () => {
    expect(hp.primaryFramework).toContain('BrandScript')
    expect(hp.primaryFramework.toLowerCase()).toContain('conversion')
  })

  it('homepage required sections include patient_problem_framing', () => {
    expect(hp.requiredSections).toContain('patient_problem_framing')
  })

  it('homepage required sections include decision_tool_framing', () => {
    expect(hp.requiredSections).toContain('decision_tool_framing')
  })

  it('homepage required sections include zip_provider_discovery_intent', () => {
    expect(hp.requiredSections).toContain('zip_provider_discovery_intent')
  })

  it('homepage required sections include plan_value_comparison_intent', () => {
    expect(hp.requiredSections).toContain('plan_value_comparison_intent')
  })

  it('homepage required sections include cta_behavior', () => {
    expect(hp.requiredSections).toContain('cta_behavior')
  })

  it('homepage required sections include footer_disclaimer', () => {
    expect(hp.requiredSections).toContain('footer_disclaimer')
  })

  it('homepage forbids blog article format as lead', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('blog article')
  })

  it('homepage forbids "What is a dental membership plan?" as opener', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('what is a dental membership plan')
  })

  it('homepage forbids FAQ section as first visible content', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('faq')
  })

  it('homepage forbids comparison table above the fold', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('comparison table above the fold')
  })

  it('homepage forbids generic dental insurance education as lead', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('generic dental insurance education')
  })

  it('homepage safety flags: genericArticleModeAllowed is false', () => {
    expect(hp.safetyFlags.genericArticleModeAllowed).toBe(false)
  })

  it('homepage forbids "DAP is dental insurance" claim', () => {
    const claims = hp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('dap is dental insurance')
  })
})

// ─── Group 3: Safety flags locked on every page type ─────────────────────────

describe('Group 3 — Safety flags locked on every page type', () => {
  for (const pt of ALL_PAGE_TYPES) {
    it(`${pt}: brandScriptControlsStrategy is true`, () => {
      expect(getPageContract(pt).safetyFlags.brandScriptControlsStrategy).toBe(true)
    })

    it(`${pt}: decisionLockControlsOffer is true`, () => {
      expect(getPageContract(pt).safetyFlags.decisionLockControlsOffer).toBe(true)
    })

    it(`${pt}: dapTruthRulesRequired is true`, () => {
      expect(getPageContract(pt).safetyFlags.dapTruthRulesRequired).toBe(true)
    })

    it(`${pt}: neilFormattingControlsStructureOnly is true`, () => {
      expect(getPageContract(pt).safetyFlags.neilFormattingControlsStructureOnly).toBe(true)
    })

    it(`${pt}: neilFormattingCanOverrideStrategy is false`, () => {
      expect(getPageContract(pt).safetyFlags.neilFormattingCanOverrideStrategy).toBe(false)
    })

    it(`${pt}: genericArticleModeAllowed is false`, () => {
      expect(getPageContract(pt).safetyFlags.genericArticleModeAllowed).toBe(false)
    })

    it(`${pt}: unsupportedSavingsClaimsAllowed is false`, () => {
      expect(getPageContract(pt).safetyFlags.unsupportedSavingsClaimsAllowed).toBe(false)
    })

    it(`${pt}: insuranceReplacementClaimAllowed is false`, () => {
      expect(getPageContract(pt).safetyFlags.insuranceReplacementClaimAllowed).toBe(false)
    })
  }

  it('LOCKED_SAFETY_FLAGS constant matches the expected shape', () => {
    expect(LOCKED_SAFETY_FLAGS.brandScriptControlsStrategy).toBe(true)
    expect(LOCKED_SAFETY_FLAGS.neilFormattingCanOverrideStrategy).toBe(false)
    expect(LOCKED_SAFETY_FLAGS.genericArticleModeAllowed).toBe(false)
    expect(LOCKED_SAFETY_FLAGS.unsupportedSavingsClaimsAllowed).toBe(false)
    expect(LOCKED_SAFETY_FLAGS.insuranceReplacementClaimAllowed).toBe(false)
  })
})

// ─── Group 4: Guide / FAQ / Comparison Neil formatting levels ─────────────────

describe('Group 4 — Guide / FAQ / Comparison use strong+ Neil formatting', () => {
  it('guide uses very_strong Neil formatting', () => {
    expect(getPageContract('guide').neilLlmFormattingUsage).toBe('very_strong')
  })

  it('comparison uses very_strong Neil formatting', () => {
    expect(getPageContract('comparison').neilLlmFormattingUsage).toBe('very_strong')
  })

  it('faq uses full Neil formatting', () => {
    expect(getPageContract('faq').neilLlmFormattingUsage).toBe('full')
  })

  it('blog_article uses full Neil formatting', () => {
    expect(getPageContract('blog_article').neilLlmFormattingUsage).toBe('full')
  })

  it('decision_education uses strong Neil formatting', () => {
    expect(getPageContract('decision_education').neilLlmFormattingUsage).toBe('strong')
  })

  it('guide requires answer-first via direct_answer_hero section', () => {
    expect(getPageContract('guide').requiredSections).toContain('direct_answer_hero')
  })

  it('guide requires toc', () => {
    expect(getPageContract('guide').requiredSections).toContain('toc')
  })

  it('guide requires faq section', () => {
    expect(getPageContract('guide').requiredSections).toContain('faq')
  })

  it('guide requires comparison_block', () => {
    expect(getPageContract('guide').requiredSections).toContain('comparison_block')
  })

  it('guide requires when_it_makes_sense', () => {
    expect(getPageContract('guide').requiredSections).toContain('when_it_makes_sense')
  })

  it('faq requires direct_answer_hero', () => {
    expect(getPageContract('faq').requiredSections).toContain('direct_answer_hero')
  })

  it('faq requires question_h2s', () => {
    expect(getPageContract('faq').requiredSections).toContain('question_h2s')
  })

  it('comparison requires when_it_makes_sense section', () => {
    expect(getPageContract('comparison').requiredSections).toContain('when_it_makes_sense')
  })

  it('comparison requires who_this_is_for section', () => {
    expect(getPageContract('comparison').requiredSections).toContain('who_this_is_for')
  })

  it('comparison requires who_this_is_not_for section', () => {
    expect(getPageContract('comparison').requiredSections).toContain('who_this_is_not_for')
  })

  it('comparison requires claim_safety_language section', () => {
    expect(getPageContract('comparison').requiredSections).toContain('claim_safety_language')
  })
})

// ─── Group 5: City page local discovery intent ────────────────────────────────

describe('Group 5 — City page requires local discovery intent', () => {
  const cp = getPageContract('city_page')

  it('city_page uses very_strong Neil formatting', () => {
    expect(cp.neilLlmFormattingUsage).toBe('very_strong')
  })

  it('city_page primaryFramework references local SEO', () => {
    expect(cp.primaryFramework.toLowerCase()).toContain('local seo')
  })

  it('city_page requires local_discovery_intent section', () => {
    expect(cp.requiredSections).toContain('local_discovery_intent')
  })

  it('city_page requires zip_location_intent section', () => {
    expect(cp.requiredSections).toContain('zip_location_intent')
  })

  it('city_page requires participating_practice_discovery section', () => {
    expect(cp.requiredSections).toContain('participating_practice_discovery')
  })

  it('city_page requires patient_first_positioning section', () => {
    expect(cp.requiredSections).toContain('patient_first_positioning')
  })

  it('city_page requires entity_reinforcement section', () => {
    expect(cp.requiredSections).toContain('entity_reinforcement')
  })

  it('city_page forbids claiming every dentist participates', () => {
    const patterns = cp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('every dentist')
  })

  it('city_page forbids guaranteed savings before practice list', () => {
    const patterns = cp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('guaranteed savings')
  })

  it('city_page forbids emergency availability claim without verified data', () => {
    const patterns = cp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('emergency availability')
  })

  it('city_page forbids specific pricing without data source', () => {
    const patterns = cp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('specific provider pricing')
  })

  it('city_page forbids universal provider availability claim', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('universal provider availability')
  })
})

// ─── Group 6: Practice page PHI and insurance restrictions ───────────────────

describe('Group 6 — Practice page: PHI and insurance claims forbidden', () => {
  const pp = getPageContract('practice_page')

  it('practice_page uses medium Neil formatting (conversion-focused, not SEO-heavy)', () => {
    expect(pp.neilLlmFormattingUsage).toBe('medium')
  })

  it('practice_page requires membership_plan_details section', () => {
    expect(pp.requiredSections).toContain('membership_plan_details')
  })

  it('practice_page requires included_preventive_value section', () => {
    expect(pp.requiredSections).toContain('included_preventive_value')
  })

  it('practice_page requires footer_disclaimer', () => {
    expect(pp.requiredSections).toContain('footer_disclaimer')
  })

  it('practice_page forbids PHI fields as a claim', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('phi')
  })

  it('practice_page forbids SSN, DOB, medical-record in forbidden claims', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('ssn')
  })

  it('practice_page forbids claims-processing language', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('claims-processing language')
  })

  it('practice_page forbids insurance language', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('insurance language')
  })

  it('practice_page forbids unverified pricing', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('unverified pricing')
  })

  it('practice_page forbids exaggerated savings promises', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('exaggerated savings promises')
  })

  it('practice_page lead patterns forbid PHI collection above the fold', () => {
    const patterns = pp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('phi')
  })

  it('practice_page lead patterns forbid insurance claims language', () => {
    const patterns = pp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('insurance claims language')
  })
})

// ─── Group 7: Neil formatting cannot override strategy ────────────────────────

describe('Group 7 — Neil formatting cannot override strategy (all page types)', () => {
  for (const pt of ALL_PAGE_TYPES) {
    it(`${pt}: neilFormattingCanOverrideStrategy is false`, () => {
      expect(getPageContract(pt).safetyFlags.neilFormattingCanOverrideStrategy).toBe(false)
    })

    it(`${pt}: neilFormattingControlsStructureOnly is true`, () => {
      expect(getPageContract(pt).safetyFlags.neilFormattingControlsStructureOnly).toBe(true)
    })

    it(`${pt}: brandScriptControlsStrategy is true`, () => {
      expect(getPageContract(pt).safetyFlags.brandScriptControlsStrategy).toBe(true)
    })
  }
})

// ─── Group 8: DAP truth rules on every page type ──────────────────────────────

describe('Group 8 — DAP truth rules required on every page type', () => {
  it('DAP_REQUIRED_TRUTH_RULES has at least 6 rules', () => {
    expect(DAP_REQUIRED_TRUTH_RULES.length).toBeGreaterThanOrEqual(6)
  })

  it('DAP_REQUIRED_TRUTH_RULES includes "DAP is not dental insurance"', () => {
    expect(DAP_REQUIRED_TRUTH_RULES).toContain('DAP is not dental insurance')
  })

  it('DAP_REQUIRED_TRUTH_RULES includes "DAP does not process claims"', () => {
    expect(DAP_REQUIRED_TRUTH_RULES).toContain('DAP does not process claims')
  })

  it('DAP_REQUIRED_TRUTH_RULES includes "DAP does not collect PHI"', () => {
    expect(DAP_REQUIRED_TRUTH_RULES).toContain('DAP does not collect PHI')
  })

  it('DAP_REQUIRED_TRUTH_RULES includes "DAP does not guarantee savings"', () => {
    expect(DAP_REQUIRED_TRUTH_RULES).toContain('DAP does not guarantee savings')
  })

  for (const pt of ALL_PAGE_TYPES) {
    it(`${pt}: requiredTruthRules includes "DAP is not dental insurance"`, () => {
      expect(getPageContract(pt).requiredTruthRules).toContain('DAP is not dental insurance')
    })

    it(`${pt}: requiredTruthRules includes "DAP does not process claims"`, () => {
      expect(getPageContract(pt).requiredTruthRules).toContain('DAP does not process claims')
    })

    it(`${pt}: requiredTruthRules includes "DAP does not guarantee savings"`, () => {
      expect(getPageContract(pt).requiredTruthRules).toContain('DAP does not guarantee savings')
    })

    it(`${pt}: dapTruthRulesRequired safety flag is true`, () => {
      expect(getPageContract(pt).safetyFlags.dapTruthRulesRequired).toBe(true)
    })
  }
})

// ─── Group 9: Comparison page requires comparison table ──────────────────────

describe('Group 9 — Comparison page: comparison table required', () => {
  const cp = getPageContract('comparison')

  it('comparison page requires comparison_table in requiredSections', () => {
    expect(cp.requiredSections).toContain('comparison_table')
  })

  it('comparison page requires direct_answer_hero', () => {
    expect(cp.requiredSections).toContain('direct_answer_hero')
  })

  it('comparison page forbids "DAP is always cheaper than insurance"', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('dap is always cheaper')
  })

  it('comparison page forbids "DAP is always better"', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('dap is always better')
  })

  it('comparison page forbids declaring DAP winner before comparison', () => {
    const patterns = cp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('dap declared winner before comparison')
  })

  it('comparison page Neil usage is very_strong', () => {
    expect(cp.neilLlmFormattingUsage).toBe('very_strong')
  })
})

// ─── Group 10: No page permits unsupported savings or insurance replacement claims ──

describe('Group 10 — No page type permits unsupported savings or insurance replacement claims', () => {
  for (const pt of ALL_PAGE_TYPES) {
    it(`${pt}: unsupportedSavingsClaimsAllowed is false`, () => {
      expect(getPageContract(pt).safetyFlags.unsupportedSavingsClaimsAllowed).toBe(false)
    })

    it(`${pt}: insuranceReplacementClaimAllowed is false`, () => {
      expect(getPageContract(pt).safetyFlags.insuranceReplacementClaimAllowed).toBe(false)
    })

    it(`${pt}: forbiddenClaims includes "guaranteed savings"`, () => {
      const claims = getPageContract(pt).forbiddenClaims.join(' ').toLowerCase()
      expect(claims).toContain('guaranteed savings')
    })

    it(`${pt}: forbiddenClaims includes "DAP is dental insurance" or "DAP covers procedures" or "DAP replaces insurance"`, () => {
      const claims = getPageContract(pt).forbiddenClaims.join(' ').toLowerCase()
      const hasInsuranceClaim =
        claims.includes('dap is dental insurance') ||
        claims.includes('dap covers procedures') ||
        claims.includes('dap replaces insurance')
      expect(hasInsuranceClaim).toBe(true)
    })
  }
})

// ─── Group 11: Preview route ──────────────────────────────────────────────────

describe('Group 11 — Preview route exists and is read-only', () => {
  const PREVIEW_PATH = resolve(ROOT, 'app/preview/cbseoaeo/page-generation-contract/page.tsx')

  it('app/preview/cbseoaeo/page-generation-contract/page.tsx exists', () => {
    expect(existsSync(PREVIEW_PATH)).toBe(true)
  })

  it('preview page does not use "use client"', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('preview page has no <form> elements', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).not.toContain('<form')
  })

  it('preview page has no generation buttons', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).not.toContain("type=\"submit\"")
    expect(src).not.toContain("Generate")
  })

  it('preview page has no external fetch or API calls', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('axios')
    expect(src).not.toContain('supabase')
  })

  it('preview page renders all 8 page types', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('homepage')
    expect(src).toContain('guide')
    expect(src).toContain('comparison')
    expect(src).toContain('faq')
    expect(src).toContain('city_page')
    expect(src).toContain('practice_page')
    expect(src).toContain('blog_article')
    expect(src).toContain('decision_education')
  })

  it('preview page imports CB_SEOAEO_PAGE_CONTRACTS', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('CB_SEOAEO_PAGE_CONTRACTS')
  })

  it('preview page has data-preview-page attribute', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-preview-page')
  })
})
