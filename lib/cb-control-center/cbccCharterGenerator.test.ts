import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const GENERATOR_PATH = path.resolve(__dirname, './cbccCharterGenerator.ts')

describe('cbccCharterGenerator — structural tests', () => {
  let source: string

  beforeAll(() => {
    source = fs.readFileSync(GENERATOR_PATH, 'utf-8')
  })

  it('exports generateProjectCharter', () => {
    expect(source).toContain('export async function generateProjectCharter')
  })

  it('exports CharterGenerationResult type', () => {
    expect(source).toContain('CharterGenerationResult')
  })

  it('uses claude-opus-4-7 model', () => {
    expect(source).toContain("'claude-opus-4-7'")
  })

  it('sets max_tokens to 4096', () => {
    expect(source).toContain('max_tokens: 4096')
  })

  it('system prompt contains CRITICAL RULES section', () => {
    expect(source).toContain('CRITICAL RULES')
  })

  it('system prompt states charter does NOT approve claims', () => {
    expect(source).toContain('does NOT approve')
    expect(source).toContain('Claims or marketing statements')
  })

  it('validates presetStages length equals 7', () => {
    expect(source).toContain('presetStages.length !== 7')
  })

  it('return shape includes ok:true with charter', () => {
    expect(source).toContain('ok: true')
    expect(source).toContain('charter')
  })

  it('return shape includes error codes: parse_error, api_error, invalid_shape', () => {
    expect(source).toContain("'parse_error'")
    expect(source).toContain("'api_error'")
    expect(source).toContain("'invalid_shape'")
  })

  it('does NOT import supabase', () => {
    expect(source).not.toContain('supabase')
    expect(source).not.toContain('supabaseClient')
  })

  it('reuses getAnthropicClient from anthropicClient', () => {
    expect(source).toContain("from './anthropicClient'")
    expect(source).toContain('getAnthropicClient')
  })

  it('includes CBCC_STAGE_DEFINITIONS in user prompt', () => {
    expect(source).toContain('CBCC_STAGE_DEFINITIONS')
    expect(source).toContain("from './cbccStageDefinitions'")
  })

  it('validates all 8 required charter fields', () => {
    const requiredFields = [
      'whatThisIs',
      'whatThisIsNot',
      'whoItServes',
      'allowedClaims',
      'forbiddenClaims',
      'requiredEvidence',
      'approvalAuthority',
      'presetStages',
    ]
    for (const field of requiredFields) {
      expect(source).toContain(field)
    }
  })
})
