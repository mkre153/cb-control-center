/**
 * DAP Page Brief Builder — Phase 18D
 *
 * Converts Phase 18C page-generation contracts into structured, read-only
 * briefs that capture everything a content generator needs: visitor intent,
 * BrandScript role, SEO/AEO role, wireframe order, CTA rules, and prompt seeds.
 *
 * This module is a bridge layer — contract-only. No generation logic, no AI
 * calls, no content writing, no database writes.
 */

import {
  getPageContract,
  getAllPageTypes,
  LOCKED_SAFETY_FLAGS,
  DAP_REQUIRED_TRUTH_RULES,
  type CBSeoAeoPageType,
  type CBSeoAeoPageSafetyFlags,
} from './cbSeoAeoPageGeneration'
import type { NeilLlmFormattingUsage } from './cbSeoAeoLlmFormatting'

// ─── Brief shape ──────────────────────────────────────────────────────────────

export interface DapPageBriefCtaRules {
  readonly primaryCta: string
  readonly secondaryCta?: string
  readonly forbiddenCtas: readonly string[]
}

export interface DapPageBriefPromptSeeds {
  readonly pageOpeningPrompt: string
  readonly sectionPrompt: string
  readonly faqPrompt?: string
  readonly comparisonPrompt?: string
  readonly localPrompt?: string
}

export interface DapPageBrief {
  readonly pageType: CBSeoAeoPageType
  readonly strategicPurpose: string
  readonly conversionRole: string
  readonly primaryVisitorIntent: string
  readonly secondaryVisitorIntent?: string
  readonly brandScriptRole: string
  readonly seoAeoRole: string
  readonly neilFormattingUsage: NeilLlmFormattingUsage
  readonly requiredSections: readonly string[]
  readonly optionalSections: readonly string[]
  readonly forbiddenClaims: readonly string[]
  readonly forbiddenLeadPatterns: readonly string[]
  readonly dapTruthRules: readonly string[]
  readonly safetyFlags: CBSeoAeoPageSafetyFlags
  readonly recommendedWireframeOrder: readonly string[]
  readonly ctaRules: DapPageBriefCtaRules
  readonly generationPromptSeeds: DapPageBriefPromptSeeds
}

// ─── Brief additions (what the brief adds on top of the Phase 18C contract) ──

interface DapPageBriefAdditions {
  readonly primaryVisitorIntent: string
  readonly secondaryVisitorIntent?: string
  readonly brandScriptRole: string
  readonly seoAeoRole: string
  readonly recommendedWireframeOrder: readonly string[]
  readonly ctaRules: DapPageBriefCtaRules
  readonly generationPromptSeeds: DapPageBriefPromptSeeds
}

