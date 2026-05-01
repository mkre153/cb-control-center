// DAP stage approval persistence store.
//
// Three impls behind one interface:
//   - Supabase-backed: writes to cbcc_project_stages (the canonical row table).
//     Used in production / when SUPABASE_SERVICE_ROLE_KEY is set.
//   - In-memory:       module-scoped Map. Survives within a single Node
//                      process (so dev-server page refreshes are stable),
//                      but resets on process restart. Used as a local-dev
//                      fallback and as the default test store.
//   - Custom:          tests inject their own to assert exact state changes.
//
// Rules baked in:
//   - Only the engine's predecessor-approval rule decides what's approvable.
//     The store does NOT validate sequence — that lives in the action layer
//     (`approveDapStageAction`) which uses applyStageApproval from the
//     generic engine. The store is a pure write log.
//   - AI review code paths must never call .approve(). Tests assert this.
//   - Evidence is append-only; the store does not expose remove/rewrite.

import { getSupabaseAdminClient } from './supabaseClient'
import { DAP_PROJECT_SLUG } from '@/lib/cbcc/adapters/dap'

export interface DapStageApproval {
  stageNumber: number
  approved: boolean
  approvedAt: string
  approvedBy: string
  notes?: string | null
}

export interface DapStageApprovalStore {
  list(): Promise<DapStageApproval[]>
  approve(input: {
    stageNumber: number
    approvedBy: string
    notes?: string
    now?: string
  }): Promise<DapStageApproval>
}

// ─── In-memory store (module-scoped, dev fallback / test default) ───────────

const _memoryStore = new Map<number, DapStageApproval>()

export function _resetInMemoryDapStageStoreForTests(): void {
  _memoryStore.clear()
}

export function createInMemoryDapStageApprovalStore(): DapStageApprovalStore {
  return {
    async list() {
      return Array.from(_memoryStore.values()).sort((a, b) => a.stageNumber - b.stageNumber)
    },
    async approve({ stageNumber, approvedBy, notes, now }) {
      const trimmed = approvedBy.trim()
      if (!trimmed) throw new Error('approvedBy is required')
      const record: DapStageApproval = {
        stageNumber,
        approved: true,
        approvedAt: now ?? new Date().toISOString(),
        approvedBy: trimmed,
        notes: notes ?? null,
      }
      _memoryStore.set(stageNumber, record)
      return record
    },
  }
}

// ─── Test-friendly factory: stand up a clean store with optional seed ───────

export function createTestDapStageApprovalStore(
  seed: ReadonlyArray<DapStageApproval> = [],
): DapStageApprovalStore {
  const local = new Map<number, DapStageApproval>(seed.map(r => [r.stageNumber, r]))
  return {
    async list() {
      return Array.from(local.values()).sort((a, b) => a.stageNumber - b.stageNumber)
    },
    async approve({ stageNumber, approvedBy, notes, now }) {
      const trimmed = approvedBy.trim()
      if (!trimmed) throw new Error('approvedBy is required')
      const record: DapStageApproval = {
        stageNumber,
        approved: true,
        approvedAt: now ?? new Date().toISOString(),
        approvedBy: trimmed,
        notes: notes ?? null,
      }
      local.set(stageNumber, record)
      return record
    },
  }
}

// ─── Supabase store (production / when SR key is set) ───────────────────────

export function createSupabaseDapStageApprovalStore(): DapStageApprovalStore {
  return {
    async list() {
      const db = getSupabaseAdminClient()
      const { data: project, error: projectErr } = await db
        .from('cbcc_projects')
        .select('id')
        .eq('slug', DAP_PROJECT_SLUG)
        .maybeSingle()
      if (projectErr) throw new Error(`dap stage list (project): ${projectErr.message}`)
      if (!project) return []

      const { data: rows, error: rowsErr } = await db
        .from('cbcc_project_stages')
        .select('stage_number, approved, approved_at, approved_by')
        .eq('project_id', (project as { id: string }).id)
        .eq('approved', true)
        .order('stage_number', { ascending: true })
      if (rowsErr) throw new Error(`dap stage list: ${rowsErr.message}`)

      return (rows as Array<Record<string, unknown>>).map(r => ({
        stageNumber: r.stage_number as number,
        approved: true,
        approvedAt: r.approved_at as string,
        approvedBy: (r.approved_by as string) ?? '',
      }))
    },

    async approve({ stageNumber, approvedBy, notes, now }) {
      const trimmed = approvedBy.trim()
      if (!trimmed) throw new Error('approvedBy is required')
      const ts = now ?? new Date().toISOString()
      const db = getSupabaseAdminClient()

      const { data: project, error: projectErr } = await db
        .from('cbcc_projects')
        .select('id')
        .eq('slug', DAP_PROJECT_SLUG)
        .maybeSingle()
      if (projectErr) throw new Error(`dap stage approve (project): ${projectErr.message}`)
      if (!project) {
        throw new Error(
          `dap stage approve: project "${DAP_PROJECT_SLUG}" not found in cbcc_projects — ` +
          `seed via createProject() or run scripts/cbccEnsureStages.ts first`,
        )
      }
      const projectId = (project as { id: string }).id

      const { error: updateErr } = await db
        .from('cbcc_project_stages')
        .update({
          stage_status: 'approved',
          approved: true,
          approved_at: ts,
          approved_by: trimmed,
          updated_at: ts,
        })
        .eq('project_id', projectId)
        .eq('stage_number', stageNumber)

      if (updateErr) throw new Error(`dap stage approve: ${updateErr.message}`)

      return {
        stageNumber,
        approved: true,
        approvedAt: ts,
        approvedBy: trimmed,
        notes: notes ?? null,
      }
    },
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function getDapStageApprovalStore(): DapStageApprovalStore {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseDapStageApprovalStore()
  }
  return createInMemoryDapStageApprovalStore()
}
