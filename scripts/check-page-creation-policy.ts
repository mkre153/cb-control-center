#!/usr/bin/env tsx
/**
 * CBCC Part 14 — Page-creation policy guard
 *
 * Standalone CLI version of the page-creation policy that's already
 * enforced inside the test suite (`lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts`).
 *
 * Why this exists:
 *   The test only fires when the full suite runs. Developers and agents
 *   who only run typecheck or lint can accidentally commit a new
 *   restricted-prefix page without anyone noticing until CI. This
 *   script makes the same check runnable in isolation.
 *
 * What it enforces (mirrors the test exactly):
 *   - Walks every file under each DAP_PAGE_CREATION_POLICY prefix.
 *   - Allows files in `allowedBaselineFiles` for that rule.
 *   - Rejects every other file unless its `requiredStageNumber` is
 *     approved.
 *
 * Strictest mode: this script always passes `approvedStageNumbers: []`,
 * so every new restricted-prefix file forces a deliberate edit to the
 * baseline allowlist (or an explicit decision to approve the gating
 * stage). That's the same posture the existing test takes.
 *
 * Usage:
 *   pnpm check:page-policy
 *
 * Exits 0 when the policy passes. Exits 1 when it fails (with a clear
 * per-file violation list).
 *
 * Boundary rules (Part 14):
 *   - No network access.
 *   - No Supabase / DB reads.
 *   - No AI / Anthropic SDK.
 *   - No environment variables required.
 *   - No Next.js runtime imports.
 */

import { readdirSync, statSync } from 'fs'
import { resolve, relative } from 'path'

import {
  enforcePageCreationPolicy,
  type CbccPageCreationPolicyRule,
} from '../lib/cbcc/pageCreationPolicy'
import { DAP_PAGE_CREATION_POLICY } from '../lib/cbcc/adapters/dap/dapPageCreationPolicy'

const REPO_ROOT = resolve(__dirname, '..')
const PAGE_FILE_RE = /\.(tsx|ts)$/

function walkPageFiles(absDir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(absDir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const abs = resolve(absDir, entry)
    let s
    try {
      s = statSync(abs)
    } catch {
      continue
    }
    if (s.isDirectory()) {
      out.push(...walkPageFiles(abs))
    } else if (PAGE_FILE_RE.test(entry)) {
      out.push(relative(REPO_ROOT, abs))
    }
  }
  return out
}

function collectFoundFiles(rules: ReadonlyArray<CbccPageCreationPolicyRule>): string[] {
  const seen = new Set<string>()
  for (const rule of rules) {
    const dir = rule.pathPrefix.replace(/\/$/, '')
    for (const f of walkPageFiles(resolve(REPO_ROOT, dir))) seen.add(f)
  }
  return [...seen].sort()
}

function main(): number {
  const rules = DAP_PAGE_CREATION_POLICY
  const foundFiles = collectFoundFiles(rules)

  const result = enforcePageCreationPolicy({
    rules,
    foundFiles,
    // Strictest mode: every restricted file must be in the baseline
    // allowlist explicitly. Approving Stage 7 in DAP_PROJECT will not
    // silently widen this guard.
    approvedStageNumbers: [],
  })

  if (result.ok) {
    console.log('check-page-creation-policy: pass')
    console.log(`  scanned ${foundFiles.length} file(s) under ${rules.length} rule prefix(es)`)
    return 0
  }

  console.error('check-page-creation-policy: FAIL')
  console.error(`  ${result.violations.length} violation(s):`)
  for (const v of result.violations) {
    console.error(`  - ${v.file}`)
    console.error(`      prefix: ${v.rule.pathPrefix}`)
    console.error(`      required stage: ${v.rule.requiredStageNumber}`)
  }
  console.error('')
  console.error('How to resolve:')
  console.error('  - If the file is intentional baseline content, add it to')
  console.error('    DAP_PAGE_CREATION_POLICY[].allowedBaselineFiles in')
  console.error('    lib/cbcc/adapters/dap/dapPageCreationPolicy.ts.')
  console.error('  - If the file is premature, delete it until the gating')
  console.error('    stage is owner-approved.')
  return 1
}

process.exit(main())
