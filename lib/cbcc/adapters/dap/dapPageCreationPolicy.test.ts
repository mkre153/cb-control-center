// CBCC adapter — DAP page-creation policy guard test (Part 10)
//
// Walks the filesystem under the three DAP-restricted prefixes
// (`app/dental-advantage-plan/`, `app/guides/`, `app/treatments/`) and
// asserts every file is either in the baseline allowlist below or that
// the corresponding required stage is approved.
//
// When a developer adds a new file under one of these prefixes, this test
// fails until either (a) the relevant stage is approved or (b) the file is
// added to allowedBaselineFiles below as a deliberate, reviewed exception.
//
// The test is deterministic and reads only the local filesystem — no
// network, no DB, no AI.

import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'fs'
import { resolve, relative } from 'path'
import { enforcePageCreationPolicy } from '../../pageCreationPolicy'
import { DAP_PAGE_CREATION_POLICY } from './dapPageCreationPolicy'

const REPO_ROOT = resolve(__dirname, '../../../..')

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

// Stage mapping: by current DAP stage model, page architecture is decided in
// Stage 6 and built/launched in Stage 7. The conservative choice is to gate
// every public/content surface on Stage 7 — i.e. those pages should not exist
// until Build/QA/Launch is owner-approved. Today, only Stage 1 is approved
// in DAP_PROJECT baseline, so only the baseline files below are allowed.
//
// The DAP_PAGE_CREATION_POLICY constant lives in `dapPageCreationPolicy.ts`
// (Part 14 extract) so it can also be consumed by the standalone
// `scripts/check-page-creation-policy.ts` guard without crossing the
// adapter folder's purity boundaries.

describe('Group 1 — DAP page-creation policy: baseline files are allowed', () => {
  // Snapshot of what's on disk under restricted prefixes today.
  const foundFiles = [
    ...walkPageFiles(resolve(REPO_ROOT, 'app/dental-advantage-plan')),
    ...walkPageFiles(resolve(REPO_ROOT, 'app/guides')),
    ...walkPageFiles(resolve(REPO_ROOT, 'app/treatments')),
  ]

  it('found a non-empty file list (sanity check)', () => {
    expect(foundFiles.length).toBeGreaterThan(0)
  })

  it('every existing file is in the baseline allowlist', () => {
    const result = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles,
      approvedStageNumbers: [], // no stages approved → strictest check possible
    })
    if (!result.ok) {
      // Emit a clear message so a future contributor sees what to add.
      const lines = result.violations.map(v => `  - ${v.file} (rule: ${v.rule.pathPrefix})`)
      throw new Error(
        `DAP page-creation policy violations:\n${lines.join('\n')}\n\n` +
        `If these files are legitimate baseline content, add them to ` +
        `DAP_PAGE_CREATION_POLICY[].allowedBaselineFiles in ` +
        `lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts.`,
      )
    }
    expect(result.ok).toBe(true)
  })
})

describe('Group 2 — DAP page-creation policy: future files require approval', () => {
  it('a synthetic future file under app/dental-advantage-plan/ fails when Stage 7 is not approved', () => {
    const synthetic = ['app/dental-advantage-plan/new-thing/page.tsx']
    const result = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: synthetic,
      approvedStageNumbers: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]!.file).toBe(synthetic[0])
    }
  })

  it('the same synthetic file is allowed once Stage 7 is approved', () => {
    const synthetic = ['app/dental-advantage-plan/new-thing/page.tsx']
    const result = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: synthetic,
      approvedStageNumbers: [1, 2, 3, 4, 5, 6, 7],
    })
    expect(result.ok).toBe(true)
  })

  it('a file outside every restricted prefix is ignored', () => {
    const elsewhere = ['app/projects/[slug]/page.tsx', 'lib/cbcc/index.ts']
    const result = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: elsewhere,
      approvedStageNumbers: [],
    })
    expect(result.ok).toBe(true)
  })

  it('an explicitly allowlisted file passes even when no stage is approved', () => {
    const allowlisted = ['app/dental-advantage-plan/page.tsx']
    const result = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: allowlisted,
      approvedStageNumbers: [],
    })
    expect(result.ok).toBe(true)
  })

  it('a synthetic file under app/guides/ fails until Stage 7 is approved', () => {
    const synthetic = ['app/guides/new-guide/page.tsx']
    const blocked = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: synthetic,
      approvedStageNumbers: [1, 2, 3, 4, 5, 6],
    })
    expect(blocked.ok).toBe(false)
    const allowed = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: synthetic,
      approvedStageNumbers: [1, 2, 3, 4, 5, 6, 7],
    })
    expect(allowed.ok).toBe(true)
  })
})
