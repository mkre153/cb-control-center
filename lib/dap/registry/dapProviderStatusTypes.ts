// DAP-owned public provider status and claim level types.
// These are the canonical source of truth for provider status within the DAP domain.
// lib/cb-control-center/* may import from here; lib/dap/* must not import from lib/cb-control-center/*.

export type ProviderStatus =
  | 'confirmed_dap_provider'  // signed agreement on file → Template A, Path 1
  | 'not_confirmed'           // in dataset, not verified as offering DAP → Template B, Path 2
  | 'recruitment_requested'   // patient submitted a request → Template B, Path 3
  | 'pending_confirmation'    // DAP outreach made — patient still sees Path 2
  | 'declined'                // practice declined DAP — internal only, no patient-facing template

export type PublicClaimLevel = 'full' | 'limited' | 'none'
