// CBCC generic engine — public barrel
//
// Importers should pull from `@/lib/cbcc` (or relative path) and never reach
// into individual module files. This file is the only place that decides
// what the engine's public surface is.
//
// Architecture rule: AI recommends. CBCC enforces deterministic rules.
// Owner approves. See ARCHITECTURE.md for module responsibilities.

export * from './types'
export * from './projectRegistry'
export * from './stageLocking'
export * from './stageApproval'
export * from './evidenceLedger'
export * from './stagePageModel'
export * from './aiReview'
export * from './aiReviewProvider'
export * from './adapters'
