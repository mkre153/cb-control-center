#!/usr/bin/env tsx
/**
 * CBCC v2 — one-shot stage repair script
 *
 * Loops every project in `cbcc_projects` and runs `ensureProjectStages` on each.
 * Idempotent: safe to run repeatedly. Prints a per-project report and exits non-
 * zero if any project errored.
 *
 * Usage:
 *   pnpm tsx scripts/cbccEnsureStages.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (same key the app uses).
 */

import { listProjects, ensureProjectStages } from '../lib/cb-control-center/cbccProjectRepository'
import type { EnsureStagesReport } from '../lib/cb-control-center/cbccProjectRepository'

interface Row {
  slug: string
  inserted: number
  reconciled: number
  unchanged: number
  drift: string
  error?: string
}

function summarizeDrift(report: EnsureStagesReport): string {
  if (report.driftCorrected.length === 0) return '—'
  const byField = report.driftCorrected.reduce<Record<string, number>>((acc, d) => {
    acc[d.field] = (acc[d.field] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(byField)
    .map(([f, n]) => `${f}×${n}`)
    .join(', ')
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('error: SUPABASE_SERVICE_ROLE_KEY not set')
    process.exit(2)
  }

  const projects = await listProjects()
  if (projects.length === 0) {
    console.log('no projects found')
    return
  }

  const rows: Row[] = []
  let hadError = false

  for (const p of projects) {
    try {
      const report = await ensureProjectStages(p.id)
      rows.push({
        slug: p.slug,
        inserted: report.inserted,
        reconciled: report.updatedReconciled,
        unchanged: report.unchanged,
        drift: summarizeDrift(report),
      })
    } catch (e) {
      hadError = true
      rows.push({
        slug: p.slug,
        inserted: 0,
        reconciled: 0,
        unchanged: 0,
        drift: '—',
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const slugW = Math.max(20, ...rows.map(r => r.slug.length))
  const header =
    `${pad('slug', slugW)} | ins | rec | unc | drift`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const r of rows) {
    console.log(
      `${pad(r.slug, slugW)} | ${pad(String(r.inserted), 3)} | ${pad(String(r.reconciled), 3)} | ${pad(String(r.unchanged), 3)} | ${r.drift}`,
    )
    if (r.error) console.log(`  error: ${r.error}`)
  }

  if (hadError) process.exit(1)
}

main().catch(e => {
  console.error('fatal:', e)
  process.exit(1)
})
