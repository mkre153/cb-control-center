import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ACTIONS_PATH = path.resolve(__dirname, './cbccProjectActions.ts')
const REPO_PATH = path.resolve(__dirname, './cbccProjectRepository.ts')

describe('cbccProjectActions — structural tests', () => {
  let source: string

  it('actions file exists', () => {
    expect(fs.existsSync(ACTIONS_PATH)).toBe(true)
    source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
  })

  it('has "use server" directive', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source.trimStart()).toMatch(/^['"]use server['"]/)
  })

  it('exports createProjectAction', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source).toContain('export async function createProjectAction')
  })

  it('exports generateCharterAction', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source).toContain('export async function generateCharterAction')
  })

  it('exports approveCharterAction', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source).toContain('export async function approveCharterAction')
  })

  it('approveCharterAction guards against null charter_json', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source).toContain('charterJson')
    expect(source).toContain('no_charter')
  })

  it('createProjectAction validates required fields', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source).toContain('missing_field')
  })

  it('does NOT export approveStageAction (deferred)', () => {
    if (!source) source = fs.readFileSync(ACTIONS_PATH, 'utf-8')
    expect(source).not.toContain('approveStageAction')
  })
})

describe('cbccProjectRepository — structural tests', () => {
  let source: string

  it('repository file exists', () => {
    expect(fs.existsSync(REPO_PATH)).toBe(true)
    source = fs.readFileSync(REPO_PATH, 'utf-8')
  })

  it('exports createProject', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('export async function createProject')
  })

  it('exports getProjectBySlug', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('export async function getProjectBySlug')
  })

  it('exports getProjectStages', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('export async function getProjectStages')
  })

  it('exports saveCharter', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('export async function saveCharter')
  })

  it('exports approveCharter', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('export async function approveCharter')
  })

  it('exports listProjects', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('export async function listProjects')
  })

  it('approveCharter guards against null charter_json', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('charter_json is null')
  })

  it('approveCharter computes charter_hash with sha256', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('sha256')
    expect(source).toContain('charter_hash')
  })

  it('approveCharter flips Stage 1 to available', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain("stage_status: 'available'")
    expect(source).toContain(".eq('stage_number', 1)")
  })

  it('uses getSupabaseAdminClient', () => {
    if (!source) source = fs.readFileSync(REPO_PATH, 'utf-8')
    expect(source).toContain('getSupabaseAdminClient')
    expect(source).toContain("from './supabaseClient'")
  })
})
