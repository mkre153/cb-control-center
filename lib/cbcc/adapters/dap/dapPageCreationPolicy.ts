// CBCC adapter — DAP page-creation policy data (Part 14 extract)
//
// Pure rule data: prefix to required-stage plus baseline-allowlist. No IO,
// no SDK, no Next.js / React, and no imports from the legacy app-layer
// folder. Compatible with the adapter folder purity invariants asserted
// by Part 7 / Part 13 boundary tests.
//
// Consumers:
//   - the sibling test file that walks the disk and enforces the policy
//     during the suite run
//   - the standalone CLI guard at scripts/check-page-creation-policy.ts
//     (Part 14)
//
// Edit allowedBaselineFiles deliberately when a new file under one of
// these prefixes is intentionally added. The two consumers above
// automatically pick up the new entry.

import type { CbccPageCreationPolicyRule } from '../../pageCreationPolicy'

export const DAP_PAGE_CREATION_POLICY: ReadonlyArray<CbccPageCreationPolicyRule> = [
  {
    pathPrefix: 'app/dental-advantage-plan/',
    requiredStageNumber: 7,
    allowedBaselineFiles: [
      'app/dental-advantage-plan/cities/[city]/page.tsx',
      'app/dental-advantage-plan/compare/page.tsx',
      'app/dental-advantage-plan/dentists/[city]/[practiceSlug]/page.tsx',
      'app/dental-advantage-plan/dentists/[city]/page.tsx',
      'app/dental-advantage-plan/find-a-dentist/page.tsx',
      'app/dental-advantage-plan/for-practices/page.tsx',
      'app/dental-advantage-plan/guide/page.tsx',
      'app/dental-advantage-plan/how-it-works/page.tsx',
      'app/dental-advantage-plan/layout.tsx',
      'app/dental-advantage-plan/member-status/[membershipId]/page.tsx',
      'app/dental-advantage-plan/page.tsx',
      'app/dental-advantage-plan/savings/page.tsx',
      'app/dental-advantage-plan/vs-insurance/page.tsx',
    ],
  },
  {
    pathPrefix: 'app/guides/',
    requiredStageNumber: 7,
    allowedBaselineFiles: [
      'app/guides/[slug]/page.tsx',
      'app/guides/layout.tsx',
    ],
  },
  {
    pathPrefix: 'app/treatments/',
    requiredStageNumber: 7,
    allowedBaselineFiles: [
      'app/treatments/[slug]/page.tsx',
      'app/treatments/layout.tsx',
    ],
  },
]

// Convenience for callers that want to walk the same prefixes the rules
// reference (so the script and test never disagree on what "the DAP
// page tree" is). Returns repository-relative directory roots.
export const DAP_PAGE_CREATION_POLICY_PREFIXES: ReadonlyArray<string> =
  DAP_PAGE_CREATION_POLICY.map(r => r.pathPrefix.replace(/\/$/, ''))
