import { describe, it, expect } from 'vitest'
import {
  createEvidenceEntry,
  appendEvidence,
  getEvidenceForProject,
  getEvidenceForStage,
  getEvidenceByType,
  getEvidenceByStatus,
  validateEvidenceEntry,
  validateStageEvidence,
  summarizeEvidenceForStage,
  hasRequiredEvidence,
  getMissingEvidenceRequirements,
} from './evidenceLedger'
import type {
  CbccEvidenceEntry,
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccEvidenceType,
} from './types'

const NOW = '2026-05-01T00:00:00Z'
const LATER = '2026-05-02T00:00:00Z'

function makeEntry(over: Partial<CbccEvidenceEntry> = {}): CbccEvidenceEntry {
  return {
    id: 'e-1',
    projectId: 'p-1',
    stageId: 's-1',
    type: 'file',
    status: 'valid',
    title: 'Some file',
    ref: 'src/foo.ts',
    createdAt: NOW,
    metadata: {},
    ...over,
  }
}

describe('createEvidenceEntry', () => {
  it('creates an entry with defaults: status=pending, metadata={}', () => {
    const e = createEvidenceEntry({
      id: 'e-1',
      projectId: 'p-1',
      stageId: 's-1',
      type: 'file',
      title: 'foo',
      ref: 'foo.ts',
    }, NOW)
    expect(e.status).toBe('pending')
    expect(e.metadata).toEqual({})
    expect(e.createdAt).toBe(NOW)
  })

  it('respects status override', () => {
    const e = createEvidenceEntry({
      id: 'e-1', projectId: 'p-1', stageId: 's-1', type: 'note', title: 't', status: 'valid',
    }, NOW)
    expect(e.status).toBe('valid')
  })

  it('respects createdAt override', () => {
    const e = createEvidenceEntry({
      id: 'e-1', projectId: 'p-1', stageId: 's-1', type: 'note', title: 't', createdAt: '2020-01-01T00:00:00Z',
    }, NOW)
    expect(e.createdAt).toBe('2020-01-01T00:00:00Z')
  })

  it('uses now() default when createdAt not given', () => {
    const e = createEvidenceEntry({
      id: 'e-1', projectId: 'p-1', stageId: 's-1', type: 'note', title: 't',
    })
    expect(e.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('preserves provided metadata', () => {
    const e = createEvidenceEntry({
      id: 'e-1', projectId: 'p-1', stageId: 's-1', type: 'file', title: 't', ref: 'x', metadata: { tag: 'v' },
    }, NOW)
    expect(e.metadata).toEqual({ tag: 'v' })
  })
})

describe('appendEvidence', () => {
  it('returns a new ledger with the entry appended', () => {
    const initial: CbccEvidenceLedger = []
    const entry = makeEntry()
    const next = appendEvidence(initial, entry)
    expect(next).not.toBe(initial)
    expect(next.length).toBe(1)
    expect(next[0]).toBe(entry)
  })

  it('does not mutate the original ledger', () => {
    const initial: CbccEvidenceLedger = [makeEntry({ id: 'a' })]
    const snapshot = JSON.stringify(initial)
    appendEvidence(initial, makeEntry({ id: 'b' }))
    expect(JSON.stringify(initial)).toBe(snapshot)
    expect(initial.length).toBe(1)
  })
})

describe('validateEvidenceEntry', () => {
  it('accepts a fully-shaped valid entry', () => {
    expect(validateEvidenceEntry(makeEntry())).toEqual({ ok: true })
  })

  it('allows note evidence without ref', () => {
    const entry = makeEntry({ type: 'note', ref: undefined })
    expect(validateEvidenceEntry(entry)).toEqual({ ok: true })
  })

  it('requires ref for non-note evidence', () => {
    for (const type of ['file', 'route', 'git_commit', 'git_branch', 'test', 'deployment', 'external_url'] as CbccEvidenceType[]) {
      const entry = makeEntry({ type, ref: undefined })
      const r = validateEvidenceEntry(entry)
      expect(r.ok, `expected ${type} without ref to be invalid`).toBe(false)
      expect(r.errors?.join(' ')).toMatch(/ref/)
    }
  })

  it('rejects missing id, projectId, stageId, title', () => {
    const r = validateEvidenceEntry({
      id: '', projectId: '', stageId: '' as unknown as string, type: 'note', status: 'pending', title: '', createdAt: NOW,
    })
    expect(r.ok).toBe(false)
    expect(r.errors).toContain('id is required')
    expect(r.errors).toContain('projectId is required')
    expect(r.errors).toContain('stageId is required')
    expect(r.errors).toContain('title is required')
  })

  it('rejects unknown type', () => {
    const r = validateEvidenceEntry({ ...makeEntry(), type: 'banana' as unknown as CbccEvidenceType })
    expect(r.ok).toBe(false)
    expect(r.errors?.join(' ')).toMatch(/type/)
  })

  it('rejects unknown status', () => {
    const r = validateEvidenceEntry({ ...makeEntry(), status: 'wat' as unknown as CbccEvidenceEntry['status'] })
    expect(r.ok).toBe(false)
    expect(r.errors?.join(' ')).toMatch(/status/)
  })

  it('exposes the first error as the human-readable reason', () => {
    const r = validateEvidenceEntry({})
    expect(r.ok).toBe(false)
    expect(r.reason).toBeTruthy()
  })
})

describe('filters', () => {
  const ledger: CbccEvidenceLedger = [
    makeEntry({ id: '1', projectId: 'A', stageId: 1, type: 'file',  status: 'valid' }),
    makeEntry({ id: '2', projectId: 'A', stageId: 1, type: 'test',  status: 'valid' }),
    makeEntry({ id: '3', projectId: 'A', stageId: 2, type: 'note',  status: 'pending', ref: undefined }),
    makeEntry({ id: '4', projectId: 'B', stageId: 1, type: 'file',  status: 'invalid' }),
    makeEntry({ id: '5', projectId: 'B', stageId: 'free-form', type: 'route', status: 'valid' }),
  ]

  it('getEvidenceForProject scopes by projectId', () => {
    expect(getEvidenceForProject(ledger, 'A').map(e => e.id)).toEqual(['1', '2', '3'])
    expect(getEvidenceForProject(ledger, 'B').map(e => e.id)).toEqual(['4', '5'])
    expect(getEvidenceForProject(ledger, 'X')).toEqual([])
  })

  it('getEvidenceForStage scopes by both projectId and stageId', () => {
    expect(getEvidenceForStage(ledger, 'A', 1).map(e => e.id)).toEqual(['1', '2'])
    expect(getEvidenceForStage(ledger, 'A', 2).map(e => e.id)).toEqual(['3'])
    expect(getEvidenceForStage(ledger, 'B', 'free-form').map(e => e.id)).toEqual(['5'])
  })

  it('getEvidenceByType filters by type', () => {
    expect(getEvidenceByType(ledger, 'file').map(e => e.id)).toEqual(['1', '4'])
    expect(getEvidenceByType(ledger, 'note').map(e => e.id)).toEqual(['3'])
  })

  it('getEvidenceByStatus filters by status', () => {
    expect(getEvidenceByStatus(ledger, 'valid').map(e => e.id)).toEqual(['1', '2', '5'])
    expect(getEvidenceByStatus(ledger, 'invalid').map(e => e.id)).toEqual(['4'])
  })
})

describe('summarizeEvidenceForStage', () => {
  it('counts totals, valid, pending, invalid, missing, byType, byStatus', () => {
    const ledger: CbccEvidenceLedger = [
      makeEntry({ id: '1', projectId: 'P', stageId: 1, type: 'file', status: 'valid' }),
      makeEntry({ id: '2', projectId: 'P', stageId: 1, type: 'test', status: 'pending' }),
      makeEntry({ id: '3', projectId: 'P', stageId: 1, type: 'file', status: 'invalid' }),
      makeEntry({ id: '4', projectId: 'P', stageId: 2, type: 'route', status: 'valid' }),
      makeEntry({ id: '5', projectId: 'Q', stageId: 1, type: 'file', status: 'valid' }),
    ]
    const summary = summarizeEvidenceForStage(ledger, 'P', 1)
    expect(summary.total).toBe(3)
    expect(summary.valid).toBe(1)
    expect(summary.pending).toBe(1)
    expect(summary.invalid).toBe(1)
    expect(summary.missing).toBe(0)
    expect(summary.byType.file).toBe(2)
    expect(summary.byType.test).toBe(1)
    expect(summary.byType.route).toBe(0)
    expect(summary.byStatus.valid).toBe(1)
    expect(summary.byStatus.pending).toBe(1)
  })

  it('returns zeroes for an empty stage', () => {
    const summary = summarizeEvidenceForStage([], 'X', 99)
    expect(summary.total).toBe(0)
    expect(summary.byType.file).toBe(0)
    expect(summary.byStatus.valid).toBe(0)
  })
})

describe('hasRequiredEvidence / getMissingEvidenceRequirements', () => {
  const reqs: ReadonlyArray<CbccEvidenceRequirement> = [
    { id: 'r-test', type: 'test', title: 'Tests passing', required: true },
    { id: 'r-commit', type: 'git_commit', title: 'Commit hash', required: true },
    { id: 'r-deploy', type: 'deployment', title: 'Deploy URL', required: false },
  ]

  it('returns true when all required types are satisfied by valid evidence', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', type: 'test', status: 'valid' }),
      makeEntry({ id: 'b', type: 'git_commit', status: 'valid', ref: 'abc1234' }),
    ]
    expect(hasRequiredEvidence(evidence, reqs)).toBe(true)
    expect(getMissingEvidenceRequirements(evidence, reqs)).toEqual([])
  })

  it('returns false when a required type is missing entirely', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', type: 'test', status: 'valid' }),
    ]
    expect(hasRequiredEvidence(evidence, reqs)).toBe(false)
    const missing = getMissingEvidenceRequirements(evidence, reqs)
    expect(missing.map(r => r.id)).toEqual(['r-commit'])
  })

  it('returns false when a required type is present but only with non-valid status', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', type: 'test', status: 'valid' }),
      makeEntry({ id: 'b', type: 'git_commit', status: 'pending', ref: 'abc' }),
    ]
    expect(hasRequiredEvidence(evidence, reqs)).toBe(false)
    expect(getMissingEvidenceRequirements(evidence, reqs).map(r => r.id)).toEqual(['r-commit'])
  })

  it('ignores non-required requirements', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', type: 'test', status: 'valid' }),
      makeEntry({ id: 'b', type: 'git_commit', status: 'valid', ref: 'abc' }),
      // r-deploy is required:false — fine that it's absent
    ]
    expect(hasRequiredEvidence(evidence, reqs)).toBe(true)
  })
})

