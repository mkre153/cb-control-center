// CBCC generic engine — project registry
//
// In-memory registry of CbccProject records keyed by id. No DB, no Supabase.
// Future parts will swap this for a persistent store, but the surface stays
// pure-function so callers can pass in their own state.
//
// Registration is by-value: the registry holds the project record. The
// `adapterKey` field on the project is the link to a CbccProjectAdapter
// (registered separately by the engine consumer).

import type { CbccProject } from './types'

export interface ProjectRegistrationInput {
  id: string
  slug: string
  name: string
  description?: string
  adapterKey: string
}

export interface ProjectValidationResult {
  valid: boolean
  errors: ReadonlyArray<string>
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateProjectRegistration(
  input: ProjectRegistrationInput,
  existing: ReadonlyArray<CbccProject> = [],
): ProjectValidationResult {
  const errors: string[] = []
  if (!input.id || !input.id.trim()) errors.push('id is required')
  if (!input.slug || !input.slug.trim()) errors.push('slug is required')
  if (!input.name || !input.name.trim()) errors.push('name is required')
  if (!input.adapterKey || !input.adapterKey.trim()) errors.push('adapterKey is required')

  if (input.slug && !/^[a-z0-9][a-z0-9-]*$/.test(input.slug)) {
    errors.push('slug must be lowercase alphanumeric with hyphens')
  }

  if (existing.some(p => p.id === input.id)) errors.push(`id "${input.id}" already registered`)
  if (existing.some(p => p.slug === input.slug)) errors.push(`slug "${input.slug}" already registered`)

  return { valid: errors.length === 0, errors }
}

// ─── Pure registry operations ─────────────────────────────────────────────────

export interface RegisterProjectResult {
  ok: boolean
  errors?: ReadonlyArray<string>
  registry: ReadonlyArray<CbccProject>
  project?: CbccProject
}

export function registerProject(
  registry: ReadonlyArray<CbccProject>,
  input: ProjectRegistrationInput,
  now: string = new Date().toISOString(),
): RegisterProjectResult {
  const validation = validateProjectRegistration(input, registry)
  if (!validation.valid) {
    return { ok: false, errors: validation.errors, registry }
  }

  const project: CbccProject = {
    id: input.id,
    slug: input.slug,
    name: input.name,
    description: input.description,
    adapterKey: input.adapterKey,
    status: 'draft',
    stages: [],
    createdAt: now,
    updatedAt: now,
  }

  return {
    ok: true,
    registry: [...registry, project],
    project,
  }
}

export function getRegisteredProject(
  registry: ReadonlyArray<CbccProject>,
  idOrSlug: string,
): CbccProject | null {
  return registry.find(p => p.id === idOrSlug || p.slug === idOrSlug) ?? null
}

export function getRegisteredProjects(
  registry: ReadonlyArray<CbccProject>,
  filter?: { adapterKey?: string; status?: CbccProject['status'] },
): ReadonlyArray<CbccProject> {
  if (!filter) return registry
  return registry.filter(p => {
    if (filter.adapterKey && p.adapterKey !== filter.adapterKey) return false
    if (filter.status && p.status !== filter.status) return false
    return true
  })
}
