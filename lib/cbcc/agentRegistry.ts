// CBCC generic engine — agent registry (Part 5)
//
// A registry of generic agent definitions. Agents describe capabilities;
// they are not tied to any vertical. The runtime consumes these definitions
// to gate what an agent run is allowed to do.

import type { CbccAgentDefinition, CbccAgentId } from './types'

// ─── Default registry ─────────────────────────────────────────────────────────

export const CBCC_DEFAULT_AGENT_REGISTRY: ReadonlyArray<CbccAgentDefinition> = Object.freeze([
  {
    id: 'stage-context-reader',
    kind: 'stage_worker',
    name: 'Stage Context Reader',
    description:
      'Reads the current stage context and summarizes what is required before work can proceed.',
    producesEvidence: false,
    producesArtifact: false,
  },
  {
    id: 'evidence-ledger-assistant',
    kind: 'evidence_collector',
    name: 'Evidence Ledger Assistant',
    description:
      'Suggests structured evidence entries for owner review. Cannot append to the ledger directly.',
    producesEvidence: true,
    producesArtifact: false,
  },
  {
    id: 'stage-artifact-draft-agent',
    kind: 'stage_worker',
    name: 'Stage Artifact Draft Agent',
    description:
      'Produces a draft artifact for the current stage. The artifact is always subject to owner review and never auto-approved.',
    producesEvidence: true,
    producesArtifact: true,
  },
  {
    id: 'stage-reviewer',
    kind: 'reviewer',
    name: 'Stage Reviewer',
    description:
      'Reviews submitted evidence and artifact, surfaces risks, and recommends owner review. Never approves.',
    producesEvidence: false,
    producesArtifact: false,
  },
])

// ─── Lookup + validation ──────────────────────────────────────────────────────

export function getCbccAgent(
  registry: ReadonlyArray<CbccAgentDefinition>,
  id: CbccAgentId,
): CbccAgentDefinition | null {
  return registry.find(a => a.id === id) ?? null
}

export interface AgentRegistryValidationResult {
  ok: boolean
  errors: ReadonlyArray<string>
}

export function validateCbccAgentRegistry(
  registry: ReadonlyArray<CbccAgentDefinition>,
): AgentRegistryValidationResult {
  const errors: string[] = []
  const seen = new Set<string>()
  for (let i = 0; i < registry.length; i++) {
    const a = registry[i]
    if (!a.id || !a.id.trim()) errors.push(`agent[${i}].id is required`)
    if (!a.kind) errors.push(`agent[${i}].kind is required`)
    if (!a.name || !a.name.trim()) errors.push(`agent[${i}].name is required`)
    if (!a.description || !a.description.trim()) errors.push(`agent[${i}].description is required`)
    if (a.id) {
      if (seen.has(a.id)) errors.push(`duplicate agent id: ${a.id}`)
      seen.add(a.id)
    }
  }
  return { ok: errors.length === 0, errors }
}
