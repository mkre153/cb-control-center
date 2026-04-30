// DAP admin rejection email preview builder.
// Pure functions — no Supabase, no MKCRM, no network, no filesystem.
// Preview-only. No email sending. All delivery flags are locked to dry-run.
// CB Control Center makes enrollment decisions. MKCRM has no decision authority.

import type { DapAdminRejectionEmailTemplateKey } from './dapAdminRejectionEmailTypes'
import type { DapAdminRejectionEmailCopy } from './dapAdminRejectionEmailTypes'
import {
  getDapAdminRejectionEmailCopy,
  getAllDapAdminRejectionEmailCopy,
} from './dapAdminRejectionEmailCopy'

// ─── Preview type ─────────────────────────────────────────────────────────────

export interface DapAdminRejectionEmailPreview {
  templateKey: DapAdminRejectionEmailTemplateKey
  copy:        DapAdminRejectionEmailCopy
  source: {
    decisionAuthority: 'cb_control_center'
    crmAuthority:      false
    paymentAuthority:  false
    previewOnly:       true
  }
  delivery: {
    queued:      false
    scheduled:   false
    sent:        false
    dryRunOnly:  true
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function getDapAdminRejectionEmailPreview(
  templateKey: DapAdminRejectionEmailTemplateKey
): DapAdminRejectionEmailPreview {
  return {
    templateKey,
    copy: getDapAdminRejectionEmailCopy(templateKey),
    source: {
      decisionAuthority: 'cb_control_center',
      crmAuthority:      false,
      paymentAuthority:  false,
      previewOnly:       true,
    },
    delivery: {
      queued:     false,
      scheduled:  false,
      sent:       false,
      dryRunOnly: true,
    },
  }
}

// ─── All template previews ────────────────────────────────────────────────────

export function getAllDapAdminRejectionEmailPreviews(): DapAdminRejectionEmailPreview[] {
  return getAllDapAdminRejectionEmailCopy().map(copy =>
    getDapAdminRejectionEmailPreview(copy.templateKey)
  )
}
