# DAP Supabase Schema Draft

Status: **Design draft** — not yet migrated. Finalize before connecting live Supabase.

---

## Architecture

All data flows through `buildDapCmsSnapshotFromSource(bundle: DapCmsSourceBundle)` in
`lib/cb-control-center/dapSourceAdapter.ts`. Public page components never touch Supabase
directly — they consume only `DapCmsSnapshot`.

```
Supabase tables
    ↓
buildDapCmsSnapshotFromSource()   (dapSourceAdapter.ts)
    ↓
DapCmsSnapshot
    ↓
runClaimQA()                      (dapClaimQA.ts)
    ↓
Preview / public pages
```

---

## Tables

### `dap_practices`

One row per dental practice. The primary source for both practice CMS records and
dentist detail page records. A practice generates a dentist page when
`published = true`, `provider_status != 'declined'`, and `page_slug IS NOT NULL`.

| Column                  | Type                 | Notes |
|-------------------------|----------------------|-------|
| `id`                    | `text` (PK)          | Stable practice ID, e.g. `sd-001` |
| `name`                  | `text`               | Practice display name |
| `city`                  | `text`               | Must match a `city_name` in `dap_cities` |
| `county`                | `text`               | e.g. `San Diego County` |
| `state`                 | `text`               | e.g. `CA` |
| `zip`                   | `text`               | 5-digit ZIP |
| `provider_status`       | `text`               | Enum: `confirmed_dap_provider`, `not_confirmed`, `recruitment_requested`, `pending_confirmation`, `declined` |
| `page_slug`             | `text` (nullable)    | URL slug segment only, e.g. `irene-olaes-dds`; null for declined |
| `offer_terms_validated` | `boolean`            | Unlocks pricing display; requires `confirmed_dap_provider` to take effect |
| `cta_gate_unlocked`     | `boolean`            | Unlocks Join CTA; requires `confirmed_dap_provider` + `offer_terms_validated` |
| `adult_annual_fee`      | `text` (nullable)    | Display string, e.g. `$450/yr`; null unless `offer_terms_validated` |
| `child_annual_fee`      | `text` (nullable)    | Display string; null unless `offer_terms_validated` |
| `offer_source`          | `text` (nullable)    | Source attribution for pricing data |
| `published`             | `boolean`            | `false` = draft, excluded from all public output |
| `forbidden_claims`      | `text[]`             | Internal annotation, never rendered publicly |
| `created_at`            | `timestamptz`        | |
| `updated_at`            | `timestamptz`        | |

**Row-level security**: `select` allowed for service role only on internal fields
(`offer_terms_validated`, `cta_gate_unlocked`, `forbidden_claims`). Public read
is handled exclusively through the snapshot adapter.

---

### `dap_cities`

One row per city page. Practice associations are computed at adapter-time by
matching `dap_practices.city` to `dap_cities.city_name`.

| Column          | Type           | Notes |
|-----------------|----------------|-------|
| `slug`          | `text` (PK)    | URL slug, e.g. `san-diego` |
| `city_name`     | `text`         | Display name, e.g. `San Diego` |
| `county_name`   | `text`         | e.g. `San Diego County` |
| `state`         | `text`         | e.g. `CA` |
| `published`     | `boolean`      | `false` = draft |
| `created_at`    | `timestamptz`  | |

---

### `dap_decision_pages`

One row per decision/FAQ page. These map to `/preview/dap/decisions/[slug]`.

