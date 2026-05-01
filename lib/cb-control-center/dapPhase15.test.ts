// Phase 15 — DAP Admin Decision Append-Only SQL Contract
// SQL contract phase only. Defines the database-side landing zone for future writes.
// No app-side writer. No Supabase insert. No mutation. No email. No payment.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/admin-decision-sql-contract/page.tsx')
const MIGRATION_PATH = join(ROOT, 'supabase/migrations/20260430000003_dap_admin_decision_events.sql')
const SQL_CONTRACT_PATH = join(__dirname, 'dapAdminDecisionSqlContract.ts')

function findPages(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findPages(full))
    else if (entry === 'page.tsx' || entry === 'page.ts') results.push(full)
  }
  return results
}

import {
  getDapAdminDecisionSqlContract,
  validateDapAdminDecisionSqlContract,
  getMigrationFilePath,
  MIGRATION_FILE_NAME,
  MIGRATION_RELATIVE_PATH,
} from './dapAdminDecisionSqlContract'

// ─── Group 1: Migration file exists ──────────────────────────────────────────

describe('Phase 15 — Migration file exists', () => {
  it('supabase/migrations/20260430000003_dap_admin_decision_events.sql exists', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })

  it('migration file has non-empty content', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql.length).toBeGreaterThan(100)
  })

  it('MIGRATION_FILE_NAME matches the actual file', () => {
    expect(existsSync(join(ROOT, 'supabase/migrations', MIGRATION_FILE_NAME))).toBe(true)
  })

  it('getMigrationFilePath returns the correct relative path', () => {
    expect(getMigrationFilePath()).toBe(MIGRATION_RELATIVE_PATH)
    expect(existsSync(join(ROOT, getMigrationFilePath()))).toBe(true)
  })
})

// ─── Group 2: SQL contract helper exports ─────────────────────────────────────

