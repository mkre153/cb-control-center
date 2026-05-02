import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import {
  validateDapRequestInput,
  normalizeDapRequestInput,
  buildDapRequestDedupeKey,
  canSubmitDapRequest,
  getDapRequestConfirmationModel,
} from '@/lib/cb-control-center/dapRequestRules'
import {
  createDapRequest,
  createDapRequestEvent,
  findDuplicateDapRequest,
  sanitizeDapRequestForConfirmation,
} from '@/lib/cb-control-center/dapRequestPersistence'
import type { DapRequestInput } from '@/lib/dap/registry/dapRequestTypes'
import { DAP_REQUEST_SCOPE } from '@/lib/dap/registry/dapRequestTypes'
import { checkIpRateLimit, checkContactRateLimit } from '@/lib/cb-control-center/rateLimiter'

// ─── POST /api/dap/requests ───────────────────────────────────────────────────
// Creates a DAP request record with consent. This is NOT enrollment.
// - IP rate limited: 5 requests per hour
// - Contact rate limited: 3 requests per day (email or phone)
// - Validates input via validateDapRequestInput
// - Enforces consent gate via canSubmitDapRequest
// - Deduplicates against active requests
// - Persists request + two bootstrap events (request_created, consent_captured)
// - Returns a confirmation that explicitly states this is not enrollment
//
// NOT wired to: CRM, MKCRM, notifications, outbound messaging, provider referral, payment.

export async function POST(request: NextRequest): Promise<Response> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // ── IP rate limit (before body parse) ────────────────────────────────────
  const ipResult = await checkIpRateLimit(ip)
  if (!ipResult.allowed) {
    return rateLimitedResponse(ipResult.retryAfterSeconds)
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return Response.json({ error: 'Request body must be a JSON object' }, { status: 400 })
  }

  // ── Contact rate limit (after body parse) ─────────────────────────────────
  // Normalize minimally — just enough for a stable rate-limit key.
  const rawBody = raw as Record<string, unknown>
  const rawEmail =
    typeof rawBody.requester_email === 'string'
      ? rawBody.requester_email.trim().toLowerCase()
      : null
  const rawPhone =
    typeof rawBody.requester_phone === 'string'
      ? rawBody.requester_phone.replace(/\D/g, '')
      : null
  const contactKey = rawEmail || rawPhone
  if (contactKey) {
    const contactResult = await checkContactRateLimit(contactKey)
    if (!contactResult.allowed) {
      return rateLimitedResponse(contactResult.retryAfterSeconds)
    }
  }

  // ── Merge server-side scope constants (scoping is never user-supplied) ────
  const input: DapRequestInput = {
    ...(raw as Omit<DapRequestInput, 'client_key' | 'vertical_key' | 'project_key'>),
    ...DAP_REQUEST_SCOPE,
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const validation = validateDapRequestInput(input)
  if (!validation.valid) {
    return Response.json(
      { error: 'Validation failed', issues: validation.issues },
      { status: 422 },
    )
  }

  // ── Consent gate ──────────────────────────────────────────────────────────
  if (!canSubmitDapRequest(input)) {
    return Response.json(
      { error: 'Request cannot be submitted: missing required consent' },
      { status: 422 },
    )
  }

  // ── Normalize ─────────────────────────────────────────────────────────────
  const normalized = normalizeDapRequestInput(input)

  // ── Deduplicate ───────────────────────────────────────────────────────────
  const dedupeKey = buildDapRequestDedupeKey(normalized)
  const existing = await findDuplicateDapRequest(dedupeKey)
  if (existing) {
    const sanitized = sanitizeDapRequestForConfirmation(existing)
    const confirmation = getDapRequestConfirmationModel(existing)
    return Response.json(
      { requestId: sanitized.id, status: 'duplicate', isEnrollment: false, confirmation },
      { status: 200 },
    )
  }

  // ── Hash IP and user-agent before persistence (no plain PII stored) ───────
  const ua = request.headers.get('user-agent') ?? null
  const ip_hash = ip !== 'unknown' ? hashValue(ip) : null
  const user_agent_hash = ua ? hashValue(ua) : null

  // ── Persist request ───────────────────────────────────────────────────────
  const dapRequest = await createDapRequest(normalized, { ip_hash, user_agent_hash })

  // ── Append bootstrap events ───────────────────────────────────────────────
  await createDapRequestEvent({
    request_id: dapRequest.id,
    event_type: 'request_created',
    actor_type: 'patient',
    event_note: null,
    metadata_json: null,
  })

  await createDapRequestEvent({
    request_id: dapRequest.id,
    event_type: 'consent_captured',
    actor_type: 'patient',
    event_note: null,
    metadata_json: {
      consent_text: normalized.consent_text,
      consent_timestamp: dapRequest.consent_timestamp,
    },
  })

  // ── Return safe confirmation ──────────────────────────────────────────────
  const confirmation = getDapRequestConfirmationModel(dapRequest)
  const sanitized = sanitizeDapRequestForConfirmation(dapRequest)

  return Response.json(
    { requestId: sanitized.id, status: 'submitted', isEnrollment: false, confirmation },
    { status: 201 },
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rateLimitedResponse(retryAfterSeconds: number | null): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (retryAfterSeconds !== null) {
    headers['Retry-After'] = String(retryAfterSeconds)
  }
  // Safe message — does not expose internal rate-limit keys or bucket state
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers },
  )
}

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