| Column                    | Type           | Notes |
|---------------------------|----------------|-------|
| `slug`                    | `text` (PK)    | URL slug |
| `query_intent`            | `text`         | Internal annotation — never patient-facing |
| `decision_question`       | `text`         | Patient-facing H1 |
| `audience`                | `text`         | Target reader description |
| `safe_answer`             | `text`         | Patient-facing answer (tested against forbidden claims) |
| `primary_cta_logic`       | `text`         | Internal routing note |
| `required_facts`          | `text[]`       | Patient-safe supporting facts |
| `forbidden_claims`        | `text[]`       | Internal safety annotations — never rendered |
| `seo_title`               | `text`         | |
| `seo_description`         | `text`         | |
| `secondary_cta_label`     | `text` (null)  | Optional secondary CTA |
| `secondary_cta_href`      | `text` (null)  | |
| `related_city_slugs`      | `text[]`       | Must reference valid `dap_cities.slug` values |
| `related_practice_slugs`  | `text[]`       | Non-declined practice slugs only |
| `public_claim_level`      | `text`         | Enum: `full`, `limited`, `none` |
| `published`               | `boolean`      | `false` = draft |
| `created_at`              | `timestamptz`  | |
| `updated_at`              | `timestamptz`  | |

---

### `dap_treatment_pages`

One row per treatment-intent page. These map to `/preview/dap/treatments/[slug]`.

| Column                | Type           | Notes |
|-----------------------|----------------|-------|
| `slug`                | `text` (PK)    | URL slug |
| `treatment`           | `text`         | e.g. `dental crown` |
| `treatment_question`  | `text`         | Patient-facing H1 |
| `audience`            | `text`         | |
| `safe_answer`         | `text`         | Patient-facing answer |
| `required_facts`      | `text[]`       | Patient-safe facts |
| `forbidden_claims`    | `text[]`       | Internal safety annotations — never rendered |
| `seo_title`           | `text`         | |
| `seo_description`     | `text`         | |
| `primary_cta_label`   | `text`         | |
| `primary_cta_href`    | `text`         | Must be `REQUEST_FLOW_ROUTE` for safety |
| `related_city_slugs`  | `text[]`       | |
| `public_claim_level`  | `text`         | Enum: `full`, `limited`, `none` |
| `published`           | `boolean`      | `false` = draft |
| `created_at`          | `timestamptz`  | |
| `updated_at`          | `timestamptz`  | |

---

### `dap_claim_qa_runs` (audit log)

Stores the result of each `runClaimQA()` call for auditing. Optional.

| Column               | Type           | Notes |
|----------------------|----------------|-------|
| `id`                 | `uuid` (PK)    | |
| `run_at`             | `timestamptz`  | |
| `total_warnings`     | `int`          | 0 = safe to publish |
| `total_practices`    | `int`          | |
| `total_cities`       | `int`          | |
| `total_dentist_pages`| `int`          | |
| `total_decisions`    | `int`          | |
| `total_treatments`   | `int`          | |
| `warnings_json`      | `jsonb`        | Full `QAWarning[]` payload |
| `triggered_by`       | `text`         | e.g. `build`, `manual`, `webhook` |

---

## Connecting Supabase

When ready to connect live data:

1. Run the migration to create these tables.
2. Implement a server-side fetch function, e.g.:
   ```ts
   async function fetchDapSourceBundle(): Promise<DapCmsSourceBundle> {
     const [practices, cities, decisionPages, treatmentPages] = await Promise.all([
       supabase.from('dap_practices').select('*').eq('published', true),
       supabase.from('dap_cities').select('*').eq('published', true),
       supabase.from('dap_decision_pages').select('*').eq('published', true),
       supabase.from('dap_treatment_pages').select('*').eq('published', true),
     ])
     return { practices: practices.data!, cities: cities.data!, ... }
   }
   ```
3. Replace `buildMockSourceBundle()` in `exportDapCmsSnapshot()` with `await fetchDapSourceBundle()`.
4. Run `runClaimQA(snapshot)` before serving pages and block any snapshot with `totalWarnings > 0`.
5. All existing tests remain valid — they test the adapter contract, not the data source.

---

## Deferred

- `dap_page_relationships` (explicit city ↔ practice join table) — not needed while
  the adapter derives associations from `dap_practices.city` matching `dap_cities.city_name`.
- Full-text search index on `safe_answer` and `seo_description` — defer until search is needed.
- RLS policies for service role — implement before connecting from any public-facing edge function.
