# DAP Request Flow — Canonical Surface Decision

**Decision date:** 2026-04-29
**Phase:** 8A (design system preview)
**Decision owner:** CB Control Center

---

## Two surfaces exist

### A. `DapRequestFlowPreview` (Phase 7E) — **canonical**

**File:** `components/cb-control-center/dap-public/DapRequestFlowPreview.tsx`
**Rendered by:** `components/cb-control-center/dap-pages/DapRequestFlowPage.tsx`
**Preview route:** `/preview/dap/request`

**Properties:**
- Model-driven via `DapRequestFlowModel` (Phase 7D)
- All inputs are `disabled` — no user interaction possible
- No `<form>` element — no implicit HTTP submission
- No `fetch()` call — no backend
- Carries `data-preview-banner` with explicit "no submission" message
- Carries `data-consent-field` on the consent checkbox (disabled)
- Carries `data-preview-submit` on the submit button (disabled, `aria-disabled="true"`)
- `collectsConsent: true` is a TypeScript literal on the model

**This is the canonical surface for Phase 8B backend wiring.**

When Phase 8B connects a real backend, the implementation should:
1. Replace disabled inputs with controlled inputs
2. Add a `<form action>` or a fetch-based submit handler inside `DapRequestFlowPreview`
3. Remove the `data-preview-banner` once submission is live
4. Wire `consentToContact` to the consent model

The shape of the model (`DapRequestFlowModel`) is already finalized in Phase 7D and should not change.

---

### B. `RequestDentistForm` (pre-Phase 7) — **deprecated**

**File:** `components/dap-preview/RequestDentistForm.tsx`

**Properties:**
- Predates Phase 7 model system
- Has live interactive inputs (not disabled)
- No `<form>` element — no HTTP submission
- Submit button uses `onClick={() => setSubmitted(true)}` (local state only)
- No `fetch()` call — no backend
- Not model-driven
- Not wired to the Phase 7D type system

**Status:** Retained for reference. Do not wire to any backend. Do not extend.
Do not render in new preview routes — use `DapRequestFlowPreview` instead.

---

## Why `DapRequestFlowPreview` is canonical

1. **Model-driven:** driven by `DapRequestFlowModel`, which captures `requestType`, `steps`, `availabilityCaveat`, and `collectsConsent: true` as a TypeScript literal. The model is the contract.

2. **Safety-attributed:** carries machine-readable `data-*` attributes that CI tests assert on. Any future backend wiring will be visible in the diff.

3. **Phase 7D compliance:** `collectsConsent: true` is a typed literal — the type system prevents shipping a request surface that omits consent collection.

4. **Preview-safe:** the amber banner and disabled state make it impossible to accidentally present the form as live to internal users.

5. **Testable:** Phase 7G tests assert `<form` is absent and no `fetch()` exists. Phase 8B should add tests that assert `<form` IS present (or fetch IS called) after wiring.

---

## Phase 8B checklist

When wiring the real backend:

- [ ] Add `action` attribute or `onSubmit` handler inside `DapRequestFlowPreview`
- [ ] Remove `disabled` from all inputs
- [ ] Remove `data-preview-banner` block
- [ ] Add a POST route at `app/api/dap/request/route.ts` (or equivalent)
- [ ] Wire `consentToContact` checkbox to form submission
- [ ] Add integration tests asserting: form submits, consent is required, no submission without consent
- [ ] Update Phase 7G Group 3 tests — they currently assert no fetch/form; update to assert fetch IS called and form IS present
- [ ] Delete `RequestDentistForm` once `DapRequestFlowPreview` is live
