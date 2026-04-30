import { describe, it, expect } from 'vitest'
import {
  shouldShowJoinCta,
  shouldShowPricingClaims,
  isPublicOfferCard,
  shouldShowConfirmedBadge,
  getCtaLabel,
  getCtaHref,
  getStatusLabel,
  REQUEST_EXPECTATION_COPY,
  REQUEST_FLOW_ROUTE,
  DIRECTORY_ROUTE,
  HERO_HEADLINE,
  HERO_SUBHEAD,
  FORBIDDEN_HERO_PHRASES,
} from './dapDisplayRules'
import type { ProviderStatus } from './types'

const ALL_STATUSES: ProviderStatus[] = [
  'confirmed_dap_provider',
  'not_confirmed',
  'recruitment_requested',
  'pending_confirmation',
  'declined',
]

const UNCONFIRMED_STATUSES: ProviderStatus[] = [
  'not_confirmed',
  'recruitment_requested',
  'pending_confirmation',
  'declined',
]

// ─── shouldShowJoinCta ────────────────────────────────────────────────────────

describe('shouldShowJoinCta', () => {
  it('returns true only when confirmed + offer terms + CTA gate are all satisfied', () => {
    expect(shouldShowJoinCta('confirmed_dap_provider', true, true)).toBe(true)
  })

  it('returns false when confirmed but offer terms are not validated', () => {
    expect(shouldShowJoinCta('confirmed_dap_provider', false, true)).toBe(false)
  })

  it('returns false when confirmed + offer terms but CTA gate locked', () => {
    expect(shouldShowJoinCta('confirmed_dap_provider', true, false)).toBe(false)
  })

  it('returns false when confirmed but neither gate is satisfied', () => {
    expect(shouldShowJoinCta('confirmed_dap_provider', false, false)).toBe(false)
  })

  it('RULE: provider confirmation alone does not unlock Join CTA (eb-001 only is not enough)', () => {
    // eb-001 resolved = confirmed_dap_provider, but eb-002 and eb-004 still open
    expect(shouldShowJoinCta('confirmed_dap_provider', false, false)).toBe(false)
    expect(shouldShowJoinCta('confirmed_dap_provider', false, true)).toBe(false)
    expect(shouldShowJoinCta('confirmed_dap_provider', true, false)).toBe(false)
  })

  it('returns false for all non-confirmed statuses regardless of gate state', () => {
    UNCONFIRMED_STATUSES.forEach(status => {
      expect(shouldShowJoinCta(status, true, true), `${status} must not show Join CTA`).toBe(false)
    })
  })

  it('returns false for declined even with all gates satisfied', () => {
    expect(shouldShowJoinCta('declined', true, true)).toBe(false)
  })
})

// ─── shouldShowPricingClaims ──────────────────────────────────────────────────

describe('shouldShowPricingClaims', () => {
  it('returns true only when confirmed + offer terms validated', () => {
    expect(shouldShowPricingClaims('confirmed_dap_provider', true)).toBe(true)
  })

  it('returns false when confirmed but offer terms not validated', () => {
    expect(shouldShowPricingClaims('confirmed_dap_provider', false)).toBe(false)
  })

  it('returns false for all non-confirmed statuses even when offer terms validated', () => {
    UNCONFIRMED_STATUSES.forEach(status => {
      expect(shouldShowPricingClaims(status, true), `${status} must not show pricing claims`).toBe(false)
    })
  })

  it('returns false for declined status in any gate state', () => {
    expect(shouldShowPricingClaims('declined', true)).toBe(false)
    expect(shouldShowPricingClaims('declined', false)).toBe(false)
  })

  it('provider confirmation alone does not unlock pricing claims', () => {
    expect(shouldShowPricingClaims('confirmed_dap_provider', false)).toBe(false)
  })
})

// ─── isPublicOfferCard ────────────────────────────────────────────────────────

describe('isPublicOfferCard', () => {
  it('returns true for all patient-visible statuses', () => {
    const publicStatuses: ProviderStatus[] = [
      'confirmed_dap_provider',
      'not_confirmed',
      'recruitment_requested',
      'pending_confirmation',
    ]
    publicStatuses.forEach(status => {
      expect(isPublicOfferCard(status), `${status} should be a public card`).toBe(true)
    })
  })

  it('returns false for declined — declined must never render as a public offer card', () => {
    expect(isPublicOfferCard('declined')).toBe(false)
  })
})

