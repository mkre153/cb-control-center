import type {
  SystemKey,
  SystemResponsibility,
  SystemBoundaryDefinition,
} from './clientBuilderBoundaryTypes'

// ─── Boundary map ─────────────────────────────────────────────────────────────
//
// Client Builder Pro is the public market/payment layer.
// MKCRM is the internal CRM/automation layer.
// DAP is the vertical registry/directory.
// CB Control Center is the admin orchestration layer.

const BOUNDARY_MAP: Record<SystemKey, SystemBoundaryDefinition> = {
  client_builder_pro: {
    systemKey:                'client_builder_pro',
    publicName:               'Client Builder Pro',
    allowedResponsibilities:  ['market', 'payment', 'lifecycle_sync'],
    forbiddenResponsibilities: ['crm', 'automation', 'registry', 'directory', 'admin_control', 'cms_export'],
    publicFacing:             true,
  },

  mkcrm: {
    systemKey:                'mkcrm',
    publicName:               'MKCRM',
    allowedResponsibilities:  ['crm', 'automation', 'lifecycle_sync'],
    forbiddenResponsibilities: ['market', 'payment', 'registry', 'directory', 'admin_control', 'cms_export'],
    publicFacing:             false,
  },

  dap: {
    systemKey:                'dap',
    publicName:               'Dental Advantage Plan',
    allowedResponsibilities:  ['registry', 'directory'],
    forbiddenResponsibilities: ['market', 'payment', 'crm', 'automation', 'admin_control', 'cms_export', 'lifecycle_sync'],
    publicFacing:             true,
  },

  cb_control_center: {
    systemKey:                'cb_control_center',
    publicName:               'CB Control Center',
    allowedResponsibilities:  ['admin_control', 'cms_export', 'lifecycle_sync', 'registry'],
    forbiddenResponsibilities: ['market', 'payment', 'crm', 'automation', 'directory'],
    publicFacing:             false,
  },
}

// ─── Pure rule functions ───────────────────────────────────────────────────────

export function getSystemBoundary(systemKey: SystemKey): SystemBoundaryDefinition {
  return BOUNDARY_MAP[systemKey]
}

export function isResponsibilityAllowed(
  systemKey: SystemKey,
  responsibility: SystemResponsibility
): boolean {
  return BOUNDARY_MAP[systemKey].allowedResponsibilities.includes(responsibility)
}

export function assertResponsibilityAllowed(
  systemKey: SystemKey,
  responsibility: SystemResponsibility
): void {
  if (!isResponsibilityAllowed(systemKey, responsibility)) {
    const { publicName, allowedResponsibilities } = BOUNDARY_MAP[systemKey]
    throw new Error(
      `${publicName} is not allowed responsibility '${responsibility}'. ` +
      `Allowed: ${allowedResponsibilities.join(', ')}.`
    )
  }
}

export function getPublicCommercialSystemForVertical(
  _verticalKey: string
): 'client_builder_pro' {
  // Client Builder Pro is the public market/payment layer for all verticals.
  return 'client_builder_pro'
}

export function getInternalCrmSystemForVertical(
  _verticalKey: string
): 'mkcrm' {
  // MKCRM is the internal CRM/automation layer for all verticals.
  return 'mkcrm'
}

// ─── Integration target classification ────────────────────────────────────────

export type DapIntegrationTargetClassification =
  | 'public_commercial_layer'
  | 'internal_crm_layer'
  | 'vertical_registry_layer'
  | 'admin_control_layer'
  | 'unknown'

export function classifyDapIntegrationTarget(
  target: string
): DapIntegrationTargetClassification {
  switch (target) {
    case 'client_builder_pro': return 'public_commercial_layer'
    case 'mkcrm':              return 'internal_crm_layer'
    case 'dap':                return 'vertical_registry_layer'
    case 'cb_control_center':  return 'admin_control_layer'
    default:                   return 'unknown'
  }
}
