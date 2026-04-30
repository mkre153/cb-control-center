// DAP Admin Decision SQL Contract — preview-only schema surface.
// Phase 15 is SQL contract only. No app-side writer exists yet.
// No Supabase insert. No status mutation. No emails are sent from it. No payments.
// CB Control Center is the decision authority. MKCRM does not decide.

import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  getDapAdminDecisionSqlContract,
  validateDapAdminDecisionSqlContract,
  MIGRATION_FILE_NAME,
} from '@/lib/cb-control-center/dapAdminDecisionSqlContract'

export const dynamic = 'force-dynamic'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDecisionSqlContractPreviewPage() {
  const contract = getDapAdminDecisionSqlContract()

  const sqlPath = join(process.cwd(), contract.migrationRelativePath)
  const sqlContent = readFileSync(sqlPath, 'utf8')
  const validation = validateDapAdminDecisionSqlContract(sqlContent)

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      data-sql-contract-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="admin-decision-sql-contract"
        >
          DAP Admin Decision SQL Contract
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only — Phase 15 SQL contract only</p>
        <p className="text-xs text-gray-500 font-mono">{MIGRATION_FILE_NAME}</p>
      </div>

      {/* Preview-only notice */}
      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2"
        data-preview-only-notice
        data-authority-notice
      >
        <p className="text-xs font-semibold text-amber-800">SQL Contract Phase — No App-Side Writer</p>
        <p className="text-xs text-amber-700">
          This page describes the database-side append-only structure that future admin decision
          writes would target. No writer exists yet. Phase 15 defines the landing zone safely
          before any mutation is wired. No emails are sent from it. No payments are triggered.
          CB Control Center is the decision authority. MKCRM does not decide.
        </p>
        <p className="text-xs text-amber-700">
          Phase 12 = action availability. Phase 13 = event preview. Phase 14 = write contract.
          Phase 15 = SQL contract. Phase 16 will implement the append-only writer.
        </p>
      </section>

      {/* Validation status */}
      <section
        className={`rounded-lg border p-4 space-y-3 ${validation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        data-contract-validation
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${validation.valid ? 'text-green-800' : 'text-red-800'}`}>
            {validation.valid ? '✓ Contract Validates' : '✗ Validation Errors'}
          </span>
          <span className="font-mono text-xs text-gray-500">{validation.tableName}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
          {Object.entries(validation.checks).map(([check, passed]) => (
            <div key={check} className="flex items-center gap-1.5">
              <span className={passed ? 'text-green-600' : 'text-red-500'}>{passed ? '✓' : '✗'}</span>
              <span className={passed ? 'text-gray-700' : 'text-red-600'}>{check}</span>
            </div>
          ))}
        </div>
        {validation.errors.length > 0 && (
          <ul className="space-y-0.5">
            {validation.errors.map((err, i) => (
              <li key={i} className="text-xs text-red-700">✗ {err}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Table summary */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-4" data-table-summary>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Table</p>
          <p className="font-mono text-sm text-indigo-700">{contract.tableName}</p>
          <p className="text-xs text-gray-500 mt-0.5 italic">{contract.comment}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
          <div className="flex gap-1.5">
            <span className="text-gray-400 shrink-0">rlsEnabled</span>
            <span className="text-green-700 font-semibold">{String(contract.rlsEnabled)}</span>
          </div>
          <div className="flex gap-1.5">
            <span className="text-gray-400 shrink-0">previewOnly</span>
            <span className="text-blue-700 font-semibold">{String(contract.previewOnly)}</span>
          </div>
          <div className="flex gap-1.5">
            <span className="text-gray-400 shrink-0">revokedOperations</span>
            <span className="text-red-600 font-semibold">[{contract.revokedOperations.join(', ')}]</span>
          </div>
        </div>
      </section>

      {/* Required columns */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3" data-required-columns>
        <p className="text-xs font-semibold text-gray-700">
          Required Columns ({contract.requiredColumns.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {contract.requiredColumns.map(col => {
            const isJsonb   = contract.jsonbColumns.includes(col)
            const isLocked  = col in contract.lockedBooleanColumns
            return (
              <span
                key={col}
                className={`font-mono text-xs rounded px-2 py-0.5 ${
                  isJsonb  ? 'bg-violet-50 text-violet-700' :
                  isLocked ? 'bg-blue-50 text-blue-700' :
                             'bg-gray-100 text-gray-700'
                }`}
                data-column={col}
              >
                {col}{isJsonb ? ' [jsonb]' : isLocked ? ` [locked=${contract.lockedBooleanColumns[col as keyof typeof contract.lockedBooleanColumns]}]` : ''}
              </span>
            )
          })}
        </div>
      </section>

      {/* Constraints */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3" data-constraints>
        <p className="text-xs font-semibold text-gray-700">Constraints</p>
        <p className="text-xs text-gray-500">idempotency_key must be unique per (sourceActionKey, entityId) pair.</p>
        <div className="space-y-1.5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Unique</p>
            {contract.uniqueConstraints.map(col => (
              <span key={col} className="font-mono text-xs bg-green-50 text-green-700 rounded px-2 py-0.5">
                {col}
              </span>
            ))}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Check</p>
            <div className="flex flex-wrap gap-1.5">
              {contract.checkConstraints.map(c => (
                <span key={c} className="font-mono text-xs bg-amber-50 text-amber-700 rounded px-2 py-0.5">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Locked boolean columns */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-2" data-locked-boolean-columns>
        <p className="text-xs font-semibold text-gray-700">Locked Boolean Columns</p>
        <p className="text-xs text-gray-500">These columns are enforced true by CHECK constraints. They cannot be overridden.</p>
        <div className="flex gap-3">
          {Object.entries(contract.lockedBooleanColumns).map(([col, val]) => (
            <div key={col} className="font-mono text-xs bg-blue-50 text-blue-700 rounded px-3 py-1.5">
              {col}: <span className="font-semibold">{String(val)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SQL source */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-2" data-sql-source>
        <p className="text-xs font-semibold text-gray-700">Migration Source</p>
        <p className="font-mono text-xs text-gray-500">{contract.migrationRelativePath}</p>
        <pre className="rounded bg-gray-50 border border-gray-100 p-3 text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-96">
          {sqlContent}
        </pre>
      </section>
    </main>
  )
}
