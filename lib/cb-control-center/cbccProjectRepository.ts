import { createHash } from 'crypto'
import { getSupabaseAdminClient } from './supabaseClient'
import type { CbccProject, CbccProjectIntake, ProjectCharter, ProjectStage } from './cbccProjectTypes'

function toProject(row: Record<string, unknown>): CbccProject {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    businessType: (row.business_type as string) ?? null,
    primaryGoal: (row.primary_goal as string) ?? null,
    targetCustomer: (row.target_customer as string) ?? null,
    knownConstraints: (row.known_constraints as string) ?? null,
    forbiddenClaims: (row.forbidden_claims as string) ?? null,
    sourceUrlsNotes: (row.source_urls_notes as string) ?? null,
    desiredOutputType: (row.desired_output_type as string) ?? null,
    approvalOwner: (row.approval_owner as string) ?? null,
    charterJson: (row.charter_json as ProjectCharter) ?? null,
    charterGeneratedAt: (row.charter_generated_at as string) ?? null,
    charterModel: (row.charter_model as string) ?? null,
    charterApproved: (row.charter_approved as boolean) ?? false,
    charterApprovedAt: (row.charter_approved_at as string) ?? null,
    charterApprovedBy: (row.charter_approved_by as string) ?? null,
    charterVersion: (row.charter_version as number) ?? 1,
    charterHash: (row.charter_hash as string) ?? null,
    projectStatus: row.project_status as CbccProject['projectStatus'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function toStage(row: Record<string, unknown>): ProjectStage {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    stageNumber: row.stage_number as number,
    stageKey: row.stage_key as string,
    stageTitle: row.stage_title as string,
    stageStatus: row.stage_status as ProjectStage['stageStatus'],
    approved: (row.approved as boolean) ?? false,
    approvedAt: (row.approved_at as string) ?? null,
    approvedBy: (row.approved_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function createProject(
  data: CbccProjectIntake & { slug: string }
): Promise<CbccProject> {
  const db = getSupabaseAdminClient()
  const { data: row, error } = await db
    .from('cbcc_projects')
    .insert({
      slug: data.slug,
      name: data.name,
      business_type: data.businessType,
      primary_goal: data.primaryGoal,
      target_customer: data.targetCustomer,
      known_constraints: data.knownConstraints,
      forbidden_claims: data.forbiddenClaims,
      source_urls_notes: data.sourceUrlsNotes,
      desired_output_type: data.desiredOutputType,
      approval_owner: data.approvalOwner,
    })
    .select()
    .single()

  if (error) throw new Error(`createProject: ${error.message}`)
  return toProject(row as Record<string, unknown>)
}

export async function getProjectBySlug(slug: string): Promise<CbccProject | null> {
  const db = getSupabaseAdminClient()
  const { data: row, error } = await db
    .from('cbcc_projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(`getProjectBySlug: ${error.message}`)
  if (!row) return null
  return toProject(row as Record<string, unknown>)
}

export async function getProjectStages(projectId: string): Promise<ProjectStage[]> {
  const db = getSupabaseAdminClient()
  const { data: rows, error } = await db
    .from('cbcc_project_stages')
    .select('*')
    .eq('project_id', projectId)
    .order('stage_number', { ascending: true })

  if (error) throw new Error(`getProjectStages: ${error.message}`)
  return (rows as Record<string, unknown>[]).map(toStage)
}

export async function saveCharter(projectId: string, charter: ProjectCharter): Promise<void> {
  const db = getSupabaseAdminClient()
  const { error } = await db
    .from('cbcc_projects')
    .update({
      charter_json: charter,
      charter_generated_at: new Date().toISOString(),
      charter_model: 'claude-opus-4-7',
      project_status: 'step_0_charter_ready',
    })
    .eq('id', projectId)

  if (error) throw new Error(`saveCharter: ${error.message}`)
}

export async function approveCharter(projectId: string, approvedBy: string): Promise<void> {
  const db = getSupabaseAdminClient()

  // Read current charter_json to compute the hash
  const { data: row, error: fetchError } = await db
    .from('cbcc_projects')
    .select('charter_json, charter_version')
    .eq('id', projectId)
    .single()

  if (fetchError) throw new Error(`approveCharter fetch: ${fetchError.message}`)
  if (!row || !row.charter_json) {
    throw new Error('approveCharter: cannot approve — charter_json is null')
  }

  const charterHash = createHash('sha256')
    .update(JSON.stringify(row.charter_json))
    .digest('hex')

  const { error: updateError } = await db
    .from('cbcc_projects')
    .update({
      charter_approved: true,
      charter_approved_at: new Date().toISOString(),
      charter_approved_by: approvedBy,
      charter_version: ((row.charter_version as number) ?? 0) + 1,
      charter_hash: charterHash,
      project_status: 'step_0_approved',
    })
    .eq('id', projectId)

  if (updateError) throw new Error(`approveCharter update: ${updateError.message}`)

  // Flip Stage 1 to 'available'
  const { error: stageError } = await db
    .from('cbcc_project_stages')
    .update({ stage_status: 'available' })
    .eq('project_id', projectId)
    .eq('stage_number', 1)

  if (stageError) throw new Error(`approveCharter stage flip: ${stageError.message}`)
}

export async function listProjects(): Promise<CbccProject[]> {
  const db = getSupabaseAdminClient()
  const { data: rows, error } = await db
    .from('cbcc_projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listProjects: ${error.message}`)
  return (rows as Record<string, unknown>[]).map(toProject)
}
