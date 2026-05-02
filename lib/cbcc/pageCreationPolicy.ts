// CBCC generic engine — page-creation policy (Part 10)
//
// Pure rule-evaluation. The engine knows how to check a list of file paths
// against a list of policy rules; it does not know which prefixes belong
// to DAP or any other vertical. Adapters supply the rules.
//
// Rule shape:
//
//   { pathPrefix, requiredStageNumber, allowedBaselineFiles }
//
//   - pathPrefix: any file path starting with this string is "restricted"
//     by the rule.
//   - requiredStageNumber: a restricted file is allowed if this stage is
//     approved.
//   - allowedBaselineFiles: a restricted file that already existed at the
//     time the rule was authored is allowed unconditionally — these are
//     the snapshot of accepted-historical files. Future file additions
//     under the prefix that are NOT in this list require the stage to be
//     approved.
//
// Files outside every rule's prefix are simply ignored — the policy is
// "restrict listed prefixes, leave everything else alone."

export interface CbccPageCreationPolicyRule {
  pathPrefix: string
  requiredStageNumber: number
  allowedBaselineFiles: ReadonlyArray<string>
}

export interface CbccPageCreationPolicyInput {
  rules: ReadonlyArray<CbccPageCreationPolicyRule>
  foundFiles: ReadonlyArray<string>
  approvedStageNumbers: ReadonlyArray<number>
}

export interface CbccPageCreationPolicyViolation {
  file: string
  rule: CbccPageCreationPolicyRule
  reason: string
}

export type CbccPageCreationPolicyResult =
  | { ok: true; violations: readonly [] }
  | { ok: false; violations: ReadonlyArray<CbccPageCreationPolicyViolation> }

export function enforcePageCreationPolicy(
  input: CbccPageCreationPolicyInput,
): CbccPageCreationPolicyResult {
  const approved = new Set(input.approvedStageNumbers)
  const violations: CbccPageCreationPolicyViolation[] = []

  for (const file of input.foundFiles) {
    for (const rule of input.rules) {
      if (!file.startsWith(rule.pathPrefix)) continue

      const isBaseline = rule.allowedBaselineFiles.includes(file)
      if (isBaseline) continue

      const stageOk = approved.has(rule.requiredStageNumber)
      if (stageOk) continue

      violations.push({
        file,
        rule,
        reason:
          `File "${file}" is under the restricted prefix "${rule.pathPrefix}" but ` +
          `Stage ${rule.requiredStageNumber} is not approved and the file is not in the baseline allowlist. ` +
          `Either approve Stage ${rule.requiredStageNumber} first or add the file to allowedBaselineFiles ` +
          `if its presence pre-dates the rule.`,
      })
    }
  }

  if (violations.length === 0) return { ok: true, violations: [] }
  return { ok: false, violations }
}
