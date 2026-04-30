/**
 * CBSeoAeo — Neil-Style LLM-Friendly Page Formatting Standard
 *
 * This is a STRUCTURE LAYER ONLY. It cannot override BrandScript, Decision Lock,
 * CBDesignEngine, or CBSeoAeo Core30/NateSEO. It sits at rank 5 in the framework
 * hierarchy and applies only when its usage level permits.
 */

// ─── Usage levels ─────────────────────────────────────────────────────────────

export type NeilLlmFormattingUsage =
  | 'none'
  | 'light'
  | 'medium'
  | 'strong'
  | 'very_strong'
  | 'full'

// ─── Framework hierarchy ──────────────────────────────────────────────────────

export type CbFrameworkLayerId =
  | 'BrandScript'
  | 'DecisionLock'
  | 'CBDesignEngine'
  | 'CBSeoAeoCoreNate'
  | 'NeilLlmFormatting'

export interface CbFrameworkLayer {
  id: CbFrameworkLayerId
  rank: number
  description: string
}

export const CB_FRAMEWORK_HIERARCHY: readonly CbFrameworkLayer[] = [
  {
    id: 'BrandScript',
    rank: 1,
    description: 'Story + positioning: hero, villain, guide, plan, CTA, transformation.',
  },
  {
    id: 'DecisionLock',
    rank: 2,
    description: 'Decision engine: locking customer decisions, objection handling, outcome framing.',
  },
  {
    id: 'CBDesignEngine',
    rank: 3,
    description: 'Design system: layout tokens, component library, visual identity.',
  },
  {
    id: 'CBSeoAeoCoreNate',
    rank: 4,
    description: 'SEO/AEO: Core 30 keyword strategy, Nate SEO entity reinforcement.',
  },
  {
    id: 'NeilLlmFormatting',
    rank: 5,
    description: 'Structure layer: Neil-style LLM-friendly page formatting. Structure only — cannot override layers 1–4.',
  },
] as const

export const NEIL_LLM_CANNOT_OVERRIDE_LAYERS: readonly CbFrameworkLayerId[] = [
  'BrandScript',
  'DecisionLock',
  'CBDesignEngine',
  'CBSeoAeoCoreNate',
]

// ─── Bottom-line rule ─────────────────────────────────────────────────────────

export const NEIL_LLM_BOTTOM_LINE_RULE =
  'Neil-style LLM formatting is a structure layer only. It shapes how content is organized for machines and humans — it does not determine what the content says, what the brand voice is, or what decisions it drives. BrandScript, Decision Lock, CBDesignEngine, and CBSeoAeo Core30/NateSEO always win.'

// ─── Section taxonomy ─────────────────────────────────────────────────────────

export type NeilLlmSectionId =
  | 'direct_answer_hero'
  | 'quick_summary'
  | 'toc'
  | 'question_h2s'
  | 'definition_blocks'
  | 'comparison_table'
  | 'when_it_makes_sense'
  | 'watchouts'
  | 'entity_reinforcement'
  | 'faq'
  | 'final_cta'
  | 'footer_disclaimer'

export interface NeilLlmSection {
  id: NeilLlmSectionId
  label: string
  description: string
  requiredAt: readonly NeilLlmFormattingUsage[]
}