// ─── shouldShowConfirmedBadge ─────────────────────────────────────────────────

describe('shouldShowConfirmedBadge', () => {
  it('returns true only for confirmed_dap_provider', () => {
    expect(shouldShowConfirmedBadge('confirmed_dap_provider')).toBe(true)
  })

  it('returns false for all non-confirmed statuses', () => {
    UNCONFIRMED_STATUSES.forEach(status => {
      expect(shouldShowConfirmedBadge(status), `${status} must not show confirmed badge`).toBe(false)
    })
  })
})

// ─── getCtaLabel ──────────────────────────────────────────────────────────────

describe('getCtaLabel', () => {
  it('returns "Join plan" when all three gates are satisfied', () => {
    expect(getCtaLabel('confirmed_dap_provider', true, true)).toBe('Join plan')
  })

  it('returns "View plan details" for confirmed provider when offer terms not validated', () => {
    expect(getCtaLabel('confirmed_dap_provider', false, true)).toBe('View plan details')
    expect(getCtaLabel('confirmed_dap_provider', false, false)).toBe('View plan details')
  })

  it('returns "View plan details" for confirmed provider when CTA gate locked', () => {
    expect(getCtaLabel('confirmed_dap_provider', true, false)).toBe('View plan details')
  })

  it('returns "Request this dentist" for not_confirmed', () => {
    expect(getCtaLabel('not_confirmed', true, true)).toBe('Request this dentist')
    expect(getCtaLabel('not_confirmed', false, false)).toBe('Request this dentist')
  })

  it('returns "Request this dentist" for pending_confirmation', () => {
    expect(getCtaLabel('pending_confirmation', true, true)).toBe('Request this dentist')
  })

  it('never returns "Join plan" for unconfirmed statuses', () => {
    UNCONFIRMED_STATUSES.forEach(status => {
      expect(
        getCtaLabel(status, true, true),
        `${status} CTA label must not be "Join plan"`,
      ).not.toBe('Join plan')
    })
  })
})

// ─── getCtaHref ───────────────────────────────────────────────────────────────

describe('getCtaHref', () => {
  it('returns provider slug for confirmed provider with slug', () => {
    const slug = '/v5/practice/irene-olaes-dds'
    expect(getCtaHref('confirmed_dap_provider', slug, true, true)).toBe(slug)
    expect(getCtaHref('confirmed_dap_provider', slug, false, false)).toBe(slug)
  })

  it('returns request flow route for confirmed provider without slug', () => {
    expect(getCtaHref('confirmed_dap_provider', undefined, true, true)).toBe(REQUEST_FLOW_ROUTE)
  })

  it('returns request flow route for unconfirmed statuses', () => {
    UNCONFIRMED_STATUSES.forEach(status => {
      expect(getCtaHref(status, '/some/slug', true, true)).toBe(REQUEST_FLOW_ROUTE)
    })
  })
})

// ─── getStatusLabel ───────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('never exposes declined status to patients', () => {
    const label = getStatusLabel('declined')
    expect(label.toLowerCase()).not.toContain('declined')
    expect(label.toLowerCase()).not.toContain('refused')
    expect(label.toLowerCase()).not.toContain('rejected')
  })

  it('all statuses return a non-empty label', () => {
    ALL_STATUSES.forEach(status => {
      expect(getStatusLabel(status).length).toBeGreaterThan(0)
    })
  })
})

// ─── Required copy constants ──────────────────────────────────────────────────

describe('REQUEST_EXPECTATION_COPY', () => {
  it('includes required disclaimer about DAP not being currently offered', () => {
    expect(REQUEST_EXPECTATION_COPY.toLowerCase()).toContain('does not mean the dentist currently offers dap')
  })

  it('mentions patient demand and contacting practices', () => {
    expect(REQUEST_EXPECTATION_COPY.toLowerCase()).toContain('demand')
    expect(REQUEST_EXPECTATION_COPY.toLowerCase()).toContain('contact')
  })
})

