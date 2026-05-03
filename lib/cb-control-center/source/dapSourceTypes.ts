import type { ProviderStatus, PublicClaimLevel } from '../../dap/registry/dapProviderStatusTypes'

// ─── DAP CMS Source Record Types ─────────────────────────────────────────────
//
// These types represent the raw shape of records as they would arrive from a
// Supabase table or headless CMS. They use snake_case column names and include
// gate fields that the adapter uses to compute the gated public CMS records.
//
// These types NEVER appear in public page components. Route components consume
// only DapCmsSnapshot and its five collections (defined in dapCmsTypes.ts).

// ─── Practice source record ───────────────────────────────────────────────────
// Corresponds to: dap_practices table in Supabase

export interface DapPracticeSourceRecord {
  id: string
  name: string
  city: string
  county: string
  state: string
  zip: string
  provider_status: ProviderStatus
  page_slug: string | null        // slug segment only, e.g. "irene-olaes-dds"; null = no public route
  offer_terms_validated: boolean  // gate: pricing may only be shown when true + confirmed
  cta_gate_unlocked: boolean      // gate: Join CTA requires this AND offer_terms_validated AND confirmed
  adult_annual_fee: string | null // raw fee string, e.g. "$450/yr"; null unless offer terms validated
  child_annual_fee: string | null
  offer_source: string | null     // source attribution for pricing data
  published: boolean              // false = draft; skip entirely (no CMS record generated)
  forbidden_claims: readonly string[]
}

// ─── City source record ───────────────────────────────────────────────────────
// Corresponds to: dap_cities table in Supabase
// Practice associations are derived at adapter-time from DapPracticeSourceRecord.city

export interface DapCitySourceRecord {
  slug: string
  city_name: string
  county_name: string
  state: string
  published: boolean
}

// ─── Decision page source record ─────────────────────────────────────────────
// Corresponds to: dap_decision_pages table in Supabase

export interface DapDecisionSourceRecord {
  slug: string
  query_intent: string
  decision_question: string
  audience: string
  safe_answer: string
  primary_cta_logic: string
  required_facts: readonly string[]
  forbidden_claims: readonly string[]
  seo_title: string
  seo_description: string
  secondary_cta_label: string | null
  secondary_cta_href: string | null
  related_city_slugs: readonly string[]
  related_practice_slugs: readonly string[]
  public_claim_level: PublicClaimLevel
  published: boolean
}

// ─── Treatment page source record ─────────────────────────────────────────────
// Corresponds to: dap_treatment_pages table in Supabase

export interface DapTreatmentSourceRecord {
  slug: string
  treatment: string
  treatment_question: string
  audience: string
  safe_answer: string
  required_facts: readonly string[]
  forbidden_claims: readonly string[]
  seo_title: string
  seo_description: string
  primary_cta_label: string
  primary_cta_href: string
  related_city_slugs: readonly string[]
  public_claim_level: PublicClaimLevel
  published: boolean
}

// ─── Dentist source record ────────────────────────────────────────────────────
// Note: dentist detail pages are derived entirely from DapPracticeSourceRecord.
// A practice generates a dentist detail page when published=true,
// provider_status !== 'declined', and page_slug is non-null.
// There is no separate dap_dentist_pages table — the practice record is the source.

// ─── Full source bundle ───────────────────────────────────────────────────────
// Aggregates all source collections needed to build a DapCmsSnapshot.
// This is the input contract for buildDapCmsSnapshotFromSource().

export interface DapCmsSourceBundle {
  practices: DapPracticeSourceRecord[]
  cities: DapCitySourceRecord[]
  decisionPages: DapDecisionSourceRecord[]
  treatmentPages: DapTreatmentSourceRecord[]
}
