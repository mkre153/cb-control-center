import { describe, it, expect } from 'vitest'
import {
  EMPTY_ADAPTER_REGISTRY,
  registerAdapter,
  getAdapter,
  isProjectAdapter,
  createProjectAdapter,
} from './adapters'
import type { CbccProjectAdapter } from './types'

function makeAdapter(over: Partial<CbccProjectAdapter> = {}): CbccProjectAdapter {
  return {
    key: 'test',
    getProjectDefinition: () => null,
    getStageDefinitions: () => [],
    getStageArtifact: () => null,
    validateStageArtifact: () => ({ valid: true }),
    getEvidenceForStage: () => [],
    ...over,
  }
}

describe('isProjectAdapter', () => {
  it('returns true for a fully-shaped adapter', () => {
    expect(isProjectAdapter(makeAdapter())).toBe(true)
  })

  it.each([
    null,
    undefined,
    {},
    { key: 'x' },
    { ...makeAdapter(), key: 1 as unknown },
    { ...makeAdapter(), getProjectDefinition: 'not-a-fn' as unknown },
    { ...makeAdapter(), validateStageArtifact: undefined as unknown },
  ])('returns false for non-adapter inputs', (value) => {
    expect(isProjectAdapter(value)).toBe(false)
  })
})

describe('createProjectAdapter', () => {
  it('returns the adapter unchanged when valid', () => {
    const a = makeAdapter()
    expect(createProjectAdapter(a)).toBe(a)
  })

  it('throws when shape is invalid', () => {
    expect(() => createProjectAdapter({ key: 'x' } as unknown as CbccProjectAdapter)).toThrow()
  })
})

describe('registerAdapter / getAdapter', () => {
  it('starts empty', () => {
    expect(Object.keys(EMPTY_ADAPTER_REGISTRY.byKey).length).toBe(0)
  })

  it('registers a new adapter and returns updated registry', () => {
    const a = makeAdapter({ key: 'alpha' })
    const r = registerAdapter(EMPTY_ADAPTER_REGISTRY, a)
    expect(r.ok).toBe(true)
    expect(getAdapter(r.registry, 'alpha')).toBe(a)
  })

  it('refuses an empty key', () => {
    const r = registerAdapter(EMPTY_ADAPTER_REGISTRY, makeAdapter({ key: '' }))
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/key/)
  })

  it('refuses a duplicate key and leaves registry unchanged', () => {
    const first = registerAdapter(EMPTY_ADAPTER_REGISTRY, makeAdapter({ key: 'alpha' }))
    const second = registerAdapter(first.registry, makeAdapter({ key: 'alpha' }))
    expect(second.ok).toBe(false)
    expect(second.reason).toMatch(/already registered/)
    expect(second.registry).toBe(first.registry)
  })

  it('does not mutate input registry on success', () => {
    const initialKeys = Object.keys(EMPTY_ADAPTER_REGISTRY.byKey)
    registerAdapter(EMPTY_ADAPTER_REGISTRY, makeAdapter({ key: 'alpha' }))
    expect(Object.keys(EMPTY_ADAPTER_REGISTRY.byKey)).toEqual(initialKeys)
  })

  it('getAdapter returns null when not found', () => {
    expect(getAdapter(EMPTY_ADAPTER_REGISTRY, 'missing')).toBeNull()
  })
})

describe('CbccProjectAdapter contract is internal-only (no vertical leakage)', () => {
  // \bDAP\b avoids matching the substring inside identifiers like "Adapter".
  const FORBIDDEN: ReadonlyArray<RegExp> = [
    /\bDAP\b/,
    /\bdental\b/i,
    /\binsurance\b/i,
    /\bpatient(s)?\b/i,
    /\bpractice(s)?\b/i,
    /\bmembership(s)?\b/i,
  ]

  async function read(rel: string) {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    return readFileSync(resolve(__dirname, rel), 'utf-8')
  }

  for (const file of ['adapters.ts', 'types.ts', 'stageLocking.ts', 'stageApproval.ts', 'projectRegistry.ts']) {
    it(`lib/cbcc/${file} contains no vertical-specific language`, async () => {
      const src = await read(file)
      for (const re of FORBIDDEN) {
        expect(src, `${file} matched ${re}`).not.toMatch(re)
      }
    })
  }
})
