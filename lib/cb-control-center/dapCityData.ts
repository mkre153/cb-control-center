import { MOCK_DENTIST_PAGES } from './mockData'
import { isPublicOfferCard } from './dapDisplayRules'
import type { MockDentistPage } from './types'

// ─── Extended mock practices ──────────────────────────────────────────────────
// Preview-only additions for Chula Vista and La Jolla city demos.
// Escondido is intentionally empty — demonstrates the "no providers" state.

const PREVIEW_EXTRA_PRACTICES: MockDentistPage[] = [
  {
    id: 'cv-001',
    practiceName: 'Chula Vista Family Dentistry',
    city: 'Chula Vista',
    zip: '91910',
    provider_status: 'not_confirmed',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/chula-vista-family-dentistry',
    eligible: true,
    eligibilityReason: 'In SD County dataset — no DAP relationship confirmed',
  },
  {
    id: 'lj-001',
    practiceName: 'La Jolla Coastal Dental',
    city: 'La Jolla',
    zip: '92037',
    provider_status: 'recruitment_requested',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/la-jolla-coastal-dental',
    eligible: true,
    eligibilityReason: 'Patient submitted request — DAP outreach pending.',
  },
  {
    id: 'ec-001',
    practiceName: 'El Cajon Family Dentistry',
    city: 'El Cajon',
    zip: '92020',
    provider_status: 'not_confirmed',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/el-cajon-family-dentistry',
    eligible: true,
    eligibilityReason: 'In SD County dataset — no DAP relationship confirmed',
  },
  {
    id: 'nc-001',
    practiceName: 'National City Dental Group',
    city: 'National City',
    zip: '91950',
    provider_status: 'recruitment_requested',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/national-city-dental-group',
    eligible: true,
    eligibilityReason: 'Patient submitted request — DAP outreach pending.',
  },
  {
    id: 'oc-001',
    practiceName: 'Oceanside Dental Associates',
    city: 'Oceanside',
    zip: '92054',
    provider_status: 'not_confirmed',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/oceanside-dental-associates',
    eligible: true,
    eligibilityReason: 'In SD County dataset — no DAP relationship confirmed',
  },
]

export const ALL_PREVIEW_PRACTICES: MockDentistPage[] = [
  ...MOCK_DENTIST_PAGES,
  ...PREVIEW_EXTRA_PRACTICES,
]

// ─── Slug utilities ───────────────────────────────────────────────────────────

// Extract the last path segment from pageSlug as the preview URL slug.
// Returns undefined for declined practices (no public route exists).
export function getDentistSlug(page: MockDentistPage): string | undefined {
  if (!page.pageSlug) return undefined
  const parts = page.pageSlug.split('/')
  return parts[parts.length - 1]
}

export function getPracticeBySlug(slug: string): MockDentistPage | undefined {
  return ALL_PREVIEW_PRACTICES.find(p => getDentistSlug(p) === slug)
}

// All slugs that should have a public detail page (excludes declined).
export function getPublicDentistSlugs(): string[] {
  return ALL_PREVIEW_PRACTICES
    .filter(p => isPublicOfferCard(p.provider_status) && p.pageSlug)
    .map(p => getDentistSlug(p)!)
}

// ─── City data ────────────────────────────────────────────────────────────────

export interface CityData {
  slug: string
  name: string
}

export const DAP_CITY_PAGES: CityData[] = [
  // ── Original 5 ────────────────────────────────────────────────────────────
  { slug: 'san-diego',    name: 'San Diego'    },
  { slug: 'la-mesa',      name: 'La Mesa'      },  // confirmed provider
  { slug: 'chula-vista',  name: 'Chula Vista'  },
  { slug: 'la-jolla',     name: 'La Jolla'     },
  { slug: 'escondido',    name: 'Escondido'    },  // no providers — demand capture

  // ── Phase 7A expansion — SD County cities ────────────────────────────────
  { slug: 'el-cajon',       name: 'El Cajon'       },
  { slug: 'national-city',  name: 'National City'  },
  { slug: 'oceanside',      name: 'Oceanside'      },
  { slug: 'carlsbad',       name: 'Carlsbad'       },
  { slug: 'vista',          name: 'Vista'          },
  { slug: 'san-marcos',     name: 'San Marcos'     },
  { slug: 'poway',          name: 'Poway'          },
  { slug: 'santee',         name: 'Santee'         },
  { slug: 'encinitas',      name: 'Encinitas'      },
  { slug: 'coronado',       name: 'Coronado'       },

  // ── Phase 7A — San Diego neighborhoods ───────────────────────────────────
  { slug: 'clairemont',     name: 'Clairemont'     },
  { slug: 'mira-mesa',      name: 'Mira Mesa'      },
  { slug: 'mission-valley', name: 'Mission Valley' },
  { slug: 'north-park',     name: 'North Park'     },
  { slug: 'hillcrest',      name: 'Hillcrest'      },
  { slug: 'pacific-beach',  name: 'Pacific Beach'  },
]

export function getCityBySlug(slug: string): CityData | undefined {
  return DAP_CITY_PAGES.find(c => c.slug === slug)
}

export function getPracticesForCity(cityName: string): MockDentistPage[] {
  return ALL_PREVIEW_PRACTICES.filter(p => p.city === cityName)
}

// ─── Safe city heading functions (tested) ────────────────────────────────────

// Safe pattern from the architecture map: "Dentists in [City]"
// Must NOT say "DAP dentists near you", "participating dentists", etc.
export function getCityHeading(cityName: string): string {
  return `Dentists in ${cityName}`
}

export function getCitySubheading(): string {
  return 'See which listed practices are confirmed DAP providers, or request that a dentist be contacted about participating.'
}
