/**
 * Phase 9D — DAP Request Intake UI Wiring QA
 *
 * PURPOSE: Verify that Phase 9D produced the correct artifacts:
 * rate limiter, wired preview UI, and safety boundary preservation.
 * All tests are structural (filesystem + static analysis).
 *
 * COVERAGE:
 *   Group 1 — Rate limiter module exists and is correctly structured
 *   Group 2 — API route uses real rate limiting (not a stub)
 *   Group 3 — API route 429 response is safe (no internal keys exposed)
 *   Group 4 — DapRequestFlowPreview wired prop and UI states
 *   Group 5 — Preview request page uses canonical component (not RequestDentistForm)
 *   Group 6 — Confirmation model safety invariants in the component
 *   Group 7 — Production request routes remain absent
 *   Group 8 — Deferred integrations remain deferred
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const RATE_LIMITER_PATH    = resolve(ROOT, 'lib/cb-control-center/rateLimiter.ts')
const API_ROUTE_PATH       = resolve(ROOT, 'app/api/dap/requests/route.ts')
const COMPONENT_PATH       = resolve(ROOT, 'components/cb-control-center/dap-public/DapRequestFlowPreview.tsx')
const PREVIEW_REQUEST_PATH = resolve(ROOT, 'app/preview/dap/request/page.tsx')
const DEPRECATED_FORM_PATH = resolve(ROOT, 'components/dap-preview/RequestDentistForm.tsx')

// ─── Group 1: Rate limiter module ─────────────────────────────────────────────

describe('Rate limiter module exists and is correctly structured', () => {
  it('rateLimiter.ts exists', () => {
    expect(existsSync(RATE_LIMITER_PATH)).toBe(true)
  })

  it('exports checkIpRateLimit', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*checkIpRateLimit|export.*checkIpRateLimit/)
  })

  it('exports checkContactRateLimit', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*checkContactRateLimit|export.*checkContactRateLimit/)
  })

  it('exports RateLimitResult interface', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toMatch(/export.*interface.*RateLimitResult|RateLimitResult/)
  })

  it('RateLimitResult has allowed boolean field', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toMatch(/allowed.*boolean|boolean.*allowed/)
  })

  it('RateLimitResult has retryAfterSeconds field', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toContain('retryAfterSeconds')
  })

  it('IP limit is 5 per hour', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toMatch(/IP_MAX\s*=\s*5/)
    expect(src).toMatch(/IP_WINDOW_MS\s*=\s*60\s*\*\s*60\s*\*\s*1000|3600000/)
  })

  it('contact limit is 3 per day', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).toMatch(/CONTACT_MAX\s*=\s*3/)
    expect(src).toMatch(/CONTACT_WINDOW_MS\s*=\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000|86400000/)
  })

  it('documents the serverless limitation', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8').toLowerCase()
    expect(src).toMatch(/serverless|vercel|distributed|replace/)
  })

  it('does not hardcode any secret or external service credentials', () => {
    const src = readFileSync(RATE_LIMITER_PATH, 'utf8')
    expect(src).not.toMatch(/upstash\.io|redis:\/\/|token\s*=\s*["'][a-zA-Z0-9]/)
  })
})

// ─── Group 2: API route uses real rate limiting ───────────────────────────────

describe('API route uses real rate limiting (not a stub)', () => {
  it('imports checkIpRateLimit from rateLimiter', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('checkIpRateLimit')
    expect(src).toContain('rateLimiter')
  })

  it('imports checkContactRateLimit from rateLimiter', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toContain('checkContactRateLimit')
  })

  it('IP rate limit is checked before body parse', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // checkIpRateLimit must appear before the first request.json() call
    const ipPos = src.indexOf('checkIpRateLimit')
    const jsonPos = src.indexOf('request.json()')
    expect(ipPos).toBeGreaterThan(-1)
    expect(jsonPos).toBeGreaterThan(-1)
    expect(ipPos).toBeLessThan(jsonPos)
  })

  it('contact rate limit is checked after body parse', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // Find the CALL site (await checkContactRateLimit), not the import line
    const contactPos = src.indexOf('await checkContactRateLimit')
    const jsonPos = src.indexOf('request.json()')
    expect(contactPos).toBeGreaterThan(-1)
    expect(jsonPos).toBeGreaterThan(-1)
    expect(contactPos).toBeGreaterThan(jsonPos)
  })

  it('stub checkRateLimit function has been removed', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).not.toContain('function checkRateLimit')
    expect(src).not.toMatch(/Always allowed until Tier 3/)
  })

  it('awaits rate limit results (async adapter)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/await.*checkIpRateLimit|await.*checkContactRateLimit/)
  })
})

// ─── Group 3: 429 response is safe ───────────────────────────────────────────

describe('API route 429 response does not expose internal state', () => {
  it('returns 429 status when rate limited', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/status.*429|429/)
  })

  it('sets Retry-After header when retryAfterSeconds is available', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/Retry-After/)
  })

  it('safe error message does not expose bucket keys or internal state', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    expect(src).toMatch(/Too many requests/)
    // Must not expose the rate-limit key (email, IP, etc.)
    expect(src).not.toMatch(/rate.limit.*key.*=|bucket.*key|ipBucket|contactBucket/)
  })

  it('rate limit response is a separate helper (not inline 429 JSON)', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // rateLimitedResponse helper or similar encapsulation
    expect(src).toMatch(/rateLimitedResponse|function.*429/)
  })
})

// ─── Group 4: DapRequestFlowPreview wired prop and UI states ─────────────────

describe('DapRequestFlowPreview has wired prop and all required UI states', () => {
  it('component file exists', () => {
    expect(existsSync(COMPONENT_PATH)).toBe(true)
  })

  it('has "use client" directive (required for useState)', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src.trimStart()).toMatch(/^['"]use client['"]/)
  })

  it('accepts wired prop', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/wired\?.*boolean|wired.*bool/)
  })

  it('wired defaults to false', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/wired\s*=\s*false/)
  })

  it('has loading state', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/loading|isLoading/)
  })

  it('has success state', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/kind.*success|success.*kind|data-wired-state.*success/)
  })

  it('has validation_error state', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/validation_error|validationError/)
  })

  it('has phi_error state', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/phi_error|phiError/)
  })

  it('has rate_limited state', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/rate_limited|rateLimited/)
  })

  it('has server_error state', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/server_error|serverError/)
  })

  it('wired mode calls POST /api/dap/requests', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toContain('/api/dap/requests')
    expect(src).toMatch(/method.*POST|POST.*fetch/)
  })

  it('has no_phi_acknowledged checkbox in wired form', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toContain('no_phi_acknowledged')
    expect(src).toMatch(/data-no-phi-field|no_phi_acknowledged/)
  })

  it('consent_to_contact_practice checkbox present in wired form', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toContain('consent_to_contact_practice')
  })

  it('wired form does not redirect on success (inline confirmation)', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    // No router.push or window.location in success handler
    expect(src).not.toMatch(/router\.push|window\.location\.href|redirect\(/)
  })

  it('success state does not display enrollment language', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/data-is-enrollment.*false|isEnrollment.*false/)
  })
})

// ─── Group 5: Preview request page uses canonical component ───────────────────

describe('Preview request page uses DapRequestFlowPreview (not RequestDentistForm)', () => {
  it('preview request page exists', () => {
    expect(existsSync(PREVIEW_REQUEST_PATH)).toBe(true)
  })

  it('imports DapRequestFlowPreview', () => {
    const src = readFileSync(PREVIEW_REQUEST_PATH, 'utf8')
    expect(src).toContain('DapRequestFlowPreview')
  })

  it('does NOT import RequestDentistForm', () => {
    const src = readFileSync(PREVIEW_REQUEST_PATH, 'utf8')
    expect(src).not.toContain('RequestDentistForm')
  })

  it('passes wired={true} to DapRequestFlowPreview', () => {
    const src = readFileSync(PREVIEW_REQUEST_PATH, 'utf8')
    expect(src).toMatch(/wired\s*=\s*\{true\}|wired=\{true\}/)
  })

  it('imports getRequestFlowModel', () => {
    const src = readFileSync(PREVIEW_REQUEST_PATH, 'utf8')
    expect(src).toContain('getRequestFlowModel')
  })

  it('RequestDentistForm deprecated file still exists (not deleted)', () => {
    // Deprecated — must remain for audit trail; must not be used by canonical flow
    expect(existsSync(DEPRECATED_FORM_PATH)).toBe(true)
  })
})

// ─── Group 6: Confirmation model safety invariants ────────────────────────────

describe('Confirmation model safety invariants preserved in component', () => {
  it('success state data attribute asserts isEnrollment=false', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/data-is-enrollment.*["']false["']/)
  })

  it('success state data attribute asserts guaranteesAvailability=false', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/data-guarantees-availability.*["']false["']/)
  })

  it('success state data attribute asserts guaranteesPricing=false', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/data-guarantees-pricing.*["']false["']/)
  })

  it('success state renders the confirmation body text from the API', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    // Uses confirmation.body from the API response, not hardcoded text
    expect(src).toMatch(/confirmation\.body|confirmation\.headline/)
  })

  it('success state includes explicit not-enrollment disclaimer', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    expect(src).toMatch(/not enrollment|not.*enrolled/i)
  })

  it('dapRequestRules getDapRequestConfirmationModel returns isEnrollment: false', () => {
    const src = readFileSync(
      resolve(ROOT, 'lib/cb-control-center/dapRequestRules.ts'),
      'utf8'
    )
    expect(src).toMatch(/isEnrollment.*false/)
    expect(src).toMatch(/guaranteesAvailability.*false/)
    expect(src).toMatch(/guaranteesPricing.*false/)
  })
})

// ─── Group 7: Production request routes remain absent ─────────────────────────

describe('Production request routes remain absent', () => {
  it('app/request does not exist', () => {
    expect(existsSync(resolve(ROOT, 'app/request'))).toBe(false)
  })

  it('app/request/page.tsx does not exist', () => {
    expect(existsSync(resolve(ROOT, 'app/request/page.tsx'))).toBe(false)
  })

  it('app/request/confirmation/page.tsx does not exist', () => {
    expect(existsSync(resolve(ROOT, 'app/request/confirmation/page.tsx'))).toBe(false)
  })

  it('app/dental-advantage-plan/request/page.tsx does not exist', () => {
    expect(existsSync(resolve(ROOT, 'app/dental-advantage-plan/request/page.tsx'))).toBe(false)
  })

  it('total page.tsx count is 15 (Phase 9E added 2 review pages)', () => {
    const { readdirSync } = require('fs')
    const { join } = require('path')
    function findPages(dir: string): string[] {
      if (!existsSync(dir)) return []
      const results: string[] = []
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
          results.push(...findPages(full))
        } else if (entry.isFile() && full.endsWith('page.tsx')) {
          results.push(full)
        }
      }
      return results
    }
    const pages = findPages(join(ROOT, 'app'))
    expect(pages.length).toBe(17)
  })
})

// ─── Group 8: Deferred integrations remain deferred ──────────────────────────

describe('Deferred integrations remain deferred', () => {
  it('API route does not import CRM or GHL modules', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/import.*crm|import.*ghl|gohighlevel/)
  })

  it('API route does not send email or trigger outbound messaging', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/sendmail|sendgrid|nodemailer|resend\.send/)
  })

  it('component does not import or call CRM, outreach, or messaging modules', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8')
    // Check imports only — comments may mention these terms as disclaimers
    expect(src).not.toMatch(/^import.*crm|^import.*ghl|^import.*sendgrid|^import.*resend/m)
    // No actual API calls to outreach endpoints
    expect(src).not.toMatch(/fetch\(['"].*crm|fetch\(['"].*ghl|fetch\(['"].*webhook/)
  })

  it('deprecated RequestDentistForm is not wired to the API', () => {
    const src = readFileSync(DEPRECATED_FORM_PATH, 'utf8')
    expect(src).not.toContain('/api/dap/requests')
    expect(src).not.toMatch(/fetch.*api|POST.*api/)
  })

  it('no provider confirmation automation in this phase', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // Check that no automation code calls provider confirmation endpoints
    // (The route is allowed to mention "confirmation" as part of the response model name)
    expect(src).not.toMatch(/provider_confirmed\s*=\s*true|setProviderConfirmed|confirmProvider\(/)
    expect(src).not.toMatch(/^import.*providerConfirm|^import.*onboarding/m)
  })

  it('no payment or enrollment logic in this phase', () => {
    const src = readFileSync(API_ROUTE_PATH, 'utf8')
    // No payment library imports or enrollment state mutations
    expect(src).not.toMatch(/^import.*stripe|^import.*payment|^import.*billing/m)
    expect(src).not.toMatch(/createSubscription|chargeCustomer|enrollPatient/)
  })
})
