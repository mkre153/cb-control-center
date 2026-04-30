// Client Builder Pro is the public market/payment layer.
// MKCRM is the internal CRM/automation layer.
// DAP is the vertical registry/directory.
// CB Control Center is the admin orchestration layer.

export type CommercialSystemKey  = 'client_builder_pro'
export type InternalCrmSystemKey = 'mkcrm'
export type VerticalProductKey   = 'dap'
export type ControlSurfaceKey    = 'cb_control_center'

export type SystemKey =
  | CommercialSystemKey
  | InternalCrmSystemKey
  | VerticalProductKey
  | ControlSurfaceKey

export type SystemResponsibility =
  | 'market'
  | 'payment'
  | 'crm'
  | 'automation'
  | 'registry'
  | 'directory'
  | 'admin_control'
  | 'cms_export'
  | 'lifecycle_sync'

export interface SystemBoundaryDefinition {
  systemKey: SystemKey
  publicName: string
  allowedResponsibilities: SystemResponsibility[]
  forbiddenResponsibilities: SystemResponsibility[]
  publicFacing: boolean
}
