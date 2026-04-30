// DAP Admin Decision SQL Contract — Phase 15 pure metadata helper.
// No Supabase client. No file writes. No inserts. No mutations.
// Describes the database-side contract that future writes must satisfy.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DapAdminDecisionSqlContract {
  tableName:            string
  migrationFileName:    string
  migrationRelativePath: string
  comment:              string
  requiredColumns:      string[]
  jsonbColumns:         string[]
  lockedBooleanColumns: Record<string, true>
  uniqueConstraints:    string[]
  checkConstraints:     string[]
  rlsEnabled:           true
  revokedOperations:    string[]
  previewOnly:          true
}

export interface DapAdminDecisionSqlContractValidation {
  valid:     boolean
  tableName: string
  errors:    string[]
  checks: {
    tableExists:             boolean
    allRequiredColumnsPresent: boolean
    idempotencyKeyUnique:    boolean
    previewOnlyCheck:        boolean
    readOnlyCheck:           boolean
    rlsEnabled:              boolean
    updateRevoked:           boolean
    deleteRevoked:           boolean
    commentPresent:          boolean
  }
}

// ─── Migration file reference ─────────────────────────────────────────────────

export const MIGRATION_FILE_NAME = '20260430000003_dap_admin_decision_events.sql'
export const MIGRATION_RELATIVE_PATH = `supabase/migrations/${MIGRATION_FILE_NAME}`

export function getMigrationFilePath(): string {
  return MIGRATION_RELATIVE_PATH
}

// ─── Contract definition ──────────────────────────────────────────────────────

export function getDapAdminDecisionSqlContract(): DapAdminDecisionSqlContract {
  return {
    tableName:             'dap_admin_decision_events',
    migrationFileName:     MIGRATION_FILE_NAME,
    migrationRelativePath: MIGRATION_RELATIVE_PATH,
    comment:               'DAP admin decision event ledger contract. Preview-only in Phase 15. No production decision authority yet.',

    requiredColumns: [
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
    ],

    jsonbColumns: [
      'required_gates',
      'satisfied_gates',
      'blocked_by',
      'payload',
    ],

    lockedBooleanColumns: {
      preview_only: true,
      read_only:    true,
    },

    uniqueConstraints: [
      'idempotency_key',
    ],

    checkConstraints: [
      'dap_admin_decision_events_preview_only_chk',
      'dap_admin_decision_events_read_only_chk',
      'dap_admin_decision_events_idempotency_key_unique',
    ],

    rlsEnabled:        true,
    revokedOperations: ['update', 'delete'],
    previewOnly:       true,
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────
// Pure function — takes SQL content as a string, validates it against the contract.
// No file I/O. No Supabase calls.

export function validateDapAdminDecisionSqlContract(
  sqlContent: string,
): DapAdminDecisionSqlContractValidation {
  const contract  = getDapAdminDecisionSqlContract()
  const sql       = sqlContent.toLowerCase()
  const errors:   string[] = []

  const tableExists = sql.includes(contract.tableName.toLowerCase())
  if (!tableExists) errors.push(`Table '${contract.tableName}' not found in SQL`)

  const missingColumns = contract.requiredColumns.filter(
    col => !sql.includes(col.toLowerCase()),
  )
  const allRequiredColumnsPresent = missingColumns.length === 0
  if (!allRequiredColumnsPresent) {
    errors.push(`Missing columns: ${missingColumns.join(', ')}`)
  }

  const idempotencyKeyUnique = sql.includes('unique (idempotency_key)') ||
    sql.includes('unique(idempotency_key)') ||
    sql.includes('idempotency_key_unique')
  if (!idempotencyKeyUnique) errors.push('idempotency_key UNIQUE constraint not found')

  const previewOnlyCheck = sql.includes('preview_only_chk') ||
    (sql.includes('preview_only') && sql.includes('check'))
  if (!previewOnlyCheck) errors.push('preview_only CHECK constraint not found')

  const readOnlyCheck = sql.includes('read_only_chk') ||
    (sql.includes('read_only') && sql.includes('check'))
  if (!readOnlyCheck) errors.push('read_only CHECK constraint not found')

  const rlsEnabled = sql.includes('enable row level security')
  if (!rlsEnabled) errors.push('ENABLE ROW LEVEL SECURITY not found')

  const updateRevoked = sql.includes('revoke') && sql.includes('update')
  if (!updateRevoked) errors.push('REVOKE UPDATE not found')

  const deleteRevoked = sql.includes('revoke') && sql.includes('delete')
  if (!deleteRevoked) errors.push('REVOKE DELETE not found')

  const commentPresent = sql.includes('comment on table')
  if (!commentPresent) errors.push('COMMENT ON TABLE not found')

  return {
    valid: errors.length === 0,
    tableName: contract.tableName,
    errors,
    checks: {
      tableExists,
      allRequiredColumnsPresent,
      idempotencyKeyUnique,
      previewOnlyCheck,
      readOnlyCheck,
      rlsEnabled,
      updateRevoked,
      deleteRevoked,
      commentPresent,
    },
  }
}
