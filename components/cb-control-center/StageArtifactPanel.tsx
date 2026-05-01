import type {
  StageArtifact,
  StageArtifactStatus,
  DapBusinessDefinitionArtifact,
} from '@/lib/cb-control-center/dapBusinessDefinition'
import type { DapTruthSchemaArtifact } from '@/lib/cb-control-center/dapTruthSchemaArtifact'

// ─── Status display ───────────────────────────────────────────────────────────

const ARTIFACT_STATUS_STYLE: Record<StageArtifactStatus, string> = {
  not_started: 'bg-gray-100 text-gray-400',
  draft:       'bg-blue-50 text-blue-600',
  reviewable:  'bg-amber-50 text-amber-700',
  approved:    'bg-green-100 text-green-700',
  blocked:     'bg-red-100 text-red-700',
}

const ARTIFACT_STATUS_LABEL: Record<StageArtifactStatus, string> = {
  not_started: 'Not Generated',
  draft:       'Draft',
  reviewable:  'Awaiting Review',
  approved:    'Approved',
  blocked:     'Blocked',
}

// ─── Section helpers ──────────────────────────────────────────────────────────

function ArtifactSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div data-artifact-section={label.toLowerCase().replace(/\s+/g, '-')} className="space-y-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  )
}

function ClaimList({ items, variant }: { items: readonly string[]; variant: 'allowed' | 'forbidden' }) {
  const dot = variant === 'allowed' ? 'text-green-500' : 'text-red-400'
  const symbol = variant === 'allowed' ? '✓' : '✗'
  return (
    <ul data-claim-list={variant} className="space-y-0.5">
      {items.map(item => (
        <li key={item} className="flex items-start gap-1.5 text-xs text-gray-700">
          <span className={`shrink-0 mt-0.5 font-bold ${dot}`}>{symbol}</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map(item => (
        <li key={item} className="flex items-start gap-1.5 text-xs text-gray-700">
          <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-gray-400 inline-block" />
          {item}
        </li>
      ))}
    </ul>
  )
}

// ─── Business definition renderer ────────────────────────────────────────────

function BusinessDefinitionArtifact({ artifact }: { artifact: DapBusinessDefinitionArtifact }) {
  return (
    <div data-artifact-type="business_definition" className="space-y-4">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-400">Business</span>
          <p className="font-semibold text-gray-900">{artifact.businessName}</p>
        </div>
        <div>
          <span className="text-gray-400">Parent Company</span>
          <p className="font-semibold text-gray-900">{artifact.parentCompany}</p>
        </div>
        <div>
          <span className="text-gray-400">Market Brand</span>
          <p className="font-semibold text-gray-900">{artifact.marketBrand}</p>
        </div>
        <div>
          <span className="text-gray-400">Category</span>
          <p className="text-gray-700">{artifact.businessCategory}</p>
        </div>
      </div>

      {/* What it is / is not */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ArtifactSection label="What DAP Is">
          <BulletList items={artifact.whatItIs} />
        </ArtifactSection>
        <ArtifactSection label="What DAP Is Not">
          <BulletList items={artifact.whatItIsNot} />
        </ArtifactSection>
      </div>

      {/* Customers */}
      <ArtifactSection label="Customers">
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="text-gray-400">Primary — </span>
            <span className="text-gray-700">{artifact.primaryCustomer}</span>
          </div>
          <div>
            <span className="text-gray-400">Secondary — </span>
            <span className="text-gray-700">{artifact.secondaryCustomer}</span>
          </div>
        </div>
      </ArtifactSection>

      {/* Conversion goals */}
      <ArtifactSection label="Conversion Goals">
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="text-gray-400">Primary — </span>
            <span className="text-gray-700">{artifact.primaryConversionGoal}</span>
          </div>
          <div>
            <span className="text-gray-400">Secondary — </span>
            <span className="text-gray-700">{artifact.secondaryConversionGoal}</span>
          </div>
        </div>
      </ArtifactSection>

      {/* Claims */}
      <details open>
        <summary className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
          Allowed Claims ▸
        </summary>
        <div className="mt-1.5">
          <ClaimList items={artifact.allowedClaims} variant="allowed" />
        </div>
      </details>

      <details open>
        <summary className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
          Forbidden Claims ▸
        </summary>
        <div className="mt-1.5">
          <ClaimList items={artifact.forbiddenClaims} variant="forbidden" />
        </div>
      </details>

      <details open>
        <summary className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
          Truth Rules ▸
        </summary>
        <div className="mt-1.5">
          <ol className="space-y-0.5 list-decimal list-inside">
            {artifact.truthRules.map((rule, i) => (
              <li key={i} className="text-xs text-gray-700">{rule}</li>
            ))}
          </ol>
        </div>
      </details>

      {/* Source files */}
      <ArtifactSection label="Source Files">
        <ul className="space-y-0.5">
          {artifact.sourceFiles.map(f => (
            <li key={f} className="font-mono text-xs text-gray-600">{f}</li>
          ))}
        </ul>
      </ArtifactSection>
    </div>
  )
}

// ─── Truth schema renderer ────────────────────────────────────────────────────

function TruthSchemaArtifact({ artifact }: { artifact: DapTruthSchemaArtifact }) {
  return (
    <div data-artifact-type="truth_schema" className="space-y-4">
      <ArtifactSection label="7 DAP Truth Rules">
        <ol className="space-y-0.5 list-decimal list-inside">
          {artifact.truthRules.map((rule, i) => (
            <li key={i} className="text-xs text-gray-700">{rule}</li>
          ))}
        </ol>
      </ArtifactSection>

      <details open>
        <summary className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
          Forbidden Claims ▸
        </summary>
        <div className="mt-1.5">
          <ClaimList items={artifact.forbiddenClaims} variant="forbidden" />
        </div>
      </details>

      <details open>
        <summary className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
          Required Disclaimers ▸
        </summary>
        <div className="mt-1.5">
          <BulletList items={artifact.requiredDisclaimers} />
        </div>
      </details>

      <details>
        <summary className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
          Safety Flags ▸
        </summary>
        <div className="mt-1.5">
          <BulletList items={artifact.safetyFlags} />
        </div>
      </details>

      <ArtifactSection label="Page Types Governed">
        <div className="flex flex-wrap gap-1">
          {artifact.pageTypesGoverned.map(pt => (
            <span key={pt} className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {pt}
            </span>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection label="Source Files">
        <ul className="space-y-0.5">
          {artifact.sourceFiles.map(f => (
            <li key={f} className="font-mono text-xs text-gray-600">{f}</li>
          ))}
        </ul>
      </ArtifactSection>
    </div>
  )
}

// ─── Generic artifact renderer ────────────────────────────────────────────────

function GenericArtifact({ artifact }: { artifact: StageArtifact }) {
  return (
    <div data-artifact-type={artifact.type} className="space-y-3">
      {artifact.sourceFiles.length > 0 && (
        <ArtifactSection label="Source Files">
          <ul className="space-y-0.5">
            {artifact.sourceFiles.map(f => (
              <li key={f} className="font-mono text-xs text-gray-600">{f}</li>
            ))}
          </ul>
        </ArtifactSection>
      )}
      <p className="text-xs text-gray-400 italic">
        Full artifact renderer for type &lsquo;{artifact.type}&rsquo; will be added when this stage advances.
      </p>
    </div>
  )
}

function ArtifactBody({ artifact }: { artifact: StageArtifact }) {
  if (artifact.type === 'business_definition') {
    return <BusinessDefinitionArtifact artifact={artifact as DapBusinessDefinitionArtifact} />
  }
  if (artifact.type === 'truth_schema') {
    return <TruthSchemaArtifact artifact={artifact as DapTruthSchemaArtifact} />
  }
  return <GenericArtifact artifact={artifact} />
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function StageArtifactPanel({ artifact }: { artifact: StageArtifact }) {
  return (
    <div
      data-stage-artifact-panel
      data-artifact-status={artifact.status}
      className="mt-3 border border-gray-200 rounded-md overflow-hidden"
    >
      {/* Artifact header — always visible */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Artifact
          </span>
          <span className="text-xs font-semibold text-gray-800">{artifact.title}</span>
        </div>
        <span
          data-artifact-status-badge
          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${ARTIFACT_STATUS_STYLE[artifact.status]}`}
        >
          {ARTIFACT_STATUS_LABEL[artifact.status]}
        </span>
      </div>

      {/* Summary — always visible */}
      <div className="px-3 py-2 border-b border-gray-100 bg-white">
        <p data-artifact-summary className="text-xs text-gray-700 leading-relaxed">
          {artifact.summary}
        </p>
      </div>

      {/* Body */}
      <div className="px-3 py-3 bg-white">
        <ArtifactBody artifact={artifact} />
      </div>

      {/* Approval metadata — always visible if approved */}
      {artifact.approvedAt && artifact.approvedBy && (
        <div
          data-artifact-approval
          className="px-3 py-2 bg-green-50 border-t border-green-100 flex gap-4 text-xs text-green-700"
        >
          <span>Approved by {artifact.approvedBy}</span>
          <span>·</span>
          <span>{artifact.approvedAt}</span>
        </div>
      )}
    </div>
  )
}
