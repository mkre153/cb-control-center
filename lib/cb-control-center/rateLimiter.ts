/**
 * DAP request rate limiter — in-memory adapter.
 *
 * Interface is async (Promise-returning) so the backing store can be swapped
 * to Upstash Redis or similar without touching the API route.
 *
 * ⚠ LIMITATION: In-memory buckets are not shared across Vercel serverless
 * function instances. This is acceptable for the preview surface and development.
 * Must be replaced with a distributed store before the production /request
 * page goes live.
 *
 * Limits:
 *   IP      — 5 requests per hour
 *   Contact — 3 requests per day (keyed on normalized email or phone)
 */

// ─── Limits ───────────────────────────────────────────────────────────────────

const IP_MAX = 5
const IP_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const CONTACT_MAX = 3
const CONTACT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number | null
}

interface Bucket {
  count: number
  resetAt: number
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const ipBuckets = new Map<string, Bucket>()
const contactBuckets = new Map<string, Bucket>()

function checkBucket(
  buckets: Map<string, Bucket>,
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: null }
  }

  if (bucket.count >= max) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  bucket.count += 1
  return { allowed: true, retryAfterSeconds: null }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  return checkBucket(ipBuckets, ip, IP_MAX, IP_WINDOW_MS)
}

// contact is a normalized email address or digits-only phone number
export async function checkContactRateLimit(contact: string): Promise<RateLimitResult> {
  return checkBucket(contactBuckets, contact, CONTACT_MAX, CONTACT_WINDOW_MS)
}
