'use client'

import { useState } from 'react'
import { CrawlOutputTab } from './tabs/CrawlOutputTab'
import { BusinessTruthTab } from './tabs/BusinessTruthTab'
import { BlockersTab } from './tabs/BlockersTab'
import { StrategyTab } from './tabs/StrategyTab'
import { PagesTab } from './tabs/PagesTab'
import { ActivityTab } from './tabs/ActivityTab'
import type {
  CrawlOutput,
  EnrichedBlocker,
  TruthSection,
  StrategyRecord,
  PagePlanItem,
  ActivityEvent,
} from '@/lib/cb-control-center/types'

type TabId = 'crawl-output' | 'business-truth-json' | 'blockers' | 'strategy' | 'pages' | 'activity'

interface ControlCenterTabsProps {
  crawlOutput: CrawlOutput
  businessTruthSchema: TruthSection[]
  blockers: EnrichedBlocker[]
  strategy: StrategyRecord
  pages: PagePlanItem[]
  activity: ActivityEvent[]
}

export function ControlCenterTabs({
  crawlOutput,
  businessTruthSchema,
  blockers,
  strategy,
  pages,
  activity,
}: ControlCenterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('crawl-output')

  const openBlockerCount = blockers.filter(b => b.resolutionStatus === 'open').length

  const tabs: { id: TabId; label: string }[] = [
    { id: 'crawl-output', label: 'Crawl Output' },
    { id: 'business-truth-json', label: 'Business Truth JSON' },
    { id: 'blockers', label: `Blockers (${openBlockerCount})` },
    { id: 'strategy', label: 'Strategy' },
    { id: 'pages', label: 'Pages' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-1 mb-5 border-b border-gray-100 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'crawl-output' && <CrawlOutputTab crawlOutput={crawlOutput} />}
        {activeTab === 'business-truth-json' && <BusinessTruthTab schema={businessTruthSchema} />}
        {activeTab === 'blockers' && <BlockersTab blockers={blockers} />}
        {activeTab === 'strategy' && <StrategyTab strategy={strategy} />}
        {activeTab === 'pages' && <PagesTab pages={pages} />}
        {activeTab === 'activity' && <ActivityTab activity={activity} />}
      </div>
    </div>
  )
}
