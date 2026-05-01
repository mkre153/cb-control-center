import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'

import {
  ENGINE_BACKED_PROJECT_SLUGS,
  getEngineProjectAdapterBySlug,
  isEngineBackedSlug,
} from './cbccEngineRegistry'
import { DAP_ADAPTER, DAP_PROJECT_SLUG } from '@/lib/cbcc/adapters/dap'

describe('cbccEngineRegistry — slug-to-adapter lookup', () => {
  it('exposes the DAP slug in ENGINE_BACKED_PROJECT_SLUGS', () => {
    expect(ENGINE_BACKED_PROJECT_SLUGS).toContain(DAP_PROJECT_SLUG)
  })

  it('isEngineBackedSlug returns true for DAP, false for unknowns', () => {
    expect(isEngineBackedSlug('dental-advantage-plan')).toBe(true)
    expect(isEngineBackedSlug('some-other-project')).toBe(false)
    expect(isEngineBackedSlug('')).toBe(false)
  })

  it('getEngineProjectAdapterBySlug returns DAP_ADAPTER for the DAP slug', () => {
    expect(getEngineProjectAdapterBySlug('dental-advantage-plan')).toBe(DAP_ADAPTER)
  })

  it('getEngineProjectAdapterBySlug returns null for unknown slugs', () => {
    expect(getEngineProjectAdapterBySlug('some-other-project')).toBeNull()
    expect(getEngineProjectAdapterBySlug('')).toBeNull()
  })
})

describe('cbccEngineRegistry — generic CBCC core does not import this bridge', () => {
  // The bridge file imports app-level content (lib/cb-control-center).
  // The generic engine in lib/cbcc/ must remain vertical-neutral, so its
  // source files must never reference cbccEngineRegistry.
  const ENGINE_ROOT = resolve(__dirname, '..', '..', 'lib', 'cbcc')

  function listEngineImplFiles(): string[] {
    return readdirSync(ENGINE_ROOT)
      .filter(name => name.endsWith('.ts'))
      .filter(name => !name.endsWith('.test.ts'))
      .map(name => resolve(ENGINE_ROOT, name))
  }

  it('no lib/cbcc/*.ts file references cbccEngineRegistry', () => {
    for (const file of listEngineImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${basename(file)} must not reference the bridge`).not.toMatch(
        /cbccEngineRegistry/,
      )
      // Direction: engine never imports app-level cb-control-center files.
      expect(src, `${basename(file)} must not import lib/cb-control-center`).not.toMatch(
        /cb-control-center/,
      )
    }
  })
})
