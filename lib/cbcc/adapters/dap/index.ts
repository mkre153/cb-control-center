// CBCC adapter — DAP (Dental Advantage Plan).
//
// Adapter glue that wires DAP's project metadata, stage definitions,
// artifacts, and evidence into the generic CBCC engine via the
// CbccProjectAdapter contract. Callers get the entire DAP integration
// from this single import:
//
//   import { DAP_ADAPTER, DAP_PROJECT, DAP_STAGE_DEFINITIONS } from '@/lib/cbcc/adapters/dap'
//
// The generic engine (lib/cbcc/*.ts) does NOT import any of this. DAP is a
// downstream consumer of the engine, not a primitive of it.

import type { CbccProjectAdapter } from '../../types'
import { createProjectAdapter } from '../../adapters'
import { DAP_ADAPTER_KEY, DAP_PROJECT, DAP_PROJECT_ID } from './dapProject'
import { DAP_STAGE_DEFINITIONS } from './dapStages'
import { getDapStageArtifact, validateDapStageArtifact } from './dapArtifacts'
import { getDapEvidenceForStage } from './dapEvidence'

export * from './dapProject'
export * from './dapStages'
export * from './dapArtifacts'
export * from './dapEvidence'

export const DAP_ADAPTER: CbccProjectAdapter = createProjectAdapter({
  key: DAP_ADAPTER_KEY,
  getProjectDefinition(projectId) {
    return projectId === DAP_PROJECT_ID ? DAP_PROJECT : null
  },
  getStageDefinitions(projectId) {
    return projectId === DAP_PROJECT_ID ? DAP_STAGE_DEFINITIONS : []
  },
  getStageArtifact(projectId, stageId) {
    if (projectId !== DAP_PROJECT_ID) return null
    return getDapStageArtifact(stageId)
  },
  validateStageArtifact(stageId, artifact) {
    const r = validateDapStageArtifact(stageId, artifact)
    return { valid: r.valid, errors: r.errors }
  },
  getEvidenceForStage(projectId, stageId) {
    if (projectId !== DAP_PROJECT_ID) return []
    return getDapEvidenceForStage(stageId)
  },
})
