'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generateProjectCharter } from './cbccCharterGenerator'
import {
  createProject,
  getProjectBySlug,
  saveCharter,
  approveCharter,
} from './cbccProjectRepository'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

export async function createProjectAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { ok: false, code: 'missing_field', message: 'Project name is required' }

  const requiredFields = [
    'businessType',
    'primaryGoal',
    'targetCustomer',
    'knownConstraints',
    'forbiddenClaims',
    'sourceUrlsNotes',
    'desiredOutputType',
    'approvalOwner',
  ] as const

  for (const field of requiredFields) {
    const value = (formData.get(field) as string | null)?.trim()
    if (!value) {
      return { ok: false, code: 'missing_field', message: `Field "${field}" is required` }
    }
  }

  const slug = slugify(name)

  await createProject({
    name,
    slug,
    businessType: (formData.get('businessType') as string).trim(),
    primaryGoal: (formData.get('primaryGoal') as string).trim(),
    targetCustomer: (formData.get('targetCustomer') as string).trim(),
    knownConstraints: (formData.get('knownConstraints') as string).trim(),
    forbiddenClaims: (formData.get('forbiddenClaims') as string).trim(),
    sourceUrlsNotes: (formData.get('sourceUrlsNotes') as string).trim(),
    desiredOutputType: (formData.get('desiredOutputType') as string).trim(),
    approvalOwner: (formData.get('approvalOwner') as string).trim(),
  })

  redirect(`/projects/${slug}`)
}

export async function generateCharterAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const slug = (formData.get('slug') as string | null)?.trim()
  if (!slug) return { ok: false, code: 'missing_field', message: 'Project slug is required' }

  const project = await getProjectBySlug(slug)
  if (!project) return { ok: false, code: 'not_found', message: `Project "${slug}" not found` }

  const result = await generateProjectCharter({
    name: project.name,
    businessType: project.businessType ?? '',
    primaryGoal: project.primaryGoal ?? '',
    targetCustomer: project.targetCustomer ?? '',
    knownConstraints: project.knownConstraints ?? '',
    forbiddenClaims: project.forbiddenClaims ?? '',
    sourceUrlsNotes: project.sourceUrlsNotes ?? '',
    desiredOutputType: project.desiredOutputType ?? '',
    approvalOwner: project.approvalOwner ?? '',
  })

  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message }
  }

  await saveCharter(project.id, result.charter)
  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/charter`)
  return { ok: true }
}

export async function approveCharterAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const slug = (formData.get('slug') as string | null)?.trim()
  const approvedBy = (formData.get('approvedBy') as string | null)?.trim()

  if (!slug) return { ok: false, code: 'missing_field', message: 'Project slug is required' }
  if (!approvedBy) return { ok: false, code: 'missing_field', message: 'approvedBy is required' }

  const project = await getProjectBySlug(slug)
  if (!project) return { ok: false, code: 'not_found', message: `Project "${slug}" not found` }

  if (!project.charterJson) {
    return {
      ok: false,
      code: 'no_charter',
      message: 'Cannot approve — no charter has been generated yet',
    }
  }

  await approveCharter(project.id, approvedBy)
  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/charter`)
  return { ok: true }
}
