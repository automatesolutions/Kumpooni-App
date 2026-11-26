import {describe, expect, it} from 'vitest'
import {
  activityText,
  defaultShareFields,
  DEFAULT_STAGES,
  dueState,
  moveTargets,
  normalizeShareFields,
  SHARE_FIELD_INFO,
  todayManila,
  warrantyFollowUpDate,
} from './crm'

describe('share fields', () => {
  it('always includes the problem', () => {
    expect(normalizeShareFields([])).toEqual(['problem'])
    expect(normalizeShareFields(['photos', 'nonsense'])).toEqual(['problem', 'photos'])
  })

  it('keeps plate, visits, estimates, and contact off by default', () => {
    const d = defaultShareFields()
    expect(d).toContain('problem')
    for (const off of ['plate', 'visits', 'estimates', 'contact'] as const) expect(d).not.toContain(off)
    expect(SHARE_FIELD_INFO.problem.locked).toBe(true)
  })
})

describe('follow-up dates', () => {
  it('lands the day after the warranty ends', () => {
    expect(warrantyFollowUpDate('2026-11-01', 30)).toBe('2026-12-02')
    expect(warrantyFollowUpDate('2026-12-20', 14)).toBe('2027-01-04')
  })

  it('refuses bad input', () => {
    expect(warrantyFollowUpDate('Nov 1', 30)).toBeNull()
    expect(warrantyFollowUpDate('2026-11-01', 0)).toBeNull()
    expect(warrantyFollowUpDate('2026-11-01', 1.5)).toBeNull()
  })

  it("uses Manila's date, not the browser's", () => {
    // 4 PM UTC on Nov 26 is already Nov 27 in Manila.
    expect(todayManila(new Date('2026-11-26T16:00:00Z'))).toBe('2026-11-27')
  })

  it('sorts follow-ups into overdue, today, and later', () => {
    expect(dueState('2026-11-25', '2026-11-26')).toBe('overdue')
    expect(dueState('2026-11-26', '2026-11-26')).toBe('today')
    expect(dueState('2026-11-27', '2026-11-26')).toBe('later')
  })
})

describe('stages', () => {
  const stages = DEFAULT_STAGES.map((name, i) => ({
    id: `s${i}`,
    name,
    position: i + 1,
    kind: name === 'Done' ? ('won' as const) : name === 'Lost' ? ('lost' as const) : ('open' as const),
  }))

  it('offers every other stage in "Move to", in order', () => {
    const targets = moveTargets([...stages].reverse(), 's1')
    expect(targets.map(t => t.name)).toEqual(['New', 'Scheduled', 'In the shop', 'Ready for pickup', 'Done', 'Lost'])
  })

  it('describes stage changes with names', () => {
    const name = (id: string | null) => stages.find(s => s.id === id)?.name ?? 'a removed stage'
    expect(
      activityText({type: 'stage', body: null, from_stage: 's0', to_stage: 's1'}, name, () => '', n => `₱${n}`),
    ).toBe('Moved from New to Quoted.')
    expect(activityText({type: 'quote', body: '1800', from_stage: null, to_stage: null}, name, () => '', n => `₱${n}`)).toBe(
      'Quote set to ₱1800.',
    )
  })
})
