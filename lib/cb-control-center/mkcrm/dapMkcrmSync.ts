import type { DapMkcrmSyncPayload, DapMkcrmSyncEventType } from './dapMkcrmTypes'

// DAP is the registry. MKCRM is downstream only.
// This adapter emits sync-ready payloads in shadow mode.
// No real network calls. No MKCRM response mutates DAP state.

export interface DapMkcrmShadowSyncResult {
  ok: boolean
  shadowMode: true
  eventType: DapMkcrmSyncEventType
  dedupeKey: string
  skipped?: boolean
  reason?: string
}

export function validateDapMkcrmPayload(payload: DapMkcrmSyncPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: must be an object')
  }
  if ((payload as { shadowMode: unknown }).shadowMode !== true) {
    throw new Error('Invalid payload: shadowMode must be true — live sync is not permitted in Phase 9M')
  }
  if ((payload as { verticalKey: unknown }).verticalKey !== 'dap') {
    throw new Error(`Invalid payload: verticalKey must be 'dap'`)
  }
  if (!payload.eventType) {
    throw new Error('Invalid payload: missing eventType')
  }
  if (!payload.dedupeKey) {
    throw new Error('Invalid payload: missing dedupeKey')
  }
  if (!payload.payloadVersion) {
    throw new Error('Invalid payload: missing payloadVersion')
  }
  if (!payload.dapId) {
    throw new Error('Invalid payload: missing dapId')
  }
  if (!payload.occurredAt) {
    throw new Error('Invalid payload: missing occurredAt')
  }
}

export async function syncDapEventToMkcrmShadow(
  payload: DapMkcrmSyncPayload
): Promise<DapMkcrmShadowSyncResult> {
  validateDapMkcrmPayload(payload)

  // Shadow mode only: no fetch, no HTTP, no external dependency.
  // DAP events flow to MKCRM — MKCRM does not author DAP state.
  // DAP standing is derived from DAP events alone.

  return {
    ok: true,
    shadowMode: true,
    eventType: payload.eventType,
    dedupeKey: payload.dedupeKey,
  }
}
