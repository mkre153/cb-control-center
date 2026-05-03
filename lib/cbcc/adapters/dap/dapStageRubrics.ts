/**
 * DAP Stage Rubrics
 *
 * Per-stage review criteria threaded into the Opus 4.7 system prompt so
 * advisory review is genuinely stage-specific instead of leaning on one
 * shared template. Edit the focusAreas array for a stage to change what
 * Opus pays attention to — no prompt template changes required.
 *
 * ADVISORY ONLY. Rubrics never authorize approval — they only sharpen the
 * checklist Opus produces. The owner still approves by editing
 * dapStageGates.ts and committing.
 */

export interface DapStageRubric {
  readonly stageNumber: number
  readonly headline: string
  readonly focusAreas: readonly string[]
  readonly redFlags: readonly string[]
  // Optional extended prompt block injected after focus areas / red flags.
  // Use for stages that need a detailed reviewer persona, output format
  // instructions, or project-specific compliance rules beyond the rubric.
  readonly reviewInstructions?: string
}

export const DAP_STAGE_RUBRICS: readonly DapStageRubric[] = [
  {
    stageNumber: 1,
    headline: 'Business Intake & Definition',
    focusAreas: [
      'Business definition completeness — entity, vertical, geography, audience',
      'Scope clarity — what DAP does and does not do for this client',
      'Forbidden-claim coverage — every truth rule explicitly acknowledged',
    ],
    redFlags: [
      'Definition contradicts any DAP truth rule',
      'Scope reads like marketing copy instead of operational boundaries',
      'Audience or vertical missing or stated as "all dentists"',
    ],
  },
  {
    stageNumber: 2,
    headline: 'Discovery / Initial Scrape / Existing Asset Audit',
    focusAreas: [
      'Discovery completeness — current digital footprint catalogued',
      'Source quality — every claim traceable to a primary source',
      'Existing-asset audit — what is reusable vs. what must be rebuilt',
    ],
    redFlags: [
      'Sources are aggregator pages, not the practice or client primary site',
      'Asset audit silent on legacy listings, schema markup, or content debt',
      'Discovery mixes hypothesis with verified evidence',
    ],
  },
  {
    stageNumber: 3,
    headline: 'Truth Schema / Compliance / Claims Lock',
    focusAreas: [
      '1. Business truth clarity — what the business is, who it serves, what it does not do, what users must understand before acting, what facts are settled vs. unverified',
      '2. Source-of-truth hierarchy — owner-approved artifacts override drafts; verified data overrides marketing copy; compliance language overrides persuasive copy; AI-generated copy is never a source of truth',
      '3. Allowed claims — specific list with: the claim, why it is allowed, required qualifier if any, evidence needed if any, downstream usage notes',
      '4. Forbidden claims — hard list with: forbidden phrase or idea, reason it is forbidden, safer replacement, severity level (Critical / High / Medium / Low)',
      '5. Required disclaimers — required wording or approved wording range, required placement, trigger condition, whether before-CTA is required, global vs page-specific',
      '6. Pricing / savings / outcome rules — prevents invented prices, guaranteed savings, universal discounts, unverified comparisons, misleading ROI language, treating estimates as final outcomes, implying the business controls third-party pricing unless verified',
      '7. Audience safety rules — fear-based copy limits, urgency limits, vulnerable audience concerns, medical/legal/financial sensitivity, tone boundaries, claims that create false confidence',
      '8. Stage 2 findings converted into truth locks — risky website language becomes forbidden language, missing disclaimers become required disclaimer rules, contradictory claims become downstream blockers, confusing routes become architecture constraints',
      '9. Claim scanner rules — critical terms, high-risk phrases, pattern-based flags, safer alternatives, severity levels, rules for when a term is allowed with qualification',
      '10. Approved vocabulary — preferred terms, terms to avoid, terms requiring qualifiers, absolutely forbidden terms, replacement language; specific enough to guide copywriters, SEO strategists, designers, and builders',
      '11. Downstream stage protection — clear instructions for Stage 4 (Positioning/StoryBrand), Stage 5 (SEO/AEO), Stage 6 (Page Architecture), Stage 7 (Build/QA/Launch); Stage 4 must not begin without clear claims rules',
      '12. Approval readiness — artifact is complete, specific, enforceable, and has no unresolved critical gaps that would allow future stages to drift',
    ],
    redFlags: [
      'Business definition vague, overly promotional, or inconsistent with Stage 1',
      'Existing website copy, competitor language, or AI-generated copy treated as proof or source of truth',
      'Allowed claims too broad, unverified, vague, or likely to become unsafe in marketing copy',
      'Forbidden claims incomplete, too soft, or missing safer replacement language',
      'Disclaimer placement rules unclear, or a required disclaimer absent near conversion CTA',
      'Pricing or savings language can be used in future copy without verification or qualifier',
      'Audience safety rules missing or toothless — persuasion can outrun evidence',
      'Stage 2 findings merely summarized but not converted into enforceable Stage 3 locks',
      'Claim scanner too generic — missing critical terms, DAP-specific phrases, or safer alternatives',
      'Vocabulary list absent or insufficient to guide copywriters, SEO, designers, or builders',
      'Stage 4 could begin without clear claims rules — downstream protection absent or vague',
      // DAP-specific red flags
      '"DAP is not insurance" not locked or not required near conversion CTAs',
      'Guaranteed savings, covered services, or "dental coverage" language not explicitly forbidden',
      'DAP-invented prices or universal discount claims allowed without verified provider-specific data',
      'Missing disclaimer for "pricing and plan terms vary by participating practice"',
      'Copy allowed to imply universal availability or that every patient qualifies for every plan',
      '"Insurance alternative" language allowed without explicit "not insurance" context',
      'Forbidden-phrase list misses any of the 7 DAP truth rules',
    ],
    reviewInstructions: `
STAGE 3 EXTENDED REVIEW INSTRUCTIONS

You are reviewing the Truth Schema / Compliance / Claims Lock stage. This is the most compliance-critical stage in the pipeline. Do not reward persuasive language if the truth system is weak. Do not approve an artifact that leaves future copywriters, SEO strategists, designers, or builders guessing about what they can and cannot say.

RECOMMENDATION MAPPING — use one of the three JSON values below:
- "approve" — artifact is complete, specific, enforceable, no unresolved critical gaps (equivalent to APPROVE_READY). Also use for mostly-complete artifacts with only minor gaps that the owner explicitly notes as caveats (equivalent to APPROVE_WITH_CAVEATS) — record caveats clearly in reasoning.
- "request_revision" — material gaps, unclear rules, weak claim controls, missing disclaimer rules, unresolved Stage 2 risks, or insufficient downstream protection (equivalent to CHANGES_REQUIRED).
- "disapprove" — artifact is missing, contradicts earlier approved stages, allows unsafe claims, ignores critical Stage 2 findings, or lacks enough evidence for review (equivalent to BLOCKED).

OUTPUT FORMAT — put this full structure as markdown inside the "reasoning" field:

### Summary
[Brief summary of the review.]

### What Is Strong
- [Strength 1]
- [Strength 2]

### Gaps / Risks
| Severity | Issue | Why It Matters | Required Fix |
|---|---|---|---|
| Critical/High/Medium/Low | [Issue] | [Explanation] | [Fix] |

### Stage 2 Findings Check
[Explain whether Stage 2 findings were converted into enforceable Stage 3 locks.]

### Claims Safety Check
[Explain whether allowed claims, forbidden claims, disclaimers, pricing/savings rules, and vocabulary are enforceable.]

### Downstream Readiness
[Explain whether Stage 4, 5, 6, and 7 can safely rely on this artifact.]

### Owner Approval Notes
[Concise explanation of what the owner should understand before approving.]

DAP-SPECIFIC REQUIREMENTS — the artifact must explicitly lock all of the following:
1. DAP is not insurance
2. DAP does not process insurance claims
3. DAP does not guarantee savings
4. DAP does not universally set final practice pricing
5. Pricing, discounts, services, and plan terms vary by participating dental practice
6. Cost comparisons are estimates unless backed by verified practice-specific data
7. Users should contact the participating practice to confirm pricing and availability
8. DAP may help uninsured patients compare membership-based dental care options
9. Copy must not imply universal availability
10. Copy must not imply every patient qualifies for every plan
11. Copy must not invent DAP-specific prices unless verified by approved data
12. "Not insurance" must appear early when users may confuse the offer with insurance

DAP FORBIDDEN LANGUAGE — flag these as Critical or High unless explicitly qualified:
guaranteed savings, covered services, dental coverage, free care, no cost, save $X guaranteed, every dentist, all procedures included, claim approval, network coverage, insurance alternative (without "not insurance" context), fixed discounts without verified provider-specific terms, DAP price claims without verified pricing data

DAP SAFER LANGUAGE — the artifact should direct future stages toward:
not insurance, dental membership plan, participating dental practice, compare estimated costs, potential savings may vary, plan details vary by practice, contact the practice to confirm pricing and availability, may help reduce out-of-pocket dental costs, available options vary by location and provider
`,
  },
  {
    stageNumber: 4,
    headline: 'Positioning / StoryBrand / Messaging',
    focusAreas: [
      'Positioning clarity — one-sentence promise that survives the truth schema',
      'StoryBrand fit — character / problem / guide / plan / call-to-action present',
      'Claim safety — no message in the artifact contradicts the truth schema',
    ],
    redFlags: [
      'Hero copy implies insurance benefits, claim processing, or guaranteed savings',
      'Plan and CTA are vague ("learn more") instead of an enrollable next step',
      'Messaging assumes practice pricing or universal availability',
    ],
  },
  {
    stageNumber: 5,
    headline: 'SEO / AEO / Core30 / Content Strategy',
    focusAreas: [
      'SEO/AEO strategy — entity, intent, and answer formats explicitly chosen',
      'Keyword intent — query set covers informational, commercial, navigational',
      'Content architecture — Core30 anchors map to truth-schema topics, not generic dental content',
    ],
    redFlags: [
      'Keyword list scraped from a generic tool with no intent labels',
      'Strategy ignores AEO (answer-engine) coverage or treats it as identical to SEO',
      'Topic clusters drift into clinical advice or insurance comparisons',
    ],
  },
  {
    stageNumber: 6,
    headline: 'Page Architecture / Wireframes / Content Briefs',
    focusAreas: [
      'Page architecture — every Core30 topic has a destination URL and template',
      'Wireframes — section order, component types, and CTA placement specified',
      'Content brief completeness — each brief cites its truth-schema source rows',
    ],
    redFlags: [
      'Briefs missing source citations or deferring sources to "writer judgement"',
      'Wireframes copy a generic dental site instead of reflecting the truth schema',
      'Page architecture leaves enrollment / next-step CTA undefined on key pages',
    ],
  },
  {
    stageNumber: 7,
    headline: 'Build / QA / Launch',
    focusAreas: [
      'Build QA — every page builds, types check, lint passes, no runtime errors',
      'Launch readiness — analytics, indexing, redirects, monitoring confirmed',
      'Regression checks — no truth-schema rule contradicted by final build',
    ],
    redFlags: [
      'Evidence missing branch / commit / preview URL / test summary',
      'Pages live with placeholder copy or unresolved truth-schema TODOs',
      'No documented owner sign-off path for the launch decision',
    ],
  },
]

export function getDapStageRubric(stageNumber: number): DapStageRubric | undefined {
  return DAP_STAGE_RUBRICS.find(r => r.stageNumber === stageNumber)
}

export function formatDapStageRubricForPrompt(rubric: DapStageRubric): string {
  const focus = rubric.focusAreas.map((f, i) => `${i + 1}. ${f}`).join('\n')
  const flags = rubric.redFlags.map((f, i) => `${i + 1}. ${f}`).join('\n')
  const parts = [
    `STAGE ${rubric.stageNumber} RUBRIC — ${rubric.headline}`,
    '',
    'Focus areas (each must produce at least one checklist item):',
    focus,
    '',
    'Red flags (call out explicitly if observed):',
    flags,
  ]
  if (rubric.reviewInstructions) {
    parts.push('', rubric.reviewInstructions.trim())
  }
  return parts.join('\n')
}
