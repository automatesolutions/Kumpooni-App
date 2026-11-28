// Task board helpers (supabase/10-business-tasks.sql). Pure functions, so they're easy to test.
import type {ShopTaskRow, TaskStatus} from '@/types/business'
import {todayManila} from './crm'

export const TASK_STATUSES: {id: TaskStatus; label: string}[] = [
  {id: 'todo', label: 'To do'},
  {id: 'doing', label: 'Doing'},
  {id: 'done', label: 'Done'},
]

export const statusLabel = (status: TaskStatus) => TASK_STATUSES.find(s => s.id === status)?.label ?? status

export type TaskFilter = 'all' | 'mine' | 'open'

/** Tasks in one column, in board order. */
export function columnTasks(list: ShopTaskRow[], status: TaskStatus) {
  return list
    .filter(t => t.status === status)
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
}

/**
 * The position that puts a task at `index` in a column, between its new neighbors.
 * `column` is the column without the task being moved.
 */
export function positionAt(column: Pick<ShopTaskRow, 'position'>[], index: number, now = Date.now() / 1000) {
  if (!column.length) return now
  if (index <= 0) return column[0].position - 1
  if (index >= column.length) return column[column.length - 1].position + 1
  return (column[index - 1].position + column[index].position) / 2
}

export function filterTasks(list: ShopTaskRow[], filter: TaskFilter, userId: string | null) {
  if (filter === 'mine') return list.filter(t => t.assignee_id === userId)
  if (filter === 'open') return list.filter(t => t.status !== 'done')
  return list
}

export type TaskDue = 'overdue' | 'today' | 'soon' | 'later' | null

/** How urgent a due date is. Done tasks are never overdue. "Soon" is within 3 days. */
export function taskDue(task: Pick<ShopTaskRow, 'due_on' | 'status'>, today = todayManila()): TaskDue {
  if (!task.due_on || task.status === 'done') return null
  if (task.due_on < today) return 'overdue'
  if (task.due_on === today) return 'today'
  const days = (Date.parse(task.due_on) - Date.parse(today)) / 86_400_000
  return days <= 3 ? 'soon' : 'later'
}

/** Open tasks given to you, and how many of them are overdue. For the shop home page. */
export function myTaskCounts(list: ShopTaskRow[] | undefined, userId: string | null, today = todayManila()) {
  const mine = (list ?? []).filter(t => t.assignee_id === userId && t.status !== 'done')
  return {open: mine.length, overdue: mine.filter(t => taskDue(t, today) === 'overdue').length}
}
