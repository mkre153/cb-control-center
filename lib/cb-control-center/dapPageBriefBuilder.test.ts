/**
 * Phase 18D — DAP Page Brief Builder
 *
 * PURPOSE: Lock the page brief builder so no brief can silently weaken the
 * Phase 18C contracts, drop truth rules, relax safety flags, or claim
 * forbidden things. All tests are structural (import + assertion) — no
 * rendering, no generation, no external calls.
 *
 * COVERAGE:
 *   Group 1  — All 8 Phase 18C page types return valid briefs
 *   Group 2  — Homepage brief: BrandScript-first, light Neil, no generic article opener
 *   Group 3  — Safety flags preserved on every brief
 *   Group 4  — DAP truth rules inherited on every brief
 *   Group 5  — Comparison brief: comparison table required, answer-first, no overclaiming
 *   Group 6  — FAQ brief: full Neil formatting, direct answers first
 *   Group 7  — City brief: local discovery intent, no fake counts, no universal availability
 *   Group 8  — Practice brief: no PHI, no insurance claims-processing
 *   Group 9  — Contract fields preserved (required sections, forbidden claims, lead patterns)
 *   Group 10 — CTA rules: primary CTA present, no forbidden CTAs on any page
 *   Group 11 — Wireframe order: at least 3 steps per page type
 *   Group 12 — Prompt seeds: at least pageOpeningPrompt + sectionPrompt present
 *   Group 13 — Preview page: read-only, no forms/buttons/fetch, renders all brief cards
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import {
  buildDapPageBrief,
  buildAllDapPageBriefs,
  getAllDapBriefPageTypes,
} from './dapPageBriefBuilder'
import {
  getAllPageTypes,
  getPageContract,
  DAP_REQUIRED_TRUTH_RULES,
} from './cbSeoAeoPageGeneration'
import { neilUsageRank } from './cbSeoAeoLlmFormatting'

const ROOT = resolve(__dirname, '../..')

const ALL_CONTRACT_TYPES = getAllPageTypes()
const ALL_BRIEF_TYPES = getAllDapBriefPageTypes()
const ALL_BRIEFS = buildAllDapPageBriefs()

// ─── Group 1: All 8 page types return valid briefs ────────────────────────────

describe('Group 1 — All 8 Phase 18C page types return valid briefs', () => {
  it('brief builder covers every Phase 18C page type', () => {
    for (const pt of ALL_CONTRACT_TYPES) {
      expect(ALL_BRIEF_TYPES).toContain(pt)
    }
  })

  it('buildAllDapPageBriefs returns exactly 8 briefs', () => {
    expect(ALL_BRIEFS).toHaveLength(8)
  })

  for (const pt of ALL_CONTRACT_TYPES) {
    it(`buildDapPageBrief("${pt}") returns a brief with the correct pageType`, () => {
      const brief = buildDapPageBrief(pt)
      expect(brief.pageType).toBe(pt)
    })

    it(`${pt} brief has a non-empty strategicPurpose`, () => {
      expect(buildDapPageBrief(pt).strategicPurpose.length).toBeGreaterThan(10)
    })

    it(`${pt} brief has a non-empty conversionRole`, () => {
      expect(buildDapPageBrief(pt).conversionRole.length).toBeGreaterThan(5)
    })

    it(`${pt} brief has a non-empty primaryVisitorIntent`, () => {
      expect(buildDapPageBrief(pt).primaryVisitorIntent.length).toBeGreaterThan(5)
    })

    it(`${pt} brief has a non-empty brandScriptRole`, () => {
      expect(buildDapPageBrief(pt).brandScriptRole.length).toBeGreaterThan(10)
    })

    it(`${pt} brief has a non-empty seoAeoRole`, () => {
      expect(buildDapPageBrief(pt).seoAeoRole.length).toBeGreaterThan(10)
    })
  }
})

// ─── Group 2: Homepage brief ──────────────────────────────────────────────────

describe('Group 2 — Homepage brief: BrandScript-first, light Neil, no generic article opener', () => {
  const hp = buildDapPageBrief('homepage')

  it('homepage Neil usage is "light"', () => {
    expect(hp.neilFormattingUsage).toBe('light')
  })

  it('homepage brandScriptRole mentions BrandScript-first', () => {
    expect(hp.brandScriptRole.toLowerCase()).toContain('brandscript')
  })

  it('homepage seoAeoRole says minimal SEO/AEO formatting', () => {
    expect(hp.seoAeoRole.toLowerCase()).toContain('minimal')
  })

  it('homepage seoAeoRole warns against turning it into an informational article', () => {
    expect(hp.seoAeoRole.toLowerCase()).toContain('article')
  })

  it('homepage primaryVisitorIntent mentions practice discovery', () => {
    expect(hp.primaryVisitorIntent.toLowerCase()).toContain('practice')
  })

  it('homepage requiredSections includes patient_problem_framing', () => {
    expect(hp.requiredSections).toContain('patient_problem_framing')
  })

  it('homepage requiredSections includes zip_provider_discovery_intent', () => {
    expect(hp.requiredSections).toContain('zip_provider_discovery_intent')
  })

  it('homepage requiredSections includes decision_tool_framing', () => {
    expect(hp.requiredSections).toContain('decision_tool_framing')
  })

  it('homepage forbiddenLeadPatterns includes generic dental membership plan opener', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('what is a dental membership plan')
  })

  it('homepage forbiddenLeadPatterns includes blog article format', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('blog article')
  })

  it('homepage forbiddenLeadPatterns includes FAQ as first content', () => {
    const patterns = hp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('faq')
  })

  it('homepage wireframeOrder leads with problem-aware hero', () => {
    expect(hp.recommendedWireframeOrder[0].toLowerCase()).toContain('hero')
  })

  it('homepage wireframeOrder includes ZIP discovery as second step', () => {
    const order = hp.recommendedWireframeOrder.join(' ').toLowerCase()
    expect(order).toContain('zip')
  })

  it('homepage ctaRules primaryCta mentions practice search', () => {
    expect(hp.ctaRules.primaryCta.toLowerCase()).toContain('practice')
  })

  it('homepage ctaRules forbids "sign up for dental insurance" CTA', () => {
    const forbidden = hp.ctaRules.forbiddenCtas.join(' ').toLowerCase()
    expect(forbidden).toContain('insurance')
  })

  it('homepage generationPromptSeeds pageOpeningPrompt mentions patient problem', () => {
    expect(hp.generationPromptSeeds.pageOpeningPrompt.toLowerCase()).toContain('patient problem')
  })

  it('homepage generationPromptSeeds warns against opening with a DAP definition', () => {
    const prompt = hp.generationPromptSeeds.pageOpeningPrompt.toLowerCase()
    expect(prompt).toContain('do not open with')
  })
})

// ─── Group 3: Safety flags preserved on every brief ──────────────────────────

describe('Group 3 — Safety flags preserved on every brief', () => {
  for (const pt of ALL_CONTRACT_TYPES) {
    it(`${pt}: brandScriptControlsStrategy is true`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.brandScriptControlsStrategy).toBe(true)
    })

    it(`${pt}: decisionLockControlsOffer is true`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.decisionLockControlsOffer).toBe(true)
    })

    it(`${pt}: dapTruthRulesRequired is true`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.dapTruthRulesRequired).toBe(true)
    })

    it(`${pt}: neilFormattingControlsStructureOnly is true`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.neilFormattingControlsStructureOnly).toBe(true)
    })

    it(`${pt}: neilFormattingCanOverrideStrategy is false`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.neilFormattingCanOverrideStrategy).toBe(false)
    })

    it(`${pt}: genericArticleModeAllowed is false`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.genericArticleModeAllowed).toBe(false)
    })

    it(`${pt}: unsupportedSavingsClaimsAllowed is false`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.unsupportedSavingsClaimsAllowed).toBe(false)
    })

    it(`${pt}: insuranceReplacementClaimAllowed is false`, () => {
      expect(buildDapPageBrief(pt).safetyFlags.insuranceReplacementClaimAllowed).toBe(false)
    })
  }
})

// ─── Group 4: DAP truth rules inherited on every brief ────────────────────────

describe('Group 4 — DAP truth rules inherited on every brief', () => {
  for (const pt of ALL_CONTRACT_TYPES) {
    it(`${pt}: dapTruthRules includes "DAP is not dental insurance"`, () => {
      expect(buildDapPageBrief(pt).dapTruthRules).toContain('DAP is not dental insurance')
    })

    it(`${pt}: dapTruthRules includes "DAP does not process claims"`, () => {
      expect(buildDapPageBrief(pt).dapTruthRules).toContain('DAP does not process claims')
    })

    it(`${pt}: dapTruthRules includes "DAP does not guarantee savings"`, () => {
      expect(buildDapPageBrief(pt).dapTruthRules).toContain('DAP does not guarantee savings')
    })

    it(`${pt}: dapTruthRules includes "DAP does not collect PHI"`, () => {
      expect(buildDapPageBrief(pt).dapTruthRules).toContain('DAP does not collect PHI')
    })
  }

  it('all briefs share the same truth rule set (no divergence)', () => {
    const referenceRules = buildDapPageBrief('homepage').dapTruthRules
    for (const pt of ALL_CONTRACT_TYPES) {
      const brief = buildDapPageBrief(pt)
      for (const rule of DAP_REQUIRED_TRUTH_RULES) {
        expect(brief.dapTruthRules, `${pt} brief missing rule: "${rule}"`).toContain(rule)
      }
      expect(brief.dapTruthRules.length).toBe(referenceRules.length)
    }
  })
})

// ─── Group 5: Comparison brief ────────────────────────────────────────────────

describe('Group 5 — Comparison brief: comparison table required, no overclaiming', () => {
  const cp = buildDapPageBrief('comparison')

  it('comparison Neil usage is "very_strong"', () => {
    expect(cp.neilFormattingUsage).toBe('very_strong')
  })

  it('comparison requiredSections includes comparison_table', () => {
    expect(cp.requiredSections).toContain('comparison_table')
  })

  it('comparison requiredSections includes direct_answer_hero', () => {
    expect(cp.requiredSections).toContain('direct_answer_hero')
  })

  it('comparison requiredSections includes who_this_is_for', () => {
    expect(cp.requiredSections).toContain('who_this_is_for')
  })

  it('comparison requiredSections includes who_this_is_not_for', () => {
    expect(cp.requiredSections).toContain('who_this_is_not_for')
  })

  it('comparison requiredSections includes claim_safety_language', () => {
    expect(cp.requiredSections).toContain('claim_safety_language')
  })

  it('comparison forbiddenClaims includes "DAP is always cheaper than insurance"', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('dap is always cheaper')
  })

  it('comparison forbiddenClaims includes "DAP is always better"', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('dap is always better')
  })

  it('comparison wireframeOrder leads with direct answer hero', () => {
    expect(cp.recommendedWireframeOrder[0].toLowerCase()).toContain('direct answer')
  })

  it('comparison wireframeOrder includes comparison table step', () => {
    const order = cp.recommendedWireframeOrder.join(' ').toLowerCase()
    expect(order).toContain('comparison table')
  })

  it('comparison wireframeOrder includes "who this is NOT for" step', () => {
    const order = cp.recommendedWireframeOrder.join(' ').toLowerCase()
    expect(order).toContain('not for')
  })

  it('comparison generationPromptSeeds has comparisonPrompt', () => {
    expect(cp.generationPromptSeeds.comparisonPrompt).toBeTruthy()
  })

  it('comparison comparisonPrompt warns against declaring DAP the winner', () => {
    const prompt = (cp.generationPromptSeeds.comparisonPrompt ?? '').toLowerCase()
    expect(prompt).toContain('neutral')
  })

  it('comparison ctaRules forbids "cancel your insurance and join DAP" CTA', () => {
    const forbidden = cp.ctaRules.forbiddenCtas.join(' ').toLowerCase()
    expect(forbidden).toContain('cancel')
  })
})

// ─── Group 6: FAQ brief ───────────────────────────────────────────────────────

describe('Group 6 — FAQ brief: full Neil formatting, direct answers first', () => {
  const faq = buildDapPageBrief('faq')

  it('faq Neil usage is "full"', () => {
    expect(faq.neilFormattingUsage).toBe('full')
  })

  it('faq requiredSections includes direct_answer_hero', () => {
    expect(faq.requiredSections).toContain('direct_answer_hero')
  })

  it('faq requiredSections includes question_h2s', () => {
    expect(faq.requiredSections).toContain('question_h2s')
  })

  it('faq requiredSections includes faq', () => {
    expect(faq.requiredSections).toContain('faq')
  })

  it('faq generationPromptSeeds has faqPrompt', () => {
    expect(faq.generationPromptSeeds.faqPrompt).toBeTruthy()
  })

  it('faq faqPrompt includes guidance on answer length', () => {
    const prompt = (faq.generationPromptSeeds.faqPrompt ?? '').toLowerCase()
    expect(prompt).toContain('1')
  })

  it('faq wireframeOrder includes FAQ section step', () => {
    const order = faq.recommendedWireframeOrder.join(' ').toLowerCase()
    expect(order).toContain('faq')
  })

  it('faq seoAeoRole mentions featured snippets or LLM extraction', () => {
    const role = faq.seoAeoRole.toLowerCase()
    const hasSignal = role.includes('featured snippet') || role.includes('llm') || role.includes('extraction')
    expect(hasSignal).toBe(true)
  })
})

// ─── Group 7: City brief ──────────────────────────────────────────────────────

describe('Group 7 — City brief: local discovery intent, no fake counts, no universal availability', () => {
  const cp = buildDapPageBrief('city_page')

  it('city_page Neil usage is "very_strong"', () => {
    expect(cp.neilFormattingUsage).toBe('very_strong')
  })

  it('city_page requiredSections includes local_discovery_intent', () => {
    expect(cp.requiredSections).toContain('local_discovery_intent')
  })

  it('city_page requiredSections includes zip_location_intent', () => {
    expect(cp.requiredSections).toContain('zip_location_intent')
  })

  it('city_page requiredSections includes participating_practice_discovery', () => {
    expect(cp.requiredSections).toContain('participating_practice_discovery')
  })

  it('city_page requiredSections includes entity_reinforcement', () => {
    expect(cp.requiredSections).toContain('entity_reinforcement')
  })

  it('city_page forbiddenLeadPatterns bans claiming every dentist participates', () => {
    const patterns = cp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('every dentist')
  })

  it('city_page forbiddenClaims includes universal provider availability', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('universal provider availability')
  })

  it('city_page forbiddenClaims includes guaranteed savings in city', () => {
    const claims = cp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('guaranteed savings')
  })

  it('city_page generationPromptSeeds has localPrompt', () => {
    expect(cp.generationPromptSeeds.localPrompt).toBeTruthy()
  })

  it('city_page localPrompt references [CITY] placeholder', () => {
    expect(cp.generationPromptSeeds.localPrompt).toContain('[CITY]')
  })

  it('city_page localPrompt warns against fabricating practice counts', () => {
    const prompt = (cp.generationPromptSeeds.localPrompt ?? '').toLowerCase()
    expect(prompt).toContain('do not')
  })

  it('city_page seoAeoRole mentions local SEO', () => {
    expect(cp.seoAeoRole.toLowerCase()).toContain('local seo')
  })

  it('city_page wireframeOrder includes local hero as first step', () => {
    expect(cp.recommendedWireframeOrder[0].toLowerCase()).toContain('local')
  })
})

// ─── Group 8: Practice brief ──────────────────────────────────────────────────

describe('Group 8 — Practice brief: no PHI, no insurance claims-processing', () => {
  const pp = buildDapPageBrief('practice_page')

  it('practice_page Neil usage is "medium"', () => {
    expect(pp.neilFormattingUsage).toBe('medium')
  })

  it('practice_page requiredSections includes membership_plan_details', () => {
    expect(pp.requiredSections).toContain('membership_plan_details')
  })

  it('practice_page requiredSections includes included_preventive_value', () => {
    expect(pp.requiredSections).toContain('included_preventive_value')
  })

  it('practice_page requiredSections includes footer_disclaimer', () => {
    expect(pp.requiredSections).toContain('footer_disclaimer')
  })

  it('practice_page forbiddenClaims includes PHI fields', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('phi')
  })

  it('practice_page forbiddenClaims includes SSN', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('ssn')
  })

  it('practice_page forbiddenClaims includes claims-processing language', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('claims-processing language')
  })

  it('practice_page forbiddenClaims includes insurance language', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('insurance language')
  })

  it('practice_page forbiddenClaims includes unverified pricing', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('unverified pricing')
  })

  it('practice_page forbiddenClaims includes guaranteed savings', () => {
    const claims = pp.forbiddenClaims.join(' ').toLowerCase()
    expect(claims).toContain('guaranteed savings')
  })

  it('practice_page forbiddenLeadPatterns bans PHI collection above the fold', () => {
    const patterns = pp.forbiddenLeadPatterns.join(' ').toLowerCase()
    expect(patterns).toContain('phi')
  })

  it('practice_page generationPromptSeeds warns against implying DAP owns the practice', () => {
    const prompt = pp.generationPromptSeeds.pageOpeningPrompt.toLowerCase()
    expect(prompt).toContain('does not')
  })
})

// ─── Group 9: Contract fields preserved ──────────────────────────────────────

describe('Group 9 — Contract fields preserved (sections, claims, lead patterns not weakened)', () => {
  it('homepage brief required sections are a superset of the Phase 18C contract required sections', () => {
    const contract = getPageContract('homepage')
    const brief = buildDapPageBrief('homepage')
    for (const section of contract.requiredSections) {
      expect(brief.requiredSections, `homepage brief missing required section: "${section}"`).toContain(section)
    }
  })

  it('comparison brief forbidden claims are a superset of the Phase 18C contract forbidden claims', () => {
    const contract = getPageContract('comparison')
    const brief = buildDapPageBrief('comparison')
    for (const claim of contract.forbiddenClaims) {
      expect(brief.forbiddenClaims, `comparison brief missing forbidden claim: "${claim}"`).toContain(claim)
    }
  })

  it('city_page brief forbidden lead patterns are a superset of the Phase 18C contract patterns', () => {
    const contract = getPageContract('city_page')
    const brief = buildDapPageBrief('city_page')
    for (const pattern of contract.forbiddenLeadPatterns) {
      expect(brief.forbiddenLeadPatterns, `city_page brief missing forbidden lead pattern: "${pattern}"`).toContain(pattern)
    }
  })

  it('no brief loosens Neil usage beyond what the Phase 18C contract allows', () => {
    for (const pt of ALL_CONTRACT_TYPES) {
      const contract = getPageContract(pt)
      const brief = buildDapPageBrief(pt)
      expect(
        neilUsageRank(brief.neilFormattingUsage),
        `${pt} brief Neil usage exceeds contract`
      ).toBeLessThanOrEqual(neilUsageRank(contract.neilLlmFormattingUsage))
    }
  })
})

// ─── Group 10: CTA rules ──────────────────────────────────────────────────────

describe('Group 10 — CTA rules: primary CTA present, forbidden CTAs present', () => {
  for (const pt of ALL_CONTRACT_TYPES) {
    it(`${pt}: ctaRules.primaryCta is non-empty`, () => {
      expect(buildDapPageBrief(pt).ctaRules.primaryCta.length).toBeGreaterThan(5)
    })

    it(`${pt}: ctaRules.forbiddenCtas has at least 1 entry`, () => {
      expect(buildDapPageBrief(pt).ctaRules.forbiddenCtas.length).toBeGreaterThanOrEqual(1)
    })
  }

  it('no page type allows "guaranteed savings" as a CTA', () => {
    for (const pt of ALL_CONTRACT_TYPES) {
      const primary = buildDapPageBrief(pt).ctaRules.primaryCta.toLowerCase()
      expect(primary).not.toContain('guaranteed savings')
    }
  })

  it('no page type allows "buy insurance" as a primary CTA', () => {
    for (const pt of ALL_CONTRACT_TYPES) {
      const primary = buildDapPageBrief(pt).ctaRules.primaryCta.toLowerCase()
      expect(primary).not.toContain('buy insurance')
    }
  })
})

// ─── Group 11: Wireframe order ────────────────────────────────────────────────

describe('Group 11 — Wireframe order: at least 3 steps per page type', () => {
  for (const pt of ALL_CONTRACT_TYPES) {
    it(`${pt}: recommendedWireframeOrder has at least 3 steps`, () => {
      expect(buildDapPageBrief(pt).recommendedWireframeOrder.length).toBeGreaterThanOrEqual(3)
    })
  }

  it('every wireframe order ends with a CTA or disclaimer step', () => {
    for (const pt of ALL_CONTRACT_TYPES) {
      const order = buildDapPageBrief(pt).recommendedWireframeOrder
      const last = order[order.length - 1].toLowerCase()
      const hasCtaOrDisclaimer = last.includes('cta') || last.includes('disclaimer') || last.includes('footer')
      expect(hasCtaOrDisclaimer, `${pt} wireframe order does not end with CTA or disclaimer`).toBe(true)
    }
  })
})

// ─── Group 12: Prompt seeds ───────────────────────────────────────────────────

describe('Group 12 — Prompt seeds: pageOpeningPrompt + sectionPrompt present', () => {
  for (const pt of ALL_CONTRACT_TYPES) {
    it(`${pt}: generationPromptSeeds.pageOpeningPrompt is non-empty`, () => {
      expect(buildDapPageBrief(pt).generationPromptSeeds.pageOpeningPrompt.length).toBeGreaterThan(10)
    })

    it(`${pt}: generationPromptSeeds.sectionPrompt is non-empty`, () => {
      expect(buildDapPageBrief(pt).generationPromptSeeds.sectionPrompt.length).toBeGreaterThan(10)
    })
  }

  it('guide brief has a faqPrompt', () => {
    expect(buildDapPageBrief('guide').generationPromptSeeds.faqPrompt).toBeTruthy()
  })

  it('comparison brief has a comparisonPrompt', () => {
    expect(buildDapPageBrief('comparison').generationPromptSeeds.comparisonPrompt).toBeTruthy()
  })

  it('city_page brief has a localPrompt', () => {
    expect(buildDapPageBrief('city_page').generationPromptSeeds.localPrompt).toBeTruthy()
  })

  it('homepage opening prompt does not start with a definition of DAP', () => {
    const prompt = buildDapPageBrief('homepage').generationPromptSeeds.pageOpeningPrompt.toLowerCase()
    expect(prompt).not.toMatch(/^open with (?:a definition|what is dap)/i)
  })

  it('no page opening prompt claims guaranteed savings', () => {
    for (const pt of ALL_CONTRACT_TYPES) {
      const prompt = buildDapPageBrief(pt).generationPromptSeeds.pageOpeningPrompt.toLowerCase()
      expect(prompt).not.toContain('guaranteed savings')
    }
  })
})

// ─── Group 13: Preview page ───────────────────────────────────────────────────

describe('Group 13 — Preview page: read-only, no forms/buttons/fetch', () => {
  const PREVIEW_PATH = resolve(ROOT, 'app/preview/dap/page-briefs/page.tsx')

  it('app/preview/dap/page-briefs/page.tsx exists', () => {
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

  it('preview page has no generate/submit buttons', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).not.toContain('type="submit"')
    expect(src.toLowerCase()).not.toContain('generate')
  })

  it('preview page has no external fetch or API calls', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('axios')
    expect(src).not.toContain('supabase')
  })

  it('preview page has data-dap-page-briefs-preview marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-dap-page-briefs-preview')
  })

  it('preview page has data-page-brief-card marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-page-brief-card')
  })

  it('preview page has data-page-brief-safety-flags marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-page-brief-safety-flags')
  })

  it('preview page has data-page-brief-truth-rules marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-page-brief-truth-rules')
  })

  it('preview page has data-page-brief-wireframe-order marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-page-brief-wireframe-order')
  })

  it('preview page has data-page-brief-prompt-seeds marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-page-brief-prompt-seeds')
  })

  it('preview page has data-page-brief-forbidden-claims marker', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('data-page-brief-forbidden-claims')
  })

  it('preview page imports buildAllDapPageBriefs', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('buildAllDapPageBriefs')
  })

  it('preview page renders all 8 page type cards', () => {
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
})