const BRIEF_ADDITIONS: Record<CBSeoAeoPageType, DapPageBriefAdditions> = {

  homepage: {
    primaryVisitorIntent: 'Discover whether participating DAP dental practices are near them',
    secondaryVisitorIntent: 'Understand how DAP works before searching',
    brandScriptRole: 'BrandScript-first: establish patient problem (high costs, no insurance), guide to solution (DAP discovery), reveal the plan (search → request → join). Hero must lead with friction, not education.',
    seoAeoRole: 'Branded homepage only — minimal SEO/AEO formatting. BrandScript and conversion flow take precedence. Neil usage is light. Do not turn homepage into an informational article.',
    recommendedWireframeOrder: [
      'Problem-aware hero (patient friction first)',
      'ZIP / practice discovery action',
      'Simple explanation of what DAP is',
      'Value proof / savings scenarios',
      'Participating practice trust layer',
      'Insurance comparison teaser',
      'FAQ block (optional, below fold)',
      'Final CTA',
    ],
    ctaRules: {
      primaryCta: 'Search for a participating practice near you',
      secondaryCta: 'Read the guide (5-minute overview)',
      forbiddenCtas: [
        'Sign up for dental insurance',
        'Get a quote',
        'Buy a plan',
        'Submit a claim',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with the patient problem: dental care is expensive without insurance. Do not open with a definition of DAP or a generic dental health fact. DAP is not insurance. DAP is a directory of practices that offer membership plans.',
      sectionPrompt: 'Each section must advance the patient toward a search action. No section may claim guaranteed savings, insurance replacement, or universal availability.',
      faqPrompt: 'If a FAQ block is included, place it below the fold. Keep answers short (1–2 sentences). Do not answer with savings guarantees.',
    },
  },

  guide: {
    primaryVisitorIntent: 'Learn about all dental care options when uninsured or underinsured',
    secondaryVisitorIntent: 'Decide which option is best for their specific situation',
    brandScriptRole: 'Empathetic guide: you are not alone, here are your real options. Position DAP as one tool among several — not the only answer.',
    seoAeoRole: 'Primary educational content target. Very strong LLM formatting — direct answers, TOC, question H2s, FAQs, comparison blocks. Answer-first throughout.',
    recommendedWireframeOrder: [
      'Direct answer hero (what are my options?)',
      'Quick summary (5-bullet TL;DR)',
      'Table of contents',
      'Option 1: Pay cash',
      'Option 2: Dental insurance',
      'Option 3: Membership plans (how DAP fits here)',
      'Option 4: Financing',
      'Option 5: Community clinics',
      'Option 6: Dental schools',
      'Which option is right for you? (decision tree)',
      'FAQ (8+ questions)',
      'Final CTA',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Find a participating DAP practice near you',
      secondaryCta: 'Compare options side by side',
      forbiddenCtas: [
        'Buy insurance now',
        'Get guaranteed savings',
        'Enroll in coverage',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with a direct answer to "what are my dental care options without insurance?" List all 6 options immediately. Do not lead with DAP promotion.',
      sectionPrompt: 'Each option section must fairly describe the option, including its limitations. DAP section must note it is not insurance and availability varies by location.',
      faqPrompt: 'FAQ should address top long-tail queries: "how much does a dental membership plan cost", "is DAP worth it", "what does DAP cover", etc. Answers must be accurate and not oversell.',
      comparisonPrompt: 'When comparing options, use a neutral tone. Do not declare any one option universally superior. Include when each option is and is not appropriate.',
    },
  },

  comparison: {
    primaryVisitorIntent: 'Compare DAP to dental insurance and paying cash in a single clear view',
    secondaryVisitorIntent: 'Determine whether DAP is the right choice for their situation',
    brandScriptRole: 'Honest comparison guide: help the patient make an informed decision. DAP wins on access speed and no-claims simplicity — not on being cheaper than insurance in every case.',
    seoAeoRole: 'High-value SEO/AEO comparison target. Very strong LLM formatting required. Comparison table mandatory. Featured snippet candidate.',
    recommendedWireframeOrder: [
      'Direct answer hero (is DAP better than insurance?)',
      'Comparison table (DAP vs. Insurance vs. Cash)',
      'Who this is for (uninsured, underinsured, between jobs)',
      'Who this is NOT for (complex care needs, high utilization)',
      'Claim safety language (DAP does not set pricing)',
      'When DAP makes sense',
      'When insurance makes more sense',
      'Final CTA',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Find a participating practice in your area',
      secondaryCta: 'Read the 5-minute dental care guide',
      forbiddenCtas: [
        'Get guaranteed savings',
        'Switch from insurance to DAP',
        'Cancel your insurance and join DAP',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with a direct answer: DAP is not insurance. DAP is a way to find dental practices that offer membership plans. Here is how it compares to insurance and paying cash.',
      sectionPrompt: 'All comparison rows must be factually accurate. Do not claim DAP is always cheaper. Do not claim insurance is always worse. Note that DAP pricing is set by each participating practice.',
      comparisonPrompt: 'Use neutral framing throughout. Comparison table rows: monthly cost, waiting period, claim forms, procedure coverage, availability, cancellation. Use ✓ / ✗ / "Varies" notation. Never use "Better" as a table value.',
    },
  },

  faq: {
    primaryVisitorIntent: 'Get quick, direct answers to specific questions about DAP',
    secondaryVisitorIntent: 'Verify that DAP is safe, legitimate, and relevant to their needs',
    brandScriptRole: 'Patient support guide: answer with confidence and honesty. Short answers first, expansion available. No upsell in the answers.',
    seoAeoRole: 'Long-tail SEO / AEO capture. Full Neil formatting. Short direct answers optimized for LLM extraction and featured snippets. Question H2s required.',
    recommendedWireframeOrder: [
      'Direct answer hero (what is DAP?)',
      'Quick summary (top 5 facts)',
      'FAQ section (8–12 Q&A pairs)',
      'Entity reinforcement (3+ brand mentions in varied positions)',
      'Final CTA',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Search for a participating practice near you',
      forbiddenCtas: [
        'Buy insurance',
        'Guarantee your savings',
        'Process a claim',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with the most common question: "What is the Dental Advantage Plan?" Answer in 1–2 sentences. Do not use jargon.',
      sectionPrompt: 'Each FAQ answer must be 1–3 sentences. Lead with the direct answer. Add context below. No answer may imply guaranteed savings or insurance replacement.',
      faqPrompt: 'Keep answers to 1-2 sentences each. Prioritize questions users actually search: "what does dental advantage plan cover", "how much does it cost", "is it insurance", "how do I find a dentist", "can I cancel". Answer each accurately.',
    },
  },

  city_page: {
    primaryVisitorIntent: 'Find a participating DAP dental practice in a specific city or area',
    secondaryVisitorIntent: 'Understand what participating practices in their area offer',
    brandScriptRole: 'Local discovery guide: help the patient connect to a practice near them. No national claims. City-specific framing throughout.',
    seoAeoRole: 'Local SEO primary target. Very strong LLM formatting. Core 30 + Nate SEO entity reinforcement for city name + dental + membership plan. Location intent required.',
    recommendedWireframeOrder: [
      'Local direct answer hero (participating practices in [CITY])',
      'ZIP / location search or filter',
      'Participating practice listing or discovery section',
      'What DAP is (brief, city-specific framing)',
      'Entity reinforcement (city name + dental + membership plan)',
      'Patient-first positioning',
      'Final CTA',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Search for a participating practice in [CITY]',
      secondaryCta: 'Learn how DAP works',
      forbiddenCtas: [
        'Every dentist in [CITY] is participating — join now',
        'Guaranteed savings in [CITY]',
        'Get covered in [CITY]',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open by naming the city and confirming participation availability (or noting it is expanding). Do not claim that every dentist in the city participates. Reference [CITY] by name 3+ times.',
      sectionPrompt: 'Each section must reference the city context. Avoid boilerplate. Participating practice details must come from verified data — do not fabricate counts or pricing.',
      localPrompt: 'Write about dental care access in [CITY]. Reference the city by name throughout. Do not fabricate practice counts or specific pricing. Show participating practices if data is available. If not, note that DAP is expanding to this area.',
    },
  },

  practice_page: {
    primaryVisitorIntent: 'Evaluate a specific participating dental practice and its membership plan',
    secondaryVisitorIntent: 'Decide whether to request membership at this practice',
    brandScriptRole: 'Conversion closer: the patient has found the practice — now help them understand the plan and take action. No brand storytelling needed here. Trust and clarity first.',
    seoAeoRole: 'Local SEO secondary target. Medium LLM formatting. Practice name + city + membership plan entity reinforcement. Conversion-optimized structure.',
    recommendedWireframeOrder: [
      'Practice identity (name, location, specialty)',
      'Membership plan details (what is included)',
      'Included preventive value (cleanings, x-rays, exams)',
      'Plan price (if available from verified data)',
      'General member savings structure',
      'How to request membership',
      'Final CTA',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Request membership at this practice',
      secondaryCta: 'Learn more about how DAP works',
      forbiddenCtas: [
        'Submit an insurance claim',
        'Get guaranteed savings at this practice',
        'Sign up for dental insurance through this practice',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with the practice name and city. State that this practice participates in the Dental Advantage Plan. DAP does not own or operate this practice — only note that it participates.',
      sectionPrompt: 'All plan details must come from verified practice data. Do not fabricate pricing. Do not use insurance language. Do not collect or display PHI.',
    },
  },

  blog_article: {
    primaryVisitorIntent: 'Find authoritative, educational information on a dental health topic',
    secondaryVisitorIntent: 'Discover DAP as a relevant tool for their dental care situation',
    brandScriptRole: 'Topical authority builder: establish CB Control Center / DAP as a trusted source of dental care education. DAP mentioned as relevant — never forced.',
    seoAeoRole: 'Top-of-funnel organic capture. Full Neil formatting. Direct answer hero, TOC, question H2s, entity reinforcement, FAQ, final CTA. Maximize LLM extractability.',
    recommendedWireframeOrder: [
      'Direct answer hero',
      'Quick summary (3–5 bullets)',
      'Table of contents',
      'Body sections (question H2s, 3–8 sections)',
      'Definition blocks (if needed)',
      'Watch-outs or limitations',
      'Entity reinforcement',
      'FAQ section',
      'Final CTA',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Find a participating DAP practice near you',
      secondaryCta: 'Read the 5-minute dental care guide',
      forbiddenCtas: [
        'Guaranteed savings',
        'Get covered now',
        'Buy insurance through DAP',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with a direct, factual answer to the article headline question. No preamble. Answer first, context second.',
      sectionPrompt: 'Each section answers one clearly-stated question. Use sub-headers as questions. Keep paragraphs short (3–4 sentences max). DAP may be mentioned where contextually relevant.',
      faqPrompt: 'End with 4–6 FAQ pairs covering follow-up questions likely to arise from the main topic. Answers: 1–2 sentences each.',
    },
  },

  decision_education: {
    primaryVisitorIntent: 'Understand the full landscape of dental care payment options before deciding',
    secondaryVisitorIntent: 'Self-select the right next step based on their situation',
    brandScriptRole: 'Neutral decision guide: help the patient understand the tradeoffs. DAP is one option — positioned honestly alongside alternatives. Decision Lock CTA closes after education.',
    seoAeoRole: 'Mid-funnel SEO / AEO. Strong Neil formatting. Question H2s, when-it-makes-sense, comparison blocks, watch-outs. Decision-ready patient capture.',
    recommendedWireframeOrder: [
      'Direct answer hero (the decision you\'re facing)',
      'Your options explained (neutral listing)',
      'When each option makes sense',
      'When each option does NOT make sense',
      'Watch-outs for each option',
      'Decision Lock CTA (after education)',
      'Footer disclaimer',
    ],
    ctaRules: {
      primaryCta: 'Find a participating DAP practice (if DAP seems right for you)',
      secondaryCta: 'Compare DAP to insurance side by side',
      forbiddenCtas: [
        'DAP is clearly the best choice — start now',
        'Skip insurance and join DAP',
        'Guaranteed savings — decide today',
      ],
    },
    generationPromptSeeds: {
      pageOpeningPrompt: 'Open with the patient decision problem: you need dental care but are uncertain which payment approach makes sense for your situation. Do not open by endorsing any single option.',
      sectionPrompt: 'Each option section must honestly describe pros and cons. DAP section must note it is not insurance, availability varies, and pricing is set by practices — not by DAP.',
      comparisonPrompt: 'When placing options side by side, use neutral framing. Acknowledge that for patients with complex treatment needs or high utilization, insurance may be more cost-effective.',
    },
  },

} as const

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildDapPageBrief(pageType: CBSeoAeoPageType): DapPageBrief {
  const contract = getPageContract(pageType)
  const additions = BRIEF_ADDITIONS[pageType]

  return {
    pageType: contract.pageType,
    strategicPurpose: contract.strategicPurpose,
    conversionRole: contract.conversionRole,
    neilFormattingUsage: contract.neilLlmFormattingUsage,
    requiredSections: contract.requiredSections,
    optionalSections: contract.optionalSections,
    forbiddenClaims: contract.forbiddenClaims,
    forbiddenLeadPatterns: contract.forbiddenLeadPatterns,
    dapTruthRules: DAP_REQUIRED_TRUTH_RULES,
    safetyFlags: LOCKED_SAFETY_FLAGS,
    ...additions,
  }
}

export function buildAllDapPageBriefs(): DapPageBrief[] {
  return (getAllPageTypes() as CBSeoAeoPageType[]).map(buildDapPageBrief)
}

export function getAllDapBriefPageTypes(): CBSeoAeoPageType[] {
  return Object.keys(BRIEF_ADDITIONS) as CBSeoAeoPageType[]
}