export const NEIL_LLM_SECTIONS: readonly NeilLlmSection[] = [
  {
    id: 'direct_answer_hero',
    label: 'Direct Answer Hero',
    description: "Opens with a concise, direct answer to the page's primary question -- optimized for LLM extraction.",
    requiredAt: ['strong', 'very_strong', 'full'],
  },
  {
    id: 'quick_summary',
    label: 'Quick Summary',
    description: '3–5 bullet TL;DR immediately after the hero for skimmers and scrapers.',
    requiredAt: ['medium', 'strong', 'very_strong', 'full'],
  },
  {
    id: 'toc',
    label: 'Table of Contents',
    description: 'Anchor-linked TOC for long-form pages.',
    requiredAt: ['strong', 'very_strong', 'full'],
  },
  {
    id: 'question_h2s',
    label: 'Question H2s',
    description: 'H2 headings phrased as full questions matching search/LLM query patterns.',
    requiredAt: ['medium', 'strong', 'very_strong', 'full'],
  },
  {
    id: 'definition_blocks',
    label: 'Definition Blocks',
    description: 'Callout or structured block defining key terms for entity disambiguation.',
    requiredAt: ['strong', 'very_strong', 'full'],
  },
  {
    id: 'comparison_table',
    label: 'Comparison Table',
    description: 'Structured HTML table enabling LLM extraction and featured-snippet candidacy.',
    requiredAt: ['very_strong', 'full'],
  },
  {
    id: 'when_it_makes_sense',
    label: 'When It Makes Sense',
    description: 'Explicit section answering "who is this for and when."',
    requiredAt: ['strong', 'very_strong', 'full'],
  },
  {
    id: 'watchouts',
    label: 'Watch-outs',
    description: 'Honest limitations, caveats, or "not right for you if" content.',
    requiredAt: ['very_strong', 'full'],
  },
  {
    id: 'entity_reinforcement',
    label: 'Entity Reinforcement',
    description: 'Repeat target entities (brand, location, service) 3+ times in varied syntactic positions.',
    requiredAt: ['medium', 'strong', 'very_strong', 'full'],
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Schema-eligible FAQ section (3–8 Q&A pairs).',
    requiredAt: ['strong', 'very_strong', 'full'],
  },
  {
    id: 'final_cta',
    label: 'Final CTA',
    description: 'Conversion-oriented closing action — placed after all informational content.',
    requiredAt: ['light', 'medium', 'strong', 'very_strong', 'full'],
  },
  {
    id: 'footer_disclaimer',
    label: 'Footer Disclaimer',
    description: 'Legal / accuracy disclaimer. Required on healthcare, finance, and legal pages.',
    requiredAt: ['light', 'medium', 'strong', 'very_strong', 'full'],
  },
] as const

// ─── DAP page-type usage mapping ──────────────────────────────────────────────

export const DAP_NEIL_LLM_FORMATTING_USAGE = {
  homepage:    { primaryFramework: 'BrandScript + conversion',          usage: 'light' },
  howItWorks:  { primaryFramework: 'Decision education',                usage: 'strong' },
  compare:     { primaryFramework: 'SEO/AEO + comparison',              usage: 'very_strong' },
  guide:       { primaryFramework: 'SEO/AEO + patient education',       usage: 'very_strong' },
  cityPage:    { primaryFramework: 'Local SEO / Core 30 / Nate SEO',   usage: 'very_strong' },
  practicePage:{ primaryFramework: 'Conversion + local SEO',            usage: 'medium' },
  blogFaqPage: { primaryFramework: 'CBSeoAeo',                          usage: 'full' },
} as const

export type DapNeilLlmPageType = keyof typeof DAP_NEIL_LLM_FORMATTING_USAGE

// ─── Homepage guardrail ───────────────────────────────────────────────────────

export const HOMEPAGE_GUARDRAIL = {
  pageType: 'homepage' as DapNeilLlmPageType,
  usage: 'light' as NeilLlmFormattingUsage,
  reason: 'Homepage is BrandScript-first. LLM formatting is a structural complement only — never the lead.',
  forbiddenLeadPatterns: [
    'FAQ as the first section',
    'Comparison table above the fold',
    'Definition block before the hero',
    'Question H2 as the page headline',
  ],
  allowedSections: ['final_cta', 'footer_disclaimer'] as NeilLlmSectionId[],
  requiredStructure: 'BrandScript hero first, then Decision Lock CTA, then optional light LLM sections below the fold.',
} as const

// ─── DAP truth rules ──────────────────────────────────────────────────────────

export const DAP_TRUTH_RULES = {
  is: [
    'A healthcare marketplace that connects patients with dental practices offering membership plans',
    'A patient-first discovery tool',
    'A way for patients to find practices that match their care and payment preferences',
  ],
  isNot: [
    'Dental insurance',
    'An insurance carrier or broker',
    'A payment processor',
    'A billing service',
    'A claims adjudicator',
    'A provider of dental care',
  ],
  forbiddenImplications: [
    'guaranteed savings',
    'guaranteed coverage',
    'universal availability',
    'DAP covers procedures',
    'DAP pays dentists',
    'DAP insures patients',
    'DAP processes claims',
    'DAP sets pricing',
  ],
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USAGE_RANK: Record<NeilLlmFormattingUsage, number> = {
  none: 0,
  light: 1,
  medium: 2,
  strong: 3,
  very_strong: 4,
  full: 5,
}

export function neilUsageRank(usage: NeilLlmFormattingUsage): number {
  return USAGE_RANK[usage]
}

export function getNeilUsageForDapPage(pageType: DapNeilLlmPageType): NeilLlmFormattingUsage {
  return DAP_NEIL_LLM_FORMATTING_USAGE[pageType].usage
}
