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
      'Truth schema accuracy — every claim mapped to a primary source',
      'Compliance guardrails — HIPAA / state dental board / FDA constraints honored',
      'Forbidden-claim coverage — DAP truth rules represented as explicit forbidden phrases',
    ],
    redFlags: [
      'Schema lists a claim with no source or with a derived/secondary source',
      'Forbidden-phrase list misses any of the 7 DAP truth rules',
      'Allowed phrases drift toward insurance, claims-processing, or PHI language',
    ],
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
  return [
    `STAGE ${rubric.stageNumber} RUBRIC — ${rubric.headline}`,
    '',
    'Focus areas (each must produce at least one checklist item):',
    focus,
    '',
    'Red flags (call out explicitly if observed):',
    flags,
  ].join('\n')
}
