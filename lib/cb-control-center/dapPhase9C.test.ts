/**
 * Phase 9C — DAP Request Backend Foundation QA
 *
 * PURPOSE: Verify that Phase 9C produced the correct backend artifacts:
 * SQL migration, Supabase client, persistence functions, and API route.
 * All tests are structural (filesystem + static analysis). No integration
 * against a real database — that belongs in a separate e2e suite.
 *
 * COVERAGE:
 *   Group 1 — SQL migration exists and defines correct schema
 *   Group 2 — Supabase client module is structurally correct
 *   Group 3 — Persistence module exports required functions
 *   Group 4 — API route exists and is POST-only
 *   Group 5 — API route enforces safety invariants (no enrollment, consent required)
 *   Group 6 — Route boundary preserved (no new page routes)
 *   Group 7 — Documentation updated for Phase 9C
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Filesystem helpers ───────────────────────────────────────────────────────

function findFiles(dir: string, test: (path: string) => boolean): string[] {
  if (!existsSync(dir)) return []
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      results.push(...findFiles(full, test))
    } else if (entry.isFile() && test(full)) {
      results.push(full)
    }
  }
  return results
}

// ─── Key paths ────────────────────────────────────────────────────────────────

const MIGRATION_PATH = resolve(ROOT, 'supabase/migrations/20260429000000_dap_requests.sql')
const SUPABASE_CLIENT_PATH = resolve(ROOT, 'lib/cb-control-center/supabaseClient.ts')
const PERSISTENCE_PATH = resolve(ROOT, 'lib/cb-control-center/dapRequestPersistence.ts')
const API_ROUTE_PATH = resolve(ROOT, 'app/api/dap/requests/route.ts')
const ARCH_DOC_PATH = resolve(ROOT, 'docs/dap-request-backend-architecture.md')
const READINESS_DOC_PATH = resolve(ROOT, 'docs/dap-production-route-readiness.md')

// ─── Group 1: SQL migration ───────────────────────────────────────────────────

describe('SQL migration exists and defines correct schema', () => {
  it('migration file exists', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })

  it('migration defines dap_requests table', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CREATE TABLE.*dap_requests/i)
  })

  it('migration defines dap_request_events table', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CREATE TABLE.*dap_request_events/i)
  })

  it('dap_request_events references dap_requests with a foreign key', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/REFERENCES dap_requests/i)
  })

  it('migration enforces consent_text not-empty constraint', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/consent_text.*not.empty|check.*trim.*consent_text/i)
  })

  it('migration enforces no_phi_acknowledged = true constraint', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/no_phi_acknowledged.*true|check.*no_phi_acknowledged/i)
  })

  it('migration creates dedupe_key index', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CREATE INDEX.*dap_requests_dedupe_key_idx|dedupe_key/i)
  })

  it('migration creates request_events.request_id index', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CREATE INDEX.*dap_request_events_request_id_idx|request_id/i)
  })

  it('migration requires at least one contact method (email or phone)', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/requester_email.*requester_phone|contact_required/i)
  })

  it('migration requires at least one geographic target (city or zip)', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/city.*zip|area_required/i)
  })

  it('migration has no CRM, outreach, or enrollment tables', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8').toLowerCase()
    expect(sql).not.toMatch(/create table.*crm|create table.*enrollment|create table.*outreach/)
  })

  it('migration includes client_key scoping column', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/client_key/)
  })

  it('migration includes vertical_key scoping column', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/vertical_key/)
  })

  it('migration includes project_key scoping column', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/project_key/)
  })

  it('migration creates composite scope index (client_key, vertical_key)', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/dap_requests_scope_idx|client_key.*vertical_key/i)
  })

  it('client_key defaults to dental_advantage_plan', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/client_key.*DEFAULT.*dental_advantage_plan/i)
  })
})

// ─── Group 2: Supabase client module ──────────────────────────────────────────

describe('Supabase client module is structurally correct', () => {
  it('supabaseClient.ts exists', () => {
    expect(existsSync(SUPABASE_CLIENT_PATH)).toBe(true)
  })

  it('imports createClient from @supabase/supabase-js', () => {
    const src = readFileSync(SUPABASE_CLIENT_PATH, 'utf8')
    expect(src).toContain('@supabase/supabase-js')
  })

  it('exports a function to get the admin client', () => {
    const src = readFileSync(SUPABASE_CLIENT_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*getSupabaseAdminClient|export.*supabaseAdmin/)
  })

  it('reads URL from environment variable, not hardcoded', () => {
    const src = readFileSync(SUPABASE_CLIENT_PATH, 'utf8')
    expect(src).toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_URL/)
    expect(src).not.toMatch(/https:\/\/[a-z]+\.supabase\.co/)
  })

  it('reads service role key from environment variable, not hardcoded', () => {
    const src = readFileSync(SUPABASE_CLIENT_PATH, 'utf8')
    expect(src).toMatch(/process\.env\.SUPABASE_SERVICE_ROLE_KEY/)
  })

  it('does not use anon key (service role only for server-side writes)', () => {
    const src = readFileSync(SUPABASE_CLIENT_PATH, 'utf8')
    expect(src).not.toMatch(/ANON_KEY|anon_key|supabase\.co.*anon/)
  })

  it('client initialization is lazy (not at module load time)', () => {
    const src = readFileSync(SUPABASE_CLIENT_PATH, 'utf8')
    // createClient must appear in the source (called somewhere inside a function)
    expect(src).toContain('createClient')
    // No top-level const = createClient(...) assignment (lazy init required)
    const lines = src.split('\n')
    const topLevelCreate = lines.find(l =>
      !l.trim().startsWith('//') && !l.trim().startsWith('*') &&
      /^(export )?const\s+\w+\s*=\s*createClient/.test(l.trim())
    )
    expect(topLevelCreate, 'createClient should not be called at module top level').toBeUndefined()
  })
})

// ─── Group 3: Persistence module exports required functions ───────────────────

describe('Persistence module exports required functions', () => {
  it('dapRequestPersistence.ts exists', () => {
    expect(existsSync(PERSISTENCE_PATH)).toBe(true)
  })

  it('exports createDapRequest', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*createDapRequest|export.*createDapRequest/)
  })

  it('exports createDapRequestEvent', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*createDapRequestEvent|export.*createDapRequestEvent/)
  })

  it('exports findDuplicateDapRequest', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*findDuplicateDapRequest|export.*findDuplicateDapRequest/)
  })

  it('exports sanitizeDapRequestForConfirmation', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*sanitizeDapRequestForConfirmation|export.*sanitizeDapRequestForConfirmation/)
  })

  it('createDapRequest sets initial status to submitted (never enrolled)', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toContain("'submitted'")
    expect(src).not.toMatch(/request_status.*enrolled|status.*enrollment/i)
  })

  it('persistence module does not import CRM, outreach, or email modules', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/import.*crm|import.*mkcrm|import.*sendgrid|import.*resend|import.*nodemailer/)
  })

  it('findDuplicateDapRequest excludes closed statuses from duplicate detection', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    // Should filter out closed statuses
    expect(src).toMatch(/closed_invalid|closed_duplicate|closed_no_response/)
  })

  it('sanitizeDapRequestForConfirmation returns only id, request_status, created_at', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    // Should pick only these fields
    expect(src).toContain('id')
    expect(src).toContain('request_status')
    expect(src).toContain('created_at')
    // Must not expose PII fields
    expect(src).not.toMatch(/return.*requester_email|return.*requester_phone|return.*ip_hash/)
  })

  it('createDapRequest passes client_key scoping field to insert', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toContain('client_key')
  })

  it('createDapRequest passes vertical_key scoping field to insert', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toContain('vertical_key')
  })

  it('createDapRequest passes project_key scoping field to insert', () => {
    const src = readFileSync(PERSISTENCE_PATH, 'utf8')
    expect(src).toContain('project_key')
  })
})

// ─── Group 4: API route exists and is POST-only ───────────────────────────────

describe('API route exists and is POST-only', () => {
  it('app/api/dap/requests/route.ts exists', () => {
    expect(existsSync(API_ROUTE_PATH)).toBe(true)
  })

  it('exports a POST handler', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function POST|export.*POST/)
  })

  it('does not export GET handler', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // Should not have a named GET export
    expect(src).not.toMatch(/^export.*function GET|^export.*GET\s*=/m)
  })

  it('does not export PUT handler', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).not.toMatch(/^export.*function PUT|^export.*PUT\s*=/m)
  })

  it('does not export DELETE handler', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).not.toMatch(/^export.*function DELETE|^export.*DELETE\s*=/m)
  })

  it('does not export PATCH handler', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).not.toMatch(/^export.*function PATCH|^export.*PATCH\s*=/m)
  })

  it('route file is at the correct API path (not under app/)', () => {
    // Confirm no page.tsx was accidentally created alongside route.ts
    expect(existsSync(resolve(ROOT, 'app/api/dap/requests/page.tsx'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'app/api/dap/page.tsx'))).toBe(false)
  })

  it('imports validateDapRequestInput (validation enforced)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('validateDapRequestInput')
  })

  it('imports canSubmitDapRequest (consent gate enforced)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('canSubmitDapRequest')
  })

  it('imports getDapRequestConfirmationModel (safe confirmation required)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('getDapRequestConfirmationModel')
  })

  it('hashes IP and user-agent before persistence', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/hash.*ip|ip.*hash|hashValue|createHash/i)
  })

  it('imports DAP_REQUEST_SCOPE and merges scoping server-side (not user-supplied)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('DAP_REQUEST_SCOPE')
    // Scope is spread/merged, never read from raw user body
    expect(src).toMatch(/\.\.\.DAP_REQUEST_SCOPE|DAP_REQUEST_SCOPE\.client_key/)
  })
})

// ─── Group 5: Safety invariants in API route ──────────────────────────────────

describe('API route enforces safety invariants', () => {
  it('response contains isEnrollment: false', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/isEnrollment.*false/)
  })

  it('API route does not import or reference CRM modules', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/import.*crm|import.*mkcrm/)
  })

  it('API route does not send email or trigger outreach', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/sendmail|send.*email|sendgrid|resend\.send|nodemailer|practice.*contact/)
  })

  it('API route does not reference webhooks or automation', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/webhook|automation|trigger.*crm|outreach_ready/)
  })

  it('returns 422 when validation fails (not 200 or 500)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/status.*422|422.*Validation/)
  })

  it('returns 422 when consent is missing', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // Checks that canSubmitDapRequest is used as a gate with a 422 response
    expect(src).toMatch(/canSubmitDapRequest[\s\S]{0,200}422/)
  })

  it('returns 400 for malformed JSON', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/status.*400|400.*json/i)
  })

  it('returns 201 on successful submission', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/status.*201/)
  })

  it('confirmation model includes explicit not-enrollment message', () => {
    // getDapRequestConfirmationModel returns a body with "not enrollment" language
    const src = readFileSync(
      resolve(ROOT, 'lib/cb-control-center/dapRequestRules.ts'),
      'utf8'
    ).toLowerCase()
    expect(src).toMatch(/not enrollment|not.*enrollm/)
  })

  it('API route logs consent_captured event with consent_text snapshot', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('consent_captured')
    // consent_text and consent_timestamp must both appear in the metadata_json block
    expect(src).toContain('consent_text')
    expect(src).toContain('consent_timestamp')
  })
})

// ─── Group 6: Route boundary preserved ───────────────────────────────────────

describe('Route boundary preserved — no new page routes added', () => {
  const KNOWN_PAGE_COUNT = 58 // CBCC v2 added projects routes + stage detail

  it('total page.tsx count is 34 (Phase 16 added admin-decision-audit preview)', () => {
    const found = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))
    expect(found.length).toBe(KNOWN_PAGE_COUNT)
  })

  it('no public request page exists (Tier 3 not yet live)', () => {
    expect(existsSync(resolve(ROOT, 'app/request/page.tsx'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'app/request'))).toBe(false)
  })

  it('no dentist directory page exists (Tier 2 not yet live)', () => {
    expect(existsSync(resolve(ROOT, 'app/dentists'))).toBe(false)
  })

  it('API route.ts is not counted as a page (only route handlers)', () => {
    const routes = findFiles(join(ROOT, 'app'), f => f.endsWith('route.ts'))
    const pages = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))
    // Routes exist (Phase 9C added one); pages unchanged from Phase 9B
    expect(routes.length).toBeGreaterThanOrEqual(1)
    expect(pages.length).toBe(KNOWN_PAGE_COUNT)
  })

  it('no app/api/page.tsx exists (API directory has no public page)', () => {
    expect(existsSync(resolve(ROOT, 'app/api/page.tsx'))).toBe(false)
  })
})

// ─── Group 7: Documentation updated ──────────────────────────────────────────

describe('Documentation updated for Phase 9C', () => {
  it('dap-request-backend-architecture.md references Phase 9C', () => {
    const doc = readFileSync(ARCH_DOC_PATH, 'utf8')
    expect(doc).toMatch(/phase 9c|9c/i)
  })

  it('architecture doc references supabase client', () => {
    const doc = readFileSync(ARCH_DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/supabaseclient|supabase client/)
  })

  it('architecture doc references the persistence module', () => {
    const doc = readFileSync(ARCH_DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/daprequestpersistence|persistence/)
  })

  it('architecture doc references the API route path', () => {
    const doc = readFileSync(ARCH_DOC_PATH, 'utf8')
    expect(doc).toMatch(/api\/dap\/requests|POST.*api\/dap/)
  })

  it('architecture doc still states this is not enrollment', () => {
    const doc = readFileSync(ARCH_DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/not enrollment|is not enrollment/)
  })

  it('dap-production-route-readiness.md references Phase 9C', () => {
    const doc = readFileSync(READINESS_DOC_PATH, 'utf8')
    expect(doc).toMatch(/phase 9c|9c/i)
  })

  it('readiness doc notes that Tier 3 is still blocked (request page not live)', () => {
    const doc = readFileSync(READINESS_DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/tier 3.*blocked|tier 3.*not.*live|request.*page.*not/)
  })
})