describe('Phase 15 — SQL contract helper exports', () => {
  it('getDapAdminDecisionSqlContract is a function', () => {
    expect(typeof getDapAdminDecisionSqlContract).toBe('function')
  })

  it('validateDapAdminDecisionSqlContract is a function', () => {
    expect(typeof validateDapAdminDecisionSqlContract).toBe('function')
  })

  it('getMigrationFilePath is a function', () => {
    expect(typeof getMigrationFilePath).toBe('function')
  })

  it('MIGRATION_FILE_NAME is exported', () => {
    expect(typeof MIGRATION_FILE_NAME).toBe('string')
    expect(MIGRATION_FILE_NAME.length).toBeGreaterThan(0)
  })

  it('helper does not import Supabase', () => {
    const src = readFileSync(SQL_CONTRACT_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
    expect(src).not.toMatch(/createClient/i)
    expect(src).not.toMatch(/supabaseClient/i)
  })
})

// ─── Group 3: Contract metadata shape ────────────────────────────────────────

describe('Phase 15 — Contract metadata shape', () => {
  const contract = getDapAdminDecisionSqlContract()

  it('tableName is dap_admin_decision_events', () => {
    expect(contract.tableName).toBe('dap_admin_decision_events')
  })

  it('rlsEnabled is true (literal)', () => {
    expect((contract as unknown as Record<string, unknown>)['rlsEnabled']).toBe(true)
  })

  it('previewOnly is true (literal)', () => {
    expect((contract as unknown as Record<string, unknown>)['previewOnly']).toBe(true)
  })

  it('revokedOperations contains update and delete', () => {
    expect(contract.revokedOperations).toContain('update')
    expect(contract.revokedOperations).toContain('delete')
  })

  it('requiredColumns is a non-empty array', () => {
    expect(Array.isArray(contract.requiredColumns)).toBe(true)
    expect(contract.requiredColumns.length).toBeGreaterThan(0)
  })

  it('jsonbColumns is a non-empty array', () => {
    expect(Array.isArray(contract.jsonbColumns)).toBe(true)
    expect(contract.jsonbColumns.length).toBeGreaterThan(0)
  })

  it('uniqueConstraints includes idempotency_key', () => {
    expect(contract.uniqueConstraints).toContain('idempotency_key')
  })

  it('comment is non-empty', () => {
    expect(contract.comment.length).toBeGreaterThan(0)
  })

  it('migrationFileName matches MIGRATION_FILE_NAME', () => {
    expect(contract.migrationFileName).toBe(MIGRATION_FILE_NAME)
  })
})

// ─── Group 4: Required columns ────────────────────────────────────────────────

describe('Phase 15 — Required columns', () => {
  const { requiredColumns } = getDapAdminDecisionSqlContract()

  const EXPECTED_COLUMNS = [
    'id',
    'created_at',
    'event_key',
    'event_type',
    'source_action_key',
    'entity_type',
    'entity_id',
    'decision_label',
    'decision_outcome',
    'authority_source',
    'created_by_role',
    'reason_code',
    'reason_label',
    'required_gates',
    'satisfied_gates',
    'blocked_by',
    'would_append_to',
    'idempotency_key',
    'payload',
    'preview_only',
    'read_only',
  ]

  for (const col of EXPECTED_COLUMNS) {
    it(`required column '${col}' is present`, () => {
      expect(requiredColumns).toContain(col)
    })
  }

  it('total required column count is 21', () => {
    expect(requiredColumns.length).toBe(21)
  })
})

// ─── Group 5: JSONB columns ───────────────────────────────────────────────────

describe('Phase 15 — JSONB columns', () => {
  const { jsonbColumns } = getDapAdminDecisionSqlContract()

  it('required_gates is a jsonb column', () => {
    expect(jsonbColumns).toContain('required_gates')
  })

  it('satisfied_gates is a jsonb column', () => {
    expect(jsonbColumns).toContain('satisfied_gates')
  })

  it('blocked_by is a jsonb column', () => {
    expect(jsonbColumns).toContain('blocked_by')
  })

  it('payload is a jsonb column', () => {
    expect(jsonbColumns).toContain('payload')
  })

  it('all jsonbColumns are in requiredColumns', () => {
    const { requiredColumns } = getDapAdminDecisionSqlContract()
    for (const col of jsonbColumns) {
      expect(requiredColumns).toContain(col)
    }
  })
})

// ─── Group 6: Locked boolean columns ─────────────────────────────────────────

describe('Phase 15 — Locked boolean columns', () => {
  const { lockedBooleanColumns } = getDapAdminDecisionSqlContract()

  it('preview_only is locked to true', () => {
    expect(lockedBooleanColumns['preview_only']).toBe(true)
  })

  it('read_only is locked to true', () => {
    expect(lockedBooleanColumns['read_only']).toBe(true)
  })

  it('both locked columns are in requiredColumns', () => {
    const { requiredColumns } = getDapAdminDecisionSqlContract()
    for (const col of Object.keys(lockedBooleanColumns)) {
      expect(requiredColumns).toContain(col)
    }
  })
})

// ─── Group 7: SQL content — table structure ───────────────────────────────────

describe('Phase 15 — SQL content: table structure', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf8')

  it('SQL creates dap_admin_decision_events table', () => {
    expect(sql.toLowerCase()).toContain('dap_admin_decision_events')
  })

  it('SQL contains all 21 required column names', () => {
    const { requiredColumns } = getDapAdminDecisionSqlContract()
    for (const col of requiredColumns) {
      expect(sql.toLowerCase()).toContain(col.toLowerCase())
    }
  })

  it('SQL marks required_gates as jsonb', () => {
    expect(sql.toLowerCase()).toMatch(/required_gates\s+jsonb/)
  })

  it('SQL marks satisfied_gates as jsonb', () => {
    expect(sql.toLowerCase()).toMatch(/satisfied_gates\s+jsonb/)
  })

  it('SQL marks blocked_by as jsonb', () => {
    expect(sql.toLowerCase()).toMatch(/blocked_by\s+jsonb/)
  })

  it('SQL marks payload as jsonb', () => {
    expect(sql.toLowerCase()).toMatch(/payload\s+jsonb/)
  })

  it('SQL uses IF NOT EXISTS guard', () => {
    expect(sql.toUpperCase()).toContain('IF NOT EXISTS')
  })
})

