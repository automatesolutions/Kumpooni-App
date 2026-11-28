import {describe, expect, it} from 'vitest'
import type {ShopTaskRow} from '@/types/business'
import {columnTasks, filterTasks, myTaskCounts, positionAt, taskDue} from './tasks'

const task = (id: string, extra: Partial<ShopTaskRow> = {}): ShopTaskRow => ({
  id,
  created_at: '2026-11-28T00:00:00Z',
  updated_at: '2026-11-28T00:00:00Z',
  org_id: 'o',
  title: id,
  notes: null,
  status: 'todo',
  position: 0,
  assignee_id: null,
  due_on: null,
  lead_id: null,
  created_by: null,
  done_at: null,
  ...extra,
})

describe('columnTasks', () => {
  it('keeps one column in board order', () => {
    const list = [task('b', {position: 2}), task('a', {position: 1}), task('c', {status: 'done'})]
    expect(columnTasks(list, 'todo').map(t => t.id)).toEqual(['a', 'b'])
  })
})

describe('positionAt', () => {
  const col = [{position: 10}, {position: 20}]
  it('goes before the first, between two, and after the last', () => {
    expect(positionAt(col, 0)).toBe(9)
    expect(positionAt(col, 1)).toBe(15)
    expect(positionAt(col, 2)).toBe(21)
  })
  it('uses the time in an empty column', () => {
    expect(positionAt([], 0, 500)).toBe(500)
  })
})

describe('taskDue', () => {
  const today = '2026-11-28'
  it('says how urgent a due date is', () => {
    expect(taskDue({due_on: '2026-11-27', status: 'todo'}, today)).toBe('overdue')
    expect(taskDue({due_on: today, status: 'doing'}, today)).toBe('today')
    expect(taskDue({due_on: '2026-12-01', status: 'todo'}, today)).toBe('soon')
    expect(taskDue({due_on: '2026-12-10', status: 'todo'}, today)).toBe('later')
  })
  it('never calls a done task overdue', () => {
    expect(taskDue({due_on: '2026-11-01', status: 'done'}, today)).toBeNull()
    expect(taskDue({due_on: null, status: 'todo'}, today)).toBeNull()
  })
})

describe('filterTasks and myTaskCounts', () => {
  const list = [
    task('a', {assignee_id: 'me', due_on: '2026-11-20'}),
    task('b', {assignee_id: 'me', status: 'done'}),
    task('c', {assignee_id: 'you'}),
  ]
  it('filters to mine or open', () => {
    expect(filterTasks(list, 'mine', 'me').map(t => t.id)).toEqual(['a', 'b'])
    expect(filterTasks(list, 'open', 'me').map(t => t.id)).toEqual(['a', 'c'])
    expect(filterTasks(list, 'all', 'me')).toHaveLength(3)
  })
  it('counts my open and overdue tasks', () => {
    expect(myTaskCounts(list, 'me', '2026-11-28')).toEqual({open: 1, overdue: 1})
  })
})
