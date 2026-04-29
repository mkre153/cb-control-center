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
  PipelineBlocker,
  BusinessTruthRecord,
  StrategyRecord,
  PagePlanItem,
  ActivityEvent,
} from '@/lib/cb-control-center/types'

const TABS = [
  { id: 'crawl-output', label: 'Crawl Output' },
  { id: 'business-truth-json', label: 'Business Truth JSON' },
  { id: 'blockers', label: 'Blockers' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'pages', label: 'Pages' },
  { id: 'activity', label: 'Activity' },
] as const

type TabId = (typeof TABS)[number]['id']

interface ControlCenterTabsProps {
  crawlOutput: CrawlOutput
  businessTruth: BusinessTruthRecord
  blockers: PipelineBlocker[]
  strategy: StrategyRecord
  pages: PagePlanItem[]
  activity: ActivityEvent[]
}

export function ControlCenterTabs({
  crawlOutput,
  businessTruth,
  blockers,
  strategy,
  pages,
  activity,
}: ControlCenterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('crawl-output')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-1 mb-5 border-b border-gray-100 pb-3">
        {TABS.map((tab) => (
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
        {activeTab === 'business-truth-json' && <BusinessTruthTab businessTruth={businessTruth} />}
        {activeTab === 'blockers' && <BlockersTab blockers={blockers} />}
        {activeTab === 'strategy' && <StrategyTab strategy={strategy} />}
        {activeTab === 'pages' && <PagesTab pages={pages} />}
        {activeTab === 'activity' && <ActivityTab activity={activity} />}
      </div>
    </div>
  )
}