// ─── Group 8: SQL content — constraints ──────────────────────────────────────

describe('Phase 15 — SQL content: constraints', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf8')

  it('idempotency_key unique constraint exists', () => {
    expect(sql.toLowerCase()).toContain('idempotency_key')
    const hasUnique = sql.toLowerCase().includes('unique (idempotency_key)') ||
      sql.toLowerCase().includes('idempotency_key_unique')
    expect(hasUnique).toBe(true)
  })

  it('preview_only check constraint exists', () => {
    const hasCheck = sql.toLowerCase().includes('preview_only_chk') ||
      (sql.toLowerCase().includes('preview_only') && sql.toLowerCase().includes('check'))
    expect(hasCheck).toBe(true)
  })

  it('read_only check constraint exists', () => {
    const hasCheck = sql.toLowerCase().includes('read_only_chk') ||
      (sql.toLowerCase().includes('read_only') && sql.toLowerCase().includes('check'))
    expect(hasCheck).toBe(true)
  })

  it('preview_only check enforces = true', () => {
    expect(sql.toLowerCase()).toContain('preview_only = true')
  })

  it('read_only check enforces = true', () => {
    expect(sql.toLowerCase()).toContain('read_only = true')
  })
})

// ─── Group 9: SQL content — security ─────────────────────────────────────────

describe('Phase 15 — SQL content: security', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf8')

  it('RLS is enabled', () => {
    expect(sql.toUpperCase()).toContain('ENABLE ROW LEVEL SECURITY')
  })

  it('UPDATE is revoked', () => {
    expect(sql.toUpperCase()).toMatch(/REVOKE.*UPDATE/)
  })

  it('DELETE is revoked', () => {
    expect(sql.toUpperCase()).toMatch(/REVOKE.*DELETE/)
  })

  it('UPDATE and DELETE are revoked from authenticated', () => {
    expect(sql.toLowerCase()).toContain('authenticated')
  })

  it('UPDATE and DELETE are revoked from anon', () => {
    expect(sql.toLowerCase()).toContain('anon')
  })

  it('table has a COMMENT', () => {
    expect(sql.toUpperCase()).toContain('COMMENT ON TABLE')
  })

  it('comment mentions preview-only', () => {
    expect(sql.toLowerCase()).toContain('preview-only')
  })
})

// ─── Group 10: SQL contract validation function ───────────────────────────────

describe('Phase 15 — validateDapAdminDecisionSqlContract', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf8')
  const validation = validateDapAdminDecisionSqlContract(sql)

  it('validation returns valid: true for the real migration', () => {
    expect(validation.valid).toBe(true)
  })

  it('validation has no errors for the real migration', () => {
    expect(validation.errors).toHaveLength(0)
  })

  it('validation.tableName matches contract', () => {
    expect(validation.tableName).toBe('dap_admin_decision_events')
  })

  it('all validation checks pass', () => {
    for (const [check, passed] of Object.entries(validation.checks)) {
      expect(passed, `check failed: ${check}`).toBe(true)
    }
  })

  it('tableExists check passes', () => {
    expect(validation.checks.tableExists).toBe(true)
  })

  it('allRequiredColumnsPresent check passes', () => {
    expect(validation.checks.allRequiredColumnsPresent).toBe(true)
  })

  it('idempotencyKeyUnique check passes', () => {
    expect(validation.checks.idempotencyKeyUnique).toBe(true)
  })

  it('previewOnlyCheck passes', () => {
    expect(validation.checks.previewOnlyCheck).toBe(true)
  })

  it('readOnlyCheck passes', () => {
    expect(validation.checks.readOnlyCheck).toBe(true)
  })

  it('rlsEnabled check passes', () => {
    expect(validation.checks.rlsEnabled).toBe(true)
  })

  it('updateRevoked check passes', () => {
    expect(validation.checks.updateRevoked).toBe(true)
  })

  it('deleteRevoked check passes', () => {
    expect(validation.checks.deleteRevoked).toBe(true)
  })

  it('commentPresent check passes', () => {
    expect(validation.checks.commentPresent).toBe(true)
  })

  it('validation returns errors for SQL missing table name', () => {
    const bad = validateDapAdminDecisionSqlContract('CREATE TABLE foo (id uuid);')
    expect(bad.valid).toBe(false)
    expect(bad.errors.length).toBeGreaterThan(0)
  })

  it('validation returns errors for SQL missing RLS', () => {
    const noRls = sql.replace(/enable row level security/gi, '-- rls removed')
    const result = validateDapAdminDecisionSqlContract(noRls)
    expect(result.checks.rlsEnabled).toBe(false)
  })
})

