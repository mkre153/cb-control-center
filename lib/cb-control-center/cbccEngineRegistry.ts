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
import { DAP_ADAPTER, DAP_PROJECT_SLUG } from '@/lib/cbcc/adapters/dap'

export const ENGINE_BACKED_PROJECT_SLUGS: ReadonlyArray<string> = [DAP_PROJECT_SLUG]

export function isEngineBackedSlug(slug: string): boolean {
  return ENGINE_BACKED_PROJECT_SLUGS.includes(slug)
}

export function getEngineProjectAdapterBySlug(slug: string): CbccProjectAdapter | null {
  if (slug === DAP_PROJECT_SLUG) return DAP_ADAPTER
  return null
}
