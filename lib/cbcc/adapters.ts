// CBCC generic engine — adapter interface
//
// An *adapter* is how a project-specific system plugs into the generic CBCC
// engine. The engine never knows about a specific project's domain — it asks
// the adapter for definitions, artifacts, and evidence.
//
// Part 1 ships only the interface and a small registry helper. Concrete
// adapters come later.

// CbccProjectAdapter and related types live in ./types and are re-exported
// from the public barrel (./index). This module supplies only the runtime
// helpers (registry, type-guard, constructor).
import type { CbccProjectAdapter } from './types'

// ─── Adapter registry (in-memory, pure) ───────────────────────────────────────

export interface AdapterRegistry {
  byKey: Readonly<Record<string, CbccProjectAdapter>>
}

export const EMPTY_ADAPTER_REGISTRY: AdapterRegistry = Object.freeze({
  byKey: Object.freeze({}),
})

export function registerAdapter(
  registry: AdapterRegistry,
  adapter: CbccProjectAdapter,
): { ok: boolean; reason?: string; registry: AdapterRegistry } {
  if (!adapter.key || !adapter.key.trim()) {
    return { ok: false, reason: 'adapter.key is required', registry }
  }
  if (registry.byKey[adapter.key]) {
    return { ok: false, reason: `adapter "${adapter.key}" already registered`, registry }
  }
  return {
    ok: true,
    registry: { byKey: { ...registry.byKey, [adapter.key]: adapter } },
  }
}

export function getAdapter(
  registry: AdapterRegistry,
  key: string,
): CbccProjectAdapter | null {
  return registry.byKey[key] ?? null
}

// ─── Type guard ───────────────────────────────────────────────────────────────

export function isProjectAdapter(value: unknown): value is CbccProjectAdapter {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<CbccProjectAdapter>
  return (
    typeof v.key === 'string' &&
    typeof v.getProjectDefinition === 'function' &&
    typeof v.getStageDefinitions === 'function' &&
    typeof v.getStageArtifact === 'function' &&
    typeof v.validateStageArtifact === 'function' &&
    typeof v.getEvidenceForStage === 'function'
  )
}

// ─── Convenience constructor ──────────────────────────────────────────────────
//
// Allows downstream adapters to declare themselves as plain objects and have
// the engine validate the shape at construction time. Returns the adapter on
// success or throws — the throw is intentional because mis-shaped adapters
// are programmer errors, not runtime conditions.

export function createProjectAdapter(adapter: CbccProjectAdapter): CbccProjectAdapter {
  if (!isProjectAdapter(adapter)) {
    throw new Error('createProjectAdapter: argument is not a valid CbccProjectAdapter')
  }
  return adapter
}