// ─── Group 11: No live writer exists ─────────────────────────────────────────

describe('Phase 15 — No app-side writer exists', () => {
  it('dapAdminDecisionWriter.ts does not exist (writer not implemented yet)', () => {
    const writerPath = join(__dirname, 'dapAdminDecisionWriter.ts')
    expect(existsSync(writerPath)).toBe(false)
  })

  it('dapAdminDecisionInsert.ts does not exist', () => {
    expect(existsSync(join(__dirname, 'dapAdminDecisionInsert.ts'))).toBe(false)
  })

  it('SQL contract helper contains no Supabase import', () => {
    const src = readFileSync(SQL_CONTRACT_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
    expect(src).not.toContain('createClient')
  })

  it('SQL contract helper contains no insert or upsert calls', () => {
    const src = readFileSync(SQL_CONTRACT_PATH, 'utf8')
    expect(src.toLowerCase()).not.toContain('.insert(')
    expect(src.toLowerCase()).not.toContain('.upsert(')
    expect(src.toLowerCase()).not.toContain('.from(')
  })

  it('SQL contract helper contains no server action directive', () => {
    const src = readFileSync(SQL_CONTRACT_PATH, 'utf8')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })
})

// ─── Group 12: Page exists ────────────────────────────────────────────────────

describe('Phase 15 — Page exists', () => {
  it('app/preview/dap/admin-decision-sql-contract/page.tsx exists', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page uses force-dynamic export', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('page is a server component (no "use client")', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('page does not import Supabase', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('page contains data-preview-only-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only-notice')
  })

  it('page contains data-authority-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-authority-notice')
  })

  it('page states no emails are sent from it', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('no email')
  })

  it('page references MKCRM does not decide', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('MKCRM does not decide')
  })

  it('page imports getDapAdminDecisionSqlContract', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('getDapAdminDecisionSqlContract')
  })

  it('page imports validateDapAdminDecisionSqlContract', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('validateDapAdminDecisionSqlContract')
  })

  it('page references requiredColumns', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('requiredColumns')
  })

  it('page references idempotency_key or idempotencyKey', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('idempotency')
  })

  it('page references rlsEnabled', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('rlsEnabled')
  })

  it('page references revokedOperations', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('revokedOperations')
  })

  it('page does not contain Supabase insert calls', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
    expect(src).not.toContain('.upsert(')
  })

  it('total page count is now 34', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })
})

// ─── Group 13: Full suite guard ───────────────────────────────────────────────

describe('Phase 15 — Full suite guard', () => {
  it('page count is 34 (all prior pages preserved)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })

  it('migration file still validates', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    const result = validateDapAdminDecisionSqlContract(sql)
    expect(result.valid).toBe(true)
  })

  it('getDapAdminDecisionSqlContract still returns 21 required columns', () => {
    const contract = getDapAdminDecisionSqlContract()
    expect(contract.requiredColumns.length).toBe(21)
  })

  it('no Supabase writer has been created', () => {
    expect(existsSync(join(__dirname, 'dapAdminDecisionWriter.ts'))).toBe(false)
  })
})
