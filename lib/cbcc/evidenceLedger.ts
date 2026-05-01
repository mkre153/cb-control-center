// CBCC generic engine — evidence ledger
//
// Append-only ledger of CbccEvidenceEntry records. All functions are pure;
// the ledger itself is just a ReadonlyArray<CbccEvidenceEntry>. No DB, no
// Supabase, no persistence — those layers come later.
//
// Invariants:
//   - createEvidenceEntry yields a fresh entry with status='pending' and a
//     server-issued createdAt; callers may override either at call time.
//   - appendEvidence never mutates input; returns a new ledger.
//   - validateEvidenceEntry enforces minimum field shape.
//   - validateStageEvidence enforces requirement coverage at the stage level.
//   - hasRequiredEvidence demands a *valid* (status='valid') entry of the
//     required type; pending/invalid/missing don't satisfy.

import type {
  CbccEvidenceEntry,
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccEvidenceStatus,
  CbccEvidenceSummary,
  CbccEvidenceType,
  CbccEvidenceValidationResult,
} from './types'

const VALID_TYPES: ReadonlySet<CbccEvidenceType> = new Set([
  'file',
  'route',
  'git_commit',
  'git_branch',
  'test',
  'deployment',
  'external_url',
  'note',
])

const VALID_STATUSES: ReadonlySet<CbccEvidenceStatus> = new Set([
  'valid',
  'pending',
  'invalid',
  'missing',
])

// ─── Construction ─────────────────────────────────────────────────────────────

export interface CreateEvidenceEntryInput {
  id: string
  projectId: string
  stageId: string | number
  type: CbccEvidenceType
  title: string
  description?: string
  ref?: string
  status?: CbccEvidenceStatus
  createdAt?: string
  createdBy?: string
  metadata?: Record<string, unknown>
}

export function createEvidenceEntry(
  input: CreateEvidenceEntryInput,
  now: string = new Date().toISOString(),
): CbccEvidenceEntry {
  return {
    id: input.id,
    projectId: input.projectId,
    stageId: input.stageId,
    type: input.type,
    status: input.status ?? 'pending',
    title: input.title,
    description: input.description,
    ref: input.ref,
    createdAt: input.createdAt ?? now,
    createdBy: input.createdBy,
    metadata: input.metadata ?? {},
  }
}

// ─── Append ───────────────────────────────────────────────────────────────────

export function appendEvidence(
  ledger: CbccEvidenceLedger,
  entry: CbccEvidenceEntry,
): CbccEvidenceLedger {
  return [...ledger, entry]
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export function getEvidenceForProject(
  ledger: CbccEvidenceLedger,
  projectId: string,
): CbccEvidenceLedger {
  return ledger.filter(e => e.projectId === projectId)
}

export function getEvidenceForStage(
  ledger: CbccEvidenceLedger,
  projectId: string,
  stageId: string | number,
): CbccEvidenceLedger {
  return ledger.filter(e => e.projectId === projectId && e.stageId === stageId)
}

export function getEvidenceByType(
  ledger: CbccEvidenceLedger,
  type: CbccEvidenceType,
): CbccEvidenceLedger {
  return ledger.filter(e => e.type === type)
}

export function getEvidenceByStatus(
  ledger: CbccEvidenceLedger,
  status: CbccEvidenceStatus,
): CbccEvidenceLedger {
  return ledger.filter(e => e.status === status)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateEvidenceEntry(
  entry: Partial<CbccEvidenceEntry>,
): CbccEvidenceValidationResult {
  const errors: string[] = []

  if (!entry.id || typeof entry.id !== 'string' || !entry.id.trim()) errors.push('id is required')
  if (!entry.projectId || typeof entry.projectId !== 'string' || !entry.projectId.trim()) {
    errors.push('projectId is required')
  }
  if (entry.stageId === undefined || entry.stageId === null || entry.stageId === '') {
    errors.push('stageId is required')
  }
  if (!entry.type || !VALID_TYPES.has(entry.type)) errors.push('type is invalid or missing')
  if (!entry.title || typeof entry.title !== 'string' || !entry.title.trim()) {
    errors.push('title is required')
  }
  if (!entry.status || !VALID_STATUSES.has(entry.status)) {
    errors.push('status is invalid or missing')
  }
  if (entry.type && entry.type !== 'note') {
    if (!entry.ref || typeof entry.ref !== 'string' || !entry.ref.trim()) {
      errors.push(`ref is required for evidence of type "${entry.type}"`)
    }
  }

  if (errors.length === 0) return { ok: true }
  return { ok: false, reason: errors[0], errors }
}

// ─── Stage-level validation ───────────────────────────────────────────────────

export interface ValidateStageEvidenceInput {
  projectId: string
  stageId: string | number
  evidence: ReadonlyArray<CbccEvidenceEntry>
  requirements: ReadonlyArray<CbccEvidenceRequirement>
}

export interface ValidateStageEvidenceResult {
  ok: boolean
  missingRequired: ReadonlyArray<CbccEvidenceRequirement>
  invalidEvidence: ReadonlyArray<CbccEvidenceEntry>
  validEvidence: ReadonlyArray<CbccEvidenceEntry>
}

export function validateStageEvidence(
  input: ValidateStageEvidenceInput,
): ValidateStageEvidenceResult {
  const scoped = input.evidence.filter(
    e => e.projectId === input.projectId && e.stageId === input.stageId,
  )
  const validEvidence = scoped.filter(e => e.status === 'valid')
  const invalidEvidence = scoped.filter(e => e.status === 'invalid')

  const missingRequired = input.requirements
    .filter(r => r.required)
    .filter(r => !validEvidence.some(e => e.type === r.type))

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    invalidEvidence,
    validEvidence,
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function emptyByType(): Record<CbccEvidenceType, number> {
  return {
    file: 0,
    route: 0,
    git_commit: 0,
    git_branch: 0,
    test: 0,
    deployment: 0,
    external_url: 0,
    note: 0,
  }
}

function emptyByStatus(): Record<CbccEvidenceStatus, number> {
  return { valid: 0, pending: 0, invalid: 0, missing: 0 }
}

export function summarizeEvidenceForStage(
  ledger: CbccEvidenceLedger,
  projectId: string,
  stageId: string | number,
): CbccEvidenceSummary {
  const scoped = getEvidenceForStage(ledger, projectId, stageId)
  const byType = emptyByType()
  const byStatus = emptyByStatus()
  for (const e of scoped) {
    byType[e.type] += 1
    byStatus[e.status] += 1
  }
  return {
    projectId,
    stageId,
    total: scoped.length,
    valid: byStatus.valid,
    pending: byStatus.pending,
    invalid: byStatus.invalid,
    missing: byStatus.missing,
    byType,
    byStatus,
  }
}

// ─── Requirement coverage ─────────────────────────────────────────────────────

export function hasRequiredEvidence(
  evidence: ReadonlyArray<CbccEvidenceEntry>,
  requirements: ReadonlyArray<CbccEvidenceRequirement>,
): boolean {
  return getMissingEvidenceRequirements(evidence, requirements).length === 0
}

export function getMissingEvidenceRequirements(
  evidence: ReadonlyArray<CbccEvidenceEntry>,
  requirements: ReadonlyArray<CbccEvidenceRequirement>,
): ReadonlyArray<CbccEvidenceRequirement> {
  return requirements
    .filter(r => r.required)
    .filter(r => !evidence.some(e => e.type === r.type && e.status === 'valid'))
}