describe('Route constants', () => {
  it('REQUEST_FLOW_ROUTE is the request page inside the preview layer', () => {
    expect(REQUEST_FLOW_ROUTE).toBe('/preview/dap/request')
  })

  it('DIRECTORY_ROUTE is the directory entry inside the preview layer', () => {
    expect(DIRECTORY_ROUTE).toBe('/preview/dap')
  })

  it('directory entry links to the request flow route', () => {
    expect(REQUEST_FLOW_ROUTE.startsWith(DIRECTORY_ROUTE)).toBe(true)
  })
})

describe('Hero copy safety', () => {
  it('HERO_HEADLINE contains safe directory positioning', () => {
    const h = HERO_HEADLINE.toLowerCase()
    expect(h).toContain('find')
    expect(h).toContain('dental advantage plan')
  })

  it('HERO_HEADLINE does not contain forbidden enrollment phrases', () => {
    const h = HERO_HEADLINE.toLowerCase()
    FORBIDDEN_HERO_PHRASES.forEach(phrase => {
      expect(h, `Hero must not contain "${phrase}"`).not.toContain(phrase.toLowerCase())
    })
  })

  it('HERO_SUBHEAD does not contain forbidden phrases', () => {
    const s = HERO_SUBHEAD.toLowerCase()
    FORBIDDEN_HERO_PHRASES.forEach(phrase => {
      expect(s, `Subhead must not contain "${phrase}"`).not.toContain(phrase.toLowerCase())
    })
  })
})

// ─── Scenario: Unconfirmed dentist result card ────────────────────────────────

describe('Unconfirmed dentist result card — full behavioral check', () => {
  const status: ProviderStatus = 'not_confirmed'

  it('does not show Join CTA', () => {
    expect(shouldShowJoinCta(status, true, true)).toBe(false)
  })

  it('does not show confirmed pricing', () => {
    expect(shouldShowPricingClaims(status, true)).toBe(false)
  })

  it('does not show confirmed badge', () => {
    expect(shouldShowConfirmedBadge(status)).toBe(false)
  })

  it('CTA label is not "Join plan"', () => {
    expect(getCtaLabel(status, true, true)).not.toBe('Join plan')
  })

  it('is a public card (shown, just not as an offer)', () => {
    expect(isPublicOfferCard(status)).toBe(true)
  })

  it('CTA href goes to request flow', () => {
    expect(getCtaHref(status, '/some/slug', true, true)).toBe(REQUEST_FLOW_ROUTE)
  })
})

// ─── Scenario: Confirmed provider, all gates satisfied ───────────────────────

describe('Confirmed provider — all gates satisfied', () => {
  const status: ProviderStatus = 'confirmed_dap_provider'

  it('shows Join CTA', () => {
    expect(shouldShowJoinCta(status, true, true)).toBe(true)
  })

  it('shows pricing claims', () => {
    expect(shouldShowPricingClaims(status, true)).toBe(true)
  })

  it('shows confirmed badge', () => {
    expect(shouldShowConfirmedBadge(status)).toBe(true)
  })

  it('CTA label is "Join plan"', () => {
    expect(getCtaLabel(status, true, true)).toBe('Join plan')
  })

  it('is a public card', () => {
    expect(isPublicOfferCard(status)).toBe(true)
  })
})

// ─── Scenario: Declined provider ─────────────────────────────────────────────

describe('Declined provider — must never render as public offer card', () => {
  const status: ProviderStatus = 'declined'

  it('isPublicOfferCard returns false', () => {
    expect(isPublicOfferCard(status)).toBe(false)
  })

  it('does not show Join CTA', () => {
    expect(shouldShowJoinCta(status, true, true)).toBe(false)
  })

  it('does not show pricing claims', () => {
    expect(shouldShowPricingClaims(status, true)).toBe(false)
  })

  it('status label never exposes the decline', () => {
    const label = getStatusLabel(status)
    expect(label.toLowerCase()).not.toContain('declined')
  })

  it('CTA routes to request flow (Path 2), not to a declined-practice page', () => {
    expect(getCtaHref(status, '/some/slug', true, true)).toBe(REQUEST_FLOW_ROUTE)
  })
})
