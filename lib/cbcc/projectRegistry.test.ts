import { describe, it, expect } from 'vitest'
import {
  validateProjectRegistration,
  registerProject,
  getRegisteredProject,
  getRegisteredProjects,
} from './projectRegistry'
import type { CbccProject } from './types'

const NOW = '2026-05-01T00:00:00Z'

function makeExisting(over: Partial<CbccProject> = {}): CbccProject {
  return {
    id: 'p-existing',
    slug: 'p-existing',
    name: 'Existing',
    adapterKey: 'generic',
    status: 'draft',
    stages: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  }
}

describe('validateProjectRegistration', () => {
  const valid = { id: 'p1', slug: 'p1', name: 'P1', adapterKey: 'generic' }

  it('accepts a minimal valid input', () => {
    expect(validateProjectRegistration(valid).valid).toBe(true)
  })

  it('rejects missing id/slug/name/adapterKey', () => {
    const v = validateProjectRegistration({ id: '', slug: '', name: '', adapterKey: '' })
    expect(v.valid).toBe(false)
    expect(v.errors).toContain('id is required')
    expect(v.errors).toContain('slug is required')
    expect(v.errors).toContain('name is required')
    expect(v.errors).toContain('adapterKey is required')
  })

  it('rejects non-conforming slug formats', () => {
    const v = validateProjectRegistration({ ...valid, slug: 'Has Space' })
    expect(v.valid).toBe(false)
    expect(v.errors.join(' ')).toMatch(/slug/)
  })

  it('rejects duplicate id', () => {
    const v = validateProjectRegistration(
      { ...valid, id: 'p-existing', slug: 'unique' },
      [makeExisting()],
    )
    expect(v.valid).toBe(false)
    expect(v.errors.join(' ')).toMatch(/id .*already registered/)
  })

  it('rejects duplicate slug', () => {
    const v = validateProjectRegistration(
      { ...valid, id: 'unique', slug: 'p-existing' },
      [makeExisting()],
    )
    expect(v.valid).toBe(false)
    expect(v.errors.join(' ')).toMatch(/slug .*already registered/)
  })
})

describe('registerProject', () => {
  it('appends a new project with status=draft and ISO timestamps', () => {
    const result = registerProject([], { id: 'p1', slug: 'p1', name: 'P1', adapterKey: 'generic' }, NOW)
    expect(result.ok).toBe(true)
    expect(result.project?.id).toBe('p1')
    expect(result.project?.status).toBe('draft')
    expect(result.project?.createdAt).toBe(NOW)
    expect(result.project?.updatedAt).toBe(NOW)
    expect(result.registry.length).toBe(1)
  })

  it('returns ok=false and leaves registry unchanged on validation failure', () => {
    const initial = [makeExisting()]
    const result = registerProject(initial, { id: 'p-existing', slug: 'p-existing', name: 'X', adapterKey: 'generic' })
    expect(result.ok).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
    expect(result.registry).toBe(initial)
  })

  it('preserves description when provided', () => {
    const result = registerProject(
      [],
      { id: 'p1', slug: 'p1', name: 'P1', adapterKey: 'generic', description: 'desc' },
      NOW,
    )
    expect(result.project?.description).toBe('desc')
  })
})

describe('getRegisteredProject', () => {
  const reg = [makeExisting({ id: 'a', slug: 'alpha' }), makeExisting({ id: 'b', slug: 'beta' })]

  it('returns by id', () => {
    expect(getRegisteredProject(reg, 'a')?.slug).toBe('alpha')
  })
  it('returns by slug', () => {
    expect(getRegisteredProject(reg, 'beta')?.id).toBe('b')
  })
  it('returns null when not found', () => {
    expect(getRegisteredProject(reg, 'missing')).toBeNull()
  })
})

describe('getRegisteredProjects', () => {
  const reg = [
    makeExisting({ id: 'a', slug: 'a', adapterKey: 'generic', status: 'draft' }),
    makeExisting({ id: 'b', slug: 'b', adapterKey: 'generic', status: 'active' }),
    makeExisting({ id: 'c', slug: 'c', adapterKey: 'other', status: 'active' }),
  ]

  it('returns all when no filter', () => {
    expect(getRegisteredProjects(reg).length).toBe(3)
  })

  it('filters by adapterKey', () => {
    const out = getRegisteredProjects(reg, { adapterKey: 'generic' })
    expect(out.map(p => p.id)).toEqual(['a', 'b'])
  })

  it('filters by status', () => {
    const out = getRegisteredProjects(reg, { status: 'active' })
    expect(out.map(p => p.id)).toEqual(['b', 'c'])
  })

  it('combines filters (AND)', () => {
    const out = getRegisteredProjects(reg, { adapterKey: 'generic', status: 'active' })
    expect(out.map(p => p.id)).toEqual(['b'])
  })
})
