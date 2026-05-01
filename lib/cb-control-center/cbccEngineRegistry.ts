// CBCC v2 ↔ generic engine bridge.
//
// This file is the ONLY place app-level code reaches into the generic CBCC
// engine and the DAP adapter. Routes and components import from here, never
// directly from `lib/cbcc/`. That keeps the engine itself vertical-neutral —
// `lib/cbcc/*.ts` does not import any of these helpers.
//
// Decision (Part 7): the DAP slug renders from the engine adapter. Other
// project slugs continue to use Supabase-backed paths in cbccProjectRepository.

import type { CbccProjectAdapter } from '@/lib/cbcc/types'
import { DAP_ADAPTER, DAP_PROJECT, DAP_PROJECT_SLUG } from '@/lib/cbcc/adapters/dap'
import type { CbccProject as V2Project } from './cbccProjectTypes'
import { translateEngineProjectToV2 } from './cbccProjectPipelineTranslator'

export const ENGINE_BACKED_PROJECT_SLUGS: ReadonlyArray<string> = [DAP_PROJECT_SLUG]

export function isEngineBackedSlug(slug: string): boolean {
  return ENGINE_BACKED_PROJECT_SLUGS.includes(slug)
}

export function getEngineProjectAdapterBySlug(slug: string): CbccProjectAdapter | null {
  if (slug === DAP_PROJECT_SLUG) return DAP_ADAPTER
  return null
}

// v2-shaped projects for engine-backed verticals. Used by the home page
// so the CBCC registry surfaces DAP alongside Supabase-backed projects
// without making the page itself import DAP-specific modules.
export function listEngineBackedProjects(): V2Project[] {
  return [translateEngineProjectToV2(DAP_PROJECT).project]
}

// Merge engine-backed projects with a Supabase-backed list, preferring
// engine-backed entries on slug collisions. Pure — used by the home page.
export function mergeProjectsWithEngineBacked(
  supabaseProjects: ReadonlyArray<V2Project>,
): V2Project[] {
  const bySlug = new Map<string, V2Project>(supabaseProjects.map(p => [p.slug, p]))
  for (const engineProject of listEngineBackedProjects()) {
    bySlug.set(engineProject.slug, engineProject)
  }
  return Array.from(bySlug.values())
}
