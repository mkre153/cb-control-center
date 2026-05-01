export type CbccProjectStatus =
  | 'step_0_draft'
  | 'step_0_charter_ready'
  | 'step_0_approved'
  | 'in_progress'
  | 'completed'
  | 'archived'

export type CbccStageStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'awaiting_approval'
  | 'approved'

export interface CbccProjectIntake {
  name: string
  businessType: string
  primaryGoal: string
  targetCustomer: string
  knownConstraints: string
  forbiddenClaims: string
  sourceUrlsNotes: string
  desiredOutputType: string
  approvalOwner: string
}

export interface ProjectCharter {
  whatThisIs: string
  whatThisIsNot: string
  whoItServes: string
  allowedClaims: string[]
  forbiddenClaims: string[]
  requiredEvidence: string[]
  approvalAuthority: string
  presetStages: Array<{ number: number; key: string; title: string; description: string }>
}

export interface CbccProject {
  id: string
  slug: string
  name: string
  businessType: string | null
  primaryGoal: string | null
  targetCustomer: string | null
  knownConstraints: string | null
  forbiddenClaims: string | null
  sourceUrlsNotes: string | null
  desiredOutputType: string | null
  approvalOwner: string | null
  charterJson: ProjectCharter | null
  charterGeneratedAt: string | null
  charterModel: string | null
  charterApproved: boolean
  charterApprovedAt: string | null
  charterApprovedBy: string | null
  charterVersion: number
  charterHash: string | null
  projectStatus: CbccProjectStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectStage {
  id: string
  projectId: string
  stageNumber: number
  stageKey: string
  stageTitle: string
  stageStatus: CbccStageStatus
  approved: boolean
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface StageVisibility {
  stageNumber: number
  status: CbccStageStatus
  reason?: string
}