describe('validateStageEvidence', () => {
  const reqs: ReadonlyArray<CbccEvidenceRequirement> = [
    { id: 'r-test', type: 'test', title: 'Tests', required: true },
    { id: 'r-deploy', type: 'deployment', title: 'Deploy', required: false },
  ]

  it('reports ok=true when all required satisfied', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', projectId: 'P', stageId: 1, type: 'test', status: 'valid' }),
    ]
    const r = validateStageEvidence({ projectId: 'P', stageId: 1, evidence, requirements: reqs })
    expect(r.ok).toBe(true)
    expect(r.missingRequired).toEqual([])
    expect(r.validEvidence.map(e => e.id)).toEqual(['a'])
    expect(r.invalidEvidence).toEqual([])
  })

  it('separates valid/invalid and reports missing required', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', projectId: 'P', stageId: 1, type: 'note', status: 'valid', ref: undefined }),
      makeEntry({ id: 'b', projectId: 'P', stageId: 1, type: 'file', status: 'invalid' }),
      makeEntry({ id: 'c', projectId: 'P', stageId: 1, type: 'file', status: 'pending' }),
    ]
    const r = validateStageEvidence({ projectId: 'P', stageId: 1, evidence, requirements: reqs })
    expect(r.ok).toBe(false)
    expect(r.missingRequired.map(x => x.id)).toEqual(['r-test'])
    expect(r.validEvidence.map(e => e.id)).toEqual(['a'])
    expect(r.invalidEvidence.map(e => e.id)).toEqual(['b'])
  })

  it('only considers evidence that matches both projectId and stageId', () => {
    const evidence: ReadonlyArray<CbccEvidenceEntry> = [
      makeEntry({ id: 'a', projectId: 'OTHER', stageId: 1, type: 'test', status: 'valid' }),
      makeEntry({ id: 'b', projectId: 'P', stageId: 99, type: 'test', status: 'valid' }),
    ]
    const r = validateStageEvidence({ projectId: 'P', stageId: 1, evidence, requirements: reqs })
    expect(r.ok).toBe(false)
    expect(r.validEvidence).toEqual([])
    expect(r.missingRequired.map(x => x.id)).toEqual(['r-test'])
  })

  it('treats no requirements as ok=true', () => {
    const r = validateStageEvidence({
      projectId: 'P',
      stageId: 1,
      evidence: [],
      requirements: [],
    })
    expect(r.ok).toBe(true)
  })
})

describe('lib/cbcc/evidenceLedger.ts contains no vertical-specific language', () => {
  const FORBIDDEN: ReadonlyArray<RegExp> = [
    /\bDAP\b/,
    /\bdental\b/i,
    /\binsurance\b/i,
    /\bpatient(s)?\b/i,
    /\bpractice(s)?\b/i,
    /\bmembership(s)?\b/i,
  ]

  it('source file is generic', async () => {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    const src = readFileSync(resolve(__dirname, 'evidenceLedger.ts'), 'utf-8')
    for (const re of FORBIDDEN) {
      expect(src, `evidenceLedger.ts matched ${re}`).not.toMatch(re)
    }
  })
})
