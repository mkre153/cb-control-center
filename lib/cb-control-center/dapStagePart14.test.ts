/**
 * Part 14 — Page-creation policy guard acceptance suite.
 *
 * Verifies that the standalone CLI guard (`scripts/check-page-creation-policy.ts`)
 * is wired up, mirrors the existing test-time policy, and stays free of
 * the dependencies the rest of the CBCC architecture forbids.
 *
 * Sections:
 *   A. Pure-data extract: DAP_PAGE_CREATION_POLICY lives in a module the
 *      script can import without crossing adapter purity boundaries.
 *   B. Policy enforcement parity: known allowed files pass; a simulated
 *      unauthorized file is rejected with a clear failure reason.
 *   C. Script-source boundaries: the script imports no AI / Supabase /
 *      Next-runtime / env-var module, and exits non-zero on violation.
 *   D. Package-script presence: `check:page-policy` exists in package.json
 *      and runs via the existing tsx convention.
 *   E. Behavior preservation: prior tests' shape and contracts are intact.
 *
 * No DOM, no JSdom, no network, no DB. Pure filesystem + child_process.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { spawnSync } from 'child_process'

import { enforcePageCreationPolicy } from '@/lib/cbcc/pageCreationPolicy'
import {
  DAP_PAGE_CREATION_POLICY,
  DAP_PAGE_CREATION_POLICY_PREFIXES,
} from '@/lib/cbcc/adapters/dap/dapPageCreationPolicy'

const ROOT = resolve(__dirname, '..', '..')
const SCRIPT_PATH = resolve(ROOT, 'scripts/check-page-creation-policy.ts')
const POLICY_DATA_PATH = resolve(ROOT, 'lib/cbcc/adapters/dap/dapPageCreationPolicy.ts')
const POLICY_TEST_PATH = resolve(ROOT, 'lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts')
const PACKAGE_JSON = resolve(ROOT, 'package.json')

// ─── A. Pure-data extract ──────────────────────────────────────────────────

describe('Part 14 — A. Pure-data extract module', () => {
  it('lib/cbcc/adapters/dap/dapPageCreationPolicy.ts exists', () => {
    expect(existsSync(POLICY_DATA_PATH)).toBe(true)
  })

  it('module exports DAP_PAGE_CREATION_POLICY with at least 3 rules', () => {
    expect(Array.isArray(DAP_PAGE_CREATION_POLICY)).toBe(true)
    expect(DAP_PAGE_CREATION_POLICY.length).toBeGreaterThanOrEqual(3)
  })

  it('every rule has a prefix, requiredStageNumber, and a baseline list', () => {
    for (const rule of DAP_PAGE_CREATION_POLICY) {
      expect(rule.pathPrefix).toMatch(/^app\//)
      expect(rule.pathPrefix.endsWith('/')).toBe(true)
      expect(typeof rule.requiredStageNumber).toBe('number')
      expect(Array.isArray(rule.allowedBaselineFiles)).toBe(true)
    }
  })

  it('module is pure-data: no IO / SDK / cb-control-center / Next imports', () => {
    const src = readFileSync(POLICY_DATA_PATH, 'utf-8')
    expect(src).not.toMatch(/from ['"]fs['"]|from ['"]node:fs['"]/)
    expect(src).not.toMatch(/@anthropic-ai\/sdk|getAnthropicClient/)
    expect(src).not.toMatch(/\bsupabase\b/i)
    expect(src).not.toMatch(/from ['"]next\//)
    expect(src).not.toMatch(/from ['"]react['"]/)
    expect(src).not.toMatch(/from ['"]@\/lib\/cb-control-center/)
    expect(src).not.toMatch(/['"]use server['"]|['"]use client['"]/)
  })

  it('exposes a prefix list aligned with the rule set', () => {
    expect(DAP_PAGE_CREATION_POLICY_PREFIXES.length).toBe(DAP_PAGE_CREATION_POLICY.length)
    for (let i = 0; i < DAP_PAGE_CREATION_POLICY.length; i++) {
      expect(DAP_PAGE_CREATION_POLICY_PREFIXES[i]).toBe(
        DAP_PAGE_CREATION_POLICY[i]!.pathPrefix.replace(/\/$/, ''),
      )
    }
  })

  it('the legacy test file no longer declares its own DAP_PAGE_CREATION_POLICY const', () => {
    const src = readFileSync(POLICY_TEST_PATH, 'utf-8')
    expect(src).not.toMatch(/^export const DAP_PAGE_CREATION_POLICY/m)
    // …and instead imports it from the new pure-data module.
    expect(src).toContain("from './dapPageCreationPolicy'")
  })
})

// ─── B. Policy enforcement parity ──────────────────────────────────────────

describe('Part 14 — B. Policy enforcement parity', () => {
  it('every rule baseline file is allowed when no stages are approved', () => {
    for (const rule of DAP_PAGE_CREATION_POLICY) {
      const result = enforcePageCreationPolicy({
        rules: [rule],
        foundFiles: [...rule.allowedBaselineFiles],
        approvedStageNumbers: [],
      })
      expect(result.ok, `baseline files for ${rule.pathPrefix} must pass`).toBe(true)
    }
  })

  it('a simulated unauthorized file under each prefix is rejected with a clear reason', () => {
    for (const rule of DAP_PAGE_CREATION_POLICY) {
      const synthetic = `${rule.pathPrefix}__part14_synthetic__/page.tsx`
      const result = enforcePageCreationPolicy({
        rules: [rule],
        foundFiles: [synthetic],
        approvedStageNumbers: [],
      })
      expect(result.ok).toBe(false)
      if (result.ok) continue
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]!.file).toBe(synthetic)
      expect(result.violations[0]!.rule.pathPrefix).toBe(rule.pathPrefix)
      expect(result.violations[0]!.reason).toContain(`Stage ${rule.requiredStageNumber}`)
      expect(result.violations[0]!.reason).toMatch(/baseline allowlist/)
    }
  })

  it('the same simulated file passes once the gating stage is approved', () => {
    for (const rule of DAP_PAGE_CREATION_POLICY) {
      const synthetic = `${rule.pathPrefix}__part14_synthetic__/page.tsx`
      const result = enforcePageCreationPolicy({
        rules: [rule],
        foundFiles: [synthetic],
        approvedStageNumbers: [rule.requiredStageNumber],
      })
      expect(result.ok).toBe(true)
    }
  })

  it('files outside every restricted prefix are ignored entirely', () => {
    const elsewhere = [
      'app/projects/[slug]/page.tsx',
      'lib/cbcc/index.ts',
      'scripts/check-page-creation-policy.ts',
    ]
    const result = enforcePageCreationPolicy({
      rules: DAP_PAGE_CREATION_POLICY,
      foundFiles: elsewhere,
      approvedStageNumbers: [],
    })
    expect(result.ok).toBe(true)
  })
})

// ─── C. Script source boundaries ───────────────────────────────────────────

describe('Part 14 — C. Standalone guard script boundaries', () => {
  const src = readFileSync(SCRIPT_PATH, 'utf-8')

  it('script exists', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true)
  })

  it('script imports no AI / Anthropic SDK module', () => {
    expect(src).not.toMatch(/@anthropic-ai\/sdk|getAnthropicClient|StageAiReview|reviewStage/)
  })

  it('script imports no Supabase module', () => {
    // Match an actual import of a supabase-named module, not the bare
    // word — the script intentionally calls out in comments that it
    // does no Supabase IO, and that documentation should not trip a
    // boundary check.
    expect(src).not.toMatch(/from ['"][^'"]*supabase[^'"]*['"]/i)
    expect(src).not.toMatch(/getSupabaseAdminClient\s*\(/)
    expect(src).not.toMatch(/createClient\s*\(\s*['"]https?:\/\//)
  })

  it('script imports no Next.js runtime module', () => {
    expect(src).not.toMatch(/from ['"]next\//)
    expect(src).not.toMatch(/from ['"]react['"]/)
    expect(src).not.toMatch(/['"]use server['"]|['"]use client['"]/)
  })

  it('script does not require environment variables to run', () => {
    expect(src).not.toMatch(/process\.env\.[A-Z]/)
  })

  it('script does not perform network IO', () => {
    expect(src).not.toMatch(/\bfetch\s*\(/)
    expect(src).not.toMatch(/\bhttps?:\/\//)
  })

  it('script reuses the engine policy module + the pure-data DAP rules', () => {
    expect(src).toContain("from '../lib/cbcc/pageCreationPolicy'")
    expect(src).toContain("from '../lib/cbcc/adapters/dap/dapPageCreationPolicy'")
  })

  it('script exits 0 on success and 1 on failure (returned by main())', () => {
    expect(src).toMatch(/return 0/)
    expect(src).toMatch(/return 1/)
    expect(src).toMatch(/process\.exit\(main\(\)\)/)
  })

  it('runs against the current tree and exits 0', () => {
    const r = spawnSync('pnpm', ['check:page-policy'], {
      cwd: ROOT,
      encoding: 'utf-8',
    })
    expect(r.status, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`).toBe(0)
    expect(r.stdout).toMatch(/check-page-creation-policy: pass/)
  }, 60_000)
})

// ─── D. Package-script presence ────────────────────────────────────────────

describe('Part 14 — D. package.json script wiring', () => {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8')) as {
    scripts: Record<string, string>
    devDependencies?: Record<string, string>
  }

  it('check:page-policy script is registered', () => {
    expect(pkg.scripts['check:page-policy']).toBeDefined()
  })

  it('script invokes the new guard via the existing tsx runner', () => {
    expect(pkg.scripts['check:page-policy']).toContain('tsx scripts/check-page-creation-policy.ts')
  })

  it('combined `check` script includes the new policy gate', () => {
    expect(pkg.scripts['check']).toBeDefined()
    expect(pkg.scripts['check']).toMatch(/check:page-policy/)
  })

  it('tsx is already a devDependency (no new tooling introduced)', () => {
    expect(pkg.devDependencies?.['tsx']).toBeDefined()
  })

  it('previously declared scripts are intact', () => {
    for (const name of ['dev', 'build', 'start', 'lint', 'test', 'typecheck']) {
      expect(pkg.scripts[name], `script "${name}" must remain`).toBeDefined()
    }
  })
})

// ─── E. Behavior preservation ──────────────────────────────────────────────

describe('Part 14 — E. Prior behavior preserved', () => {
  it('legacy test file still walks the same prefixes and uses the same enforcer', () => {
    const src = readFileSync(POLICY_TEST_PATH, 'utf-8')
    expect(src).toContain("from '../../pageCreationPolicy'")
    expect(src).toContain('app/dental-advantage-plan')
    expect(src).toContain('app/guides')
    expect(src).toContain('app/treatments')
  })

  it('the engine policy module export shape is unchanged', async () => {
    const mod = await import('@/lib/cbcc/pageCreationPolicy')
    expect(typeof mod.enforcePageCreationPolicy).toBe('function')
  })
})
