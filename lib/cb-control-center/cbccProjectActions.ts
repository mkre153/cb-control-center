'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generateProjectCharter } from './cbccCharterGenerator'
import { getAnthropicClient } from './anthropicClient'
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

export type PrefillFields = {
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

export type PrefillResult =
  | { ok: false; code: string; message: string }
  | { ok: true; fields: PrefillFields }

export async function prefillFromUrlAction(_prevState: PrefillResult | null, formData: FormData): Promise<PrefillResult> {
  const raw = (formData.get('url') as string | null)?.trim()
  if (!raw) return { ok: false, code: 'missing_url', message: 'URL is required' }

  let url: string
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`).toString()
  } catch {
    return { ok: false, code: 'invalid_url', message: 'Enter a valid URL (e.g. https://example.com)' }
  }

  let pageText: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CBControlCenter/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })
    const html = await res.text()
    pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
  } catch (err) {
    return { ok: false, code: 'fetch_error', message: `Could not fetch URL: ${err instanceof Error ? err.message : 'network error'}` }
  }

  const client = getAnthropicClient()
  let raw_json: string
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You extract project intake information from website text. Return ONLY valid JSON with exactly these keys:
name, businessType, primaryGoal, targetCustomer, knownConstraints, forbiddenClaims, sourceUrlsNotes, desiredOutputType, approvalOwner.
All values must be plain strings. approvalOwner and forbiddenClaims may be empty strings if not determinable.
sourceUrlsNotes must include the source URL. desiredOutputType should describe what kind of digital product this is.`,
      messages: [{
        role: 'user',
        content: `Extract project intake fields from this website content.\nURL: ${url}\n\nContent:\n${pageText}`,
      }],
    })
    raw_json = (msg.content[0] as { type: string; text: string }).text.trim()
    const match = raw_json.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no JSON object found')
    raw_json = match[0]
  } catch (err) {
    return { ok: false, code: 'api_error', message: `AI extraction failed: ${err instanceof Error ? err.message : 'unknown error'}` }
  }

  try {
    const parsed = JSON.parse(raw_json) as Record<string, unknown>
    const fields: PrefillFields = {
      name:              String(parsed.name             ?? ''),
      businessType:      String(parsed.businessType     ?? ''),
      primaryGoal:       String(parsed.primaryGoal      ?? ''),
      targetCustomer:    String(parsed.targetCustomer   ?? ''),
      knownConstraints:  String(parsed.knownConstraints ?? ''),
      forbiddenClaims:   String(parsed.forbiddenClaims  ?? ''),
      sourceUrlsNotes:   String(parsed.sourceUrlsNotes  ?? url),
      desiredOutputType: String(parsed.desiredOutputType ?? ''),
      approvalOwner:     String(parsed.approvalOwner    ?? ''),
    }
    return { ok: true, fields }
  } catch {
    return { ok: false, code: 'parse_error', message: 'Could not parse AI response — try filling the form manually' }
  }
}

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

  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug')) {
      return { ok: false, code: 'slug_conflict', message: 'A project with this name already exists. Choose a different name.' }
    }
    return { ok: false, code: 'db_error', message: 'Failed to create project. Please try again.' }
  }

  const redirectBase = (formData.get('redirectBase') as string | null)?.trim()
  redirect(redirectBase ? `${redirectBase}?project=${slug}` : `/projects/${slug}`)
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

  try {
    await saveCharter(project.id, result.charter)
  } catch (err) {
    return { ok: false, code: 'db_error', message: `Failed to save charter: ${err instanceof Error ? err.message : 'unknown error'}` }
  }
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

  try {
    await approveCharter(project.id, approvedBy)
  } catch (err) {
    return { ok: false, code: 'db_error', message: `Failed to approve charter: ${err instanceof Error ? err.message : 'unknown error'}` }
  }
  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/charter`)
  return { ok: true }
}
