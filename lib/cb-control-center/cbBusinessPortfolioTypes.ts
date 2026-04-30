export type CbBusinessStatus =
  | 'blocked'
  | 'foundation_active'
  | 'content_strategy_active'
  | 'go_to_market_active'
  | 'concept'

export interface CbBusinessInstance {
  slug: string
  name: string
  description: string
  category: string
  status: CbBusinessStatus
  statusLabel: string
  readinessPercent: number | null
  nextAction: string
  buildPath: string | null
  detailPath: string
  isActive: boolean
}

export interface CbNewBusinessAction {
  label: string
  path: string
  description: string
}

export interface CbBusinessPortfolio {
  businesses: CbBusinessInstance[]
  newBusinessAction: CbNewBusinessAction
}
