import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../../supabase/migrations/20260501010000_cbcc_projects.sql'
)

describe('CBCC v2 migration — 20260501010000_cbcc_projects', () => {
  let sql: string

  it('migration file exists at the expected path', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
  })

  it('contains CREATE TABLE cbcc_projects', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('cbcc_projects')
  })

  it('contains CREATE TABLE cbcc_project_stages', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('cbcc_project_stages')
  })

  it('charter_approved defaults to false', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('charter_approved')
    expect(sql).toContain('DEFAULT false')
  })

  it('charter_version and charter_hash columns are present', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('charter_version')
    expect(sql).toContain('charter_hash')
  })

  it('approval consistency CHECK constraint is present', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('charter_approval_consistency')
    expect(sql).toContain('CONSTRAINT')
  })

  it('does not rely on a DB seed trigger (stages are seeded in app code)', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).not.toContain('cbcc_seed_project_stages')
  })

  it('project_status CHECK includes all required values', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('step_0_draft')
    expect(sql).toContain('step_0_charter_ready')
    expect(sql).toContain('step_0_approved')
    expect(sql).toContain('in_progress')
    expect(sql).toContain('completed')
    expect(sql).toContain('archived')
  })

  it('approval_owner column is present', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('approval_owner')
  })

  it('cbcc_project_stages has ON DELETE CASCADE', () => {
    if (!sql) sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
    expect(sql).toContain('ON DELETE CASCADE')
  })
})
