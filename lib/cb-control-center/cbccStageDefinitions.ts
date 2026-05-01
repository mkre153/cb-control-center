export const CBCC_STAGE_DEFINITIONS = Object.freeze([
  {
    number: 1,
    key: 'definition',
    title: 'Stage 1 — Definition',
    description:
      'Define the project scope, goals, stakeholders, and success criteria.',
  },
  {
    number: 2,
    key: 'discovery',
    title: 'Stage 2 — Discovery',
    description:
      'Research and audit the landscape, gather all necessary inputs and constraints.',
  },
  {
    number: 3,
    key: 'foundation',
    title: 'Stage 3 — Foundation',
    description:
      'Establish the canonical data model, schemas, and compliance requirements.',
  },
  {
    number: 4,
    key: 'strategy',
    title: 'Stage 4 — Strategy',
    description:
      'Define positioning, messaging, and the overall approach to the market.',
  },
  {
    number: 5,
    key: 'planning',
    title: 'Stage 5 — Planning',
    description:
      'Plan the content, architecture, or implementation approach in detail.',
  },
  {
    number: 6,
    key: 'build',
    title: 'Stage 6 — Build',
    description: 'Implement the planned work according to approved specifications.',
  },
  {
    number: 7,
    key: 'launch',
    title: 'Stage 7 — Launch',
    description: 'Quality assurance, launch execution, and post-launch operations.',
  },
] as const)

export type CbccStageDefinition = (typeof CBCC_STAGE_DEFINITIONS)[number]
