import { describe, it, expect } from 'vitest'
import {
  CBCC_DEFAULT_AGENT_REGISTRY,
  getCbccAgent,
  validateCbccAgentRegistry,
} from './agentRegistry'
import type { CbccAgentDefinition, CbccAgentKind } from './types'

const KINDS: ReadonlyArray<CbccAgentKind> = [
  'stage_worker',
  'reviewer',
  'evidence_collector',
  'adapter_worker',
]

describe('CBCC_DEFAULT_AGENT_REGISTRY structure', () => {
  it('contains at least one agent', () => {
    expect(CBCC_DEFAULT_AGENT_REGISTRY.length).toBeGreaterThan(0)
  })

  it('every agent has id, kind, name, description', () => {
    for (const a of CBCC_DEFAULT_AGENT_REGISTRY) {
      expect(a.id, `agent missing id: ${JSON.stringify(a)}`).toBeTruthy()
      expect(a.kind).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.description).toBeTruthy()
    }
  })

  it('every agent kind is one of the canonical 4', () => {
    for (const a of CBCC_DEFAULT_AGENT_REGISTRY) {
      expect(KINDS).toContain(a.kind)
    }
  })

  it('contains no duplicate agent ids', () => {
    const ids = CBCC_DEFAULT_AGENT_REGISTRY.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('agents declaring producesArtifact also clearly describe owner review', () => {
    // Loose contract check — the description should indicate the artifact
    // is subject to review or not auto-approved. Catches future agents
    // sneaking past the runtime gate via a misleading description.
    for (const a of CBCC_DEFAULT_AGENT_REGISTRY.filter(x => x.producesArtifact)) {
      expect(a.description.toLowerCase()).toMatch(/owner|review|approval/)
    }
  })
})

describe('getCbccAgent', () => {
  it('returns the agent when id is found', () => {
    const a = getCbccAgent(CBCC_DEFAULT_AGENT_REGISTRY, 'stage-context-reader')
    expect(a?.id).toBe('stage-context-reader')
  })

  it('returns null when id is not found', () => {
    expect(getCbccAgent(CBCC_DEFAULT_AGENT_REGISTRY, 'missing')).toBeNull()
  })
})

describe('validateCbccAgentRegistry', () => {
  it('accepts the default registry as valid', () => {
    expect(validateCbccAgentRegistry(CBCC_DEFAULT_AGENT_REGISTRY)).toEqual({ ok: true, errors: [] })
  })

  it('reports duplicate ids', () => {
    const dup: CbccAgentDefinition[] = [
      { id: 'a', kind: 'reviewer', name: 'a', description: 'x' },
      { id: 'a', kind: 'reviewer', name: 'b', description: 'x' },
    ]
    const r = validateCbccAgentRegistry(dup)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/duplicate agent id: a/)
  })

  it('reports missing required fields per agent', () => {
    const bad: CbccAgentDefinition[] = [
      { id: '', kind: 'reviewer', name: '', description: '' } as unknown as CbccAgentDefinition,
    ]
    const r = validateCbccAgentRegistry(bad)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/id is required/)
    expect(r.errors.join(' ')).toMatch(/name is required/)
    expect(r.errors.join(' ')).toMatch(/description is required/)
  })

  it('accepts an empty registry as structurally valid (callers may reject empty separately)', () => {
    expect(validateCbccAgentRegistry([]).ok).toBe(true)
  })
})

describe('agent registry source has no vertical leakage', () => {
  // A focused per-file check; coreBoundary.test.ts also covers this in
  // aggregate, but a per-file assertion makes a future leak's failure
  // message obvious.
  const FORBIDDEN: ReadonlyArray<RegExp> = [
    /\bdap\b/i,
    /\bdental\b/i,
    /\binsurance\b/i,
    /\bpatient(s)?\b/i,
    /\bpractice(s)?\b/i,
    /\bmembership(s)?\b/i,
  ]

  it('lib/cbcc/agentRegistry.ts is generic', async () => {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    const src = readFileSync(resolve(__dirname, 'agentRegistry.ts'), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    for (const re of FORBIDDEN) {
      expect(src, `agentRegistry.ts matched ${re}`).not.toMatch(re)
    }
  })
})
