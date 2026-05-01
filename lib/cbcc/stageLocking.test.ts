import { describe, it, expect } from 'vitest'
import {
  isStageLocked,
  getStageLockReason,
  getUnlockedStages,
  getNextUnlockedStage,
  getNextStage,
  canStartStage,
  canUnlockStage,
} from './stageLocking'
import type { CbccProject, CbccStage, CbccStageStatus } from './types'

const NOW = '2026-05-01T00:00:00Z'

function makeStage(order: number, status: CbccStageStatus = 'not_started'): CbccStage {
  return { id: `s-${order}`, order, status }
}

function makeProject(stages: CbccStage[], status: CbccProject['status'] = 'active'): CbccProject {
  return {
    id: 'p',
    slug: 'p',
    name: 'P',
    adapterKey: 'generic',
    status,
    stages,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

describe('isStageLocked / getStageLockReason — first stage', () => {
  it('is unlocked when project is active', () => {
    const p = makeProject([makeStage(1)])
    expect(isStageLocked(p, 's-1')).toBe(false)
  })

  it('is unlocked when project is draft (default)', () => {
    const p = makeProject([makeStage(1)], 'draft')
    expect(isStageLocked(p, 's-1')).toBe(false)
  })

  it('is locked when project is paused', () => {
    const p = makeProject([makeStage(1)], 'paused')
    const r = getStageLockReason(p, 's-1')
    expect(r.locked).toBe(true)
    expect(r.reason).toMatch(/paused/)
  })

  it('respects allowFirstStageWhenDraft=false', () => {
    const p = makeProject([makeStage(1)], 'draft')
    expect(isStageLocked(p, 's-1', { allowFirstStageWhenDraft: false })).toBe(true)
  })
})

describe('isStageLocked / getStageLockReason — sequence rules', () => {
  it('stage 2 is locked while stage 1 is not_started', () => {
    const p = makeProject([makeStage(1), makeStage(2)])
    const r = getStageLockReason(p, 's-2')
    expect(r.locked).toBe(true)
    expect(r.reason).toMatch(/predecessor/)
  })

  it('stage 2 unlocks after stage 1 is approved', () => {
    const p = makeProject([makeStage(1, 'approved'), makeStage(2)])
    expect(isStageLocked(p, 's-2')).toBe(false)
  })

  it('stage 3 is locked while stage 2 is awaiting_owner_approval', () => {
    const p = makeProject([
      makeStage(1, 'approved'),
      makeStage(2, 'awaiting_owner_approval'),
      makeStage(3),
    ])
    expect(isStageLocked(p, 's-3')).toBe(true)
  })

  it('a rejected upstream stage blocks all downstream', () => {
    const p = makeProject([
      makeStage(1, 'approved'),
      makeStage(2, 'rejected'),
      makeStage(3),
      makeStage(4),
    ])
    expect(getStageLockReason(p, 's-3').reason).toMatch(/rejected/)
    expect(isStageLocked(p, 's-4')).toBe(true)
  })

  it('a blocked upstream stage blocks all downstream', () => {
    const p = makeProject([
      makeStage(1, 'approved'),
      makeStage(2, 'blocked'),
      makeStage(3),
    ])
    expect(getStageLockReason(p, 's-3').reason).toMatch(/blocked/)
  })

  it('returns locked + reason when stage id is unknown', () => {
    const p = makeProject([makeStage(1)])
    const r = getStageLockReason(p, 'missing')
    expect(r.locked).toBe(true)
    expect(r.reason).toMatch(/not found/)
  })
})

describe('getUnlockedStages', () => {
  it('returns the prefix of consecutively-approved + the next', () => {
    const p = makeProject([
      makeStage(1, 'approved'),
      makeStage(2, 'approved'),
      makeStage(3),
      makeStage(4),
    ])
    const unlocked = getUnlockedStages(p)
    expect(unlocked.map(s => s.id)).toEqual(['s-1', 's-2', 's-3'])
  })

  it('returns empty when project is paused', () => {
    const p = makeProject([makeStage(1)], 'paused')
    expect(getUnlockedStages(p)).toEqual([])
  })
})

describe('getNextUnlockedStage', () => {
  it('returns the first non-approved unlocked stage', () => {
    const p = makeProject([makeStage(1, 'approved'), makeStage(2), makeStage(3)])
    expect(getNextUnlockedStage(p)?.id).toBe('s-2')
  })

  it('returns null when all stages are approved', () => {
    const p = makeProject([makeStage(1, 'approved'), makeStage(2, 'approved')])
    expect(getNextUnlockedStage(p)).toBeNull()
  })

  it('returns null when downstream is blocked', () => {
    const p = makeProject([
      makeStage(1, 'approved'),
      makeStage(2, 'rejected'),
      makeStage(3),
    ])
    expect(getNextUnlockedStage(p)).toBeNull()
  })
})

describe('canStartStage', () => {
  it('allows starting an unlocked not_started stage', () => {
    const p = makeProject([makeStage(1)])
    expect(canStartStage(p, 's-1')).toEqual({ ok: true })
  })

  it('refuses an approved stage', () => {
    const p = makeProject([makeStage(1, 'approved')])
    const r = canStartStage(p, 's-1')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/already approved/)
  })

  it('refuses a rejected stage', () => {
    const p = makeProject([makeStage(1, 'rejected')])
    const r = canStartStage(p, 's-1')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/already rejected/)
  })

  it('refuses a locked stage with the locking reason', () => {
    const p = makeProject([makeStage(1), makeStage(2)])
    const r = canStartStage(p, 's-2')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/predecessor/)
  })

  it('refuses an unknown stage', () => {
    const p = makeProject([makeStage(1)])
    const r = canStartStage(p, 'missing')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/not found/)
  })
})

describe('canUnlockStage (directive-literal alias)', () => {
  it('reports ok for an unlocked stage', () => {
    const p = makeProject([makeStage(1)])
    expect(canUnlockStage(p, 's-1')).toEqual({ ok: true })
  })

  it('reports ok=false with the locking reason', () => {
    const p = makeProject([makeStage(1), makeStage(2)])
    const r = canUnlockStage(p, 's-2')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/predecessor/)
  })

  it('reports unknown-stage as ok=false', () => {
    const p = makeProject([makeStage(1)])
    const r = canUnlockStage(p, 'missing')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/not found/)
  })

  it('reports ok=true for an approved stage (it is not locked)', () => {
    // canUnlockStage answers "is this stage gated?" — it does NOT check
    // whether the stage can be transitioned. canStartStage covers that.
    const p = makeProject([makeStage(1, 'approved')])
    expect(canUnlockStage(p, 's-1')).toEqual({ ok: true })
  })
})

describe('getNextStage (directive-literal alias)', () => {
  it('matches getNextUnlockedStage on the same input', () => {
    const p = makeProject([makeStage(1, 'approved'), makeStage(2), makeStage(3)])
    expect(getNextStage(p)).toEqual(getNextUnlockedStage(p))
  })

  it('returns the first non-approved unlocked stage', () => {
    const p = makeProject([makeStage(1, 'approved'), makeStage(2), makeStage(3)])
    expect(getNextStage(p)?.id).toBe('s-2')
  })

  it('returns null when no actionable stage exists', () => {
    const p = makeProject([makeStage(1, 'approved'), makeStage(2, 'rejected'), makeStage(3)])
    expect(getNextStage(p)).toBeNull()
  })
})
