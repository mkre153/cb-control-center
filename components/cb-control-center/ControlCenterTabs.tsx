'use client'

import { useState } from 'react'
import { CrawlOutputTab } from './tabs/CrawlOutputTab'
import { BusinessTruthTab } from './tabs/BusinessTruthTab'
import { BlockersTab } from './tabs/BlockersTab'
import { ProviderStatusTab } from './tabs/ProviderStatusTab'
import { SearchPathsTab } from './tabs/SearchPathsTab'
import { TemplatesTab } from './tabs/TemplatesTab'
import { StrategyTab } from './tabs/StrategyTab'
import { PagesTab } from './tabs/PagesTab'
import { ActivityTab } from './tabs/ActivityTab'
import { SiteArchitectureTab } from './tabs/SiteArchitectureTab'
import type {
  CrawlOutput,
  EnrichedBlocker,
  TruthSection,
  StrategyRecord,
  PagePlanItem,
  ActivityEvent,
} from '@/lib/cb-control-center/types'

type TabId = 'crawl-output' | 'truth-schema' | 'blockers' | 'provider-status' | 'search-paths' | 'templates' | 'site-architecture' | 'strategy' | 'pages' | 'activity'

interface ControlCenterTabsProps {
  crawlOutput: CrawlOutput
  businessTruthSchema: TruthSection[]
  blockers: EnrichedBlocker[]
  strategy: StrategyRecord
  pages: PagePlanItem[]
  activity: ActivityEvent[]
  onResolveBlocker?: (id: string, type: 'confirm' | 'defer') => void
  defaultTab?: TabId
}

export function ControlCenterTabs({
  crawlOutput,
  businessTruthSchema,
  blockers,
  strategy,
  pages,
  activity,
  onResolveBlocker,
  defaultTab = 'crawl-output',
}: ControlCenterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  const openBlockerCount = blockers.filter(b => b.resolutionStatus === 'open').length

  const tabs: { id: TabId; label: string }[] = [
    { id: 'crawl-output',    label: 'Crawl' },
    { id: 'truth-schema',    label: 'Truth' },
    { id: 'blockers',        label: `Blockers${openBlockerCount > 0 ? ` (${openBlockerCount})` : ' ✓'}` },
    { id: 'provider-status', label: 'Providers' },
    { id: 'search-paths',    label: 'Patient Paths' },
    { id: 'templates',       label: 'Templates' },
    { id: 'site-architecture', label: 'Architecture' },
    { id: 'strategy',        label: 'Strategy' },
    { id: 'pages',           label: 'Pages' },
    { id: 'activity',        label: 'Activity' },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-1 mb-5 border-b border-gray-100 pb-3">
        {tabs.map((tab) => {
          const isBlockersTab = tab.id === 'blockers'
          const hasOpenBlockers = openBlockerCount > 0
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : isBlockersTab && hasOpenBlockers
                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === 'crawl-output' && <CrawlOutputTab crawlOutput={crawlOutput} />}
        {activeTab === 'truth-schema' && <BusinessTruthTab schema={businessTruthSchema} />}
        {activeTab === 'blockers' && (
          <BlockersTab blockers={blockers} onResolveBlocker={onResolveBlocker} />
        )}
        {activeTab === 'provider-status' && <ProviderStatusTab />}
        {activeTab === 'search-paths' && <SearchPathsTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'site-architecture' && (
          <SiteArchitectureTab schema={businessTruthSchema} blockers={blockers} />
        )}
        {activeTab === 'strategy' && <StrategyTab strategy={strategy} />}
        {activeTab === 'pages' && <PagesTab pages={pages} blockers={blockers} />}
        {activeTab === 'activity' && <ActivityTab activity={activity} />}
      </div>
    </div>
  )
}
