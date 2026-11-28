import React from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {CalendarDays, CircleCheck, ClipboardList, ListCheck, Plus, Trash2} from '@/components/icons'
import {businessError, roleAtLeast} from '@/lib/business'
import {formatDate, timeAgo} from '@/lib/format'
import {columnTasks, filterTasks, positionAt, TASK_STATUSES, taskDue, type TaskFilter} from '@/lib/tasks'
import {toast} from '@/stores/ui'
import type {MyShop} from '@/state/queries/business'
import {useChatPeopleQuery} from '@/state/queries/chat'
import {useLeadsQuery} from '@/state/queries/crm'
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useTasksRealtime,
  useUpdateTaskMutation,
} from '@/state/queries/tasks'
import type {ChatPerson, ShopTaskRow, TaskStatus} from '@/types/business'
import {Alert, Button, CardSkeletons, Dialog, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {BusinessNav} from './BusinessNav'
import {shopLink, useCurrentShop} from './shared'

export function TasksPage() {
  const {shop, userId, isLoading, error, refetch} = useCurrentShop()
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!shop) {
    return (
      <div className="container page">
        <EmptyState
          title="This shop isn't on your list"
          action={
            <Link to="/business" className="btn btn--secondary">
              Show my shops
            </Link>
          }
        />
      </div>
    )
  }
  return <Tasks shop={shop} userId={userId} />
}

function Tasks({shop, userId}: {shop: MyShop; userId: string | null}) {
  const [params, setParams] = useSearchParams()
  const canEdit = roleAtLeast(shop.role, 'member')
  const filter: TaskFilter = canEdit ? ((params.get('show') as TaskFilter) ?? 'all') : 'all'
  const {data, isLoading, error, refetch} = useTasksQuery(shop.id)
  const {data: people = []} = useChatPeopleQuery(shop.id)
  useTasksRealtime(shop.id)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [adding, setAdding] = React.useState(false)
  const tasks = filterTasks(data ?? [], filter, userId)
  const open = data?.find(t => t.id === openId) ?? null

  const setFilter = (f: TaskFilter) => {
    const next = new URLSearchParams(params)
    if (f === 'all') next.delete('show')
    else next.set('show', f)
    setParams(next, {replace: true})
  }

  return (
    <div className="container page">
      <BusinessNav shop={shop} />
      <PageHead
        title="Tasks"
        description={
          canEdit
            ? 'What needs doing in the shop, who does it, and by when.'
            : 'The tasks given to you. Move them as you work.'
        }
        actions={
          canEdit && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden /> Add a task
            </Button>
          )
        }
      />

      {canEdit && (
        <div className="segmented" role="group" aria-label="Show" style={{marginBottom: 'var(--space-5)'}}>
          {(
            [
              ['all', 'Everyone'],
              ['mine', 'Mine'],
              ['open', 'Not done'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <CardSkeletons count={3} height={160} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={<ListCheck size={28} />}
          title={canEdit ? 'No tasks yet' : 'No tasks given to you yet'}
          action={
            canEdit && (
              <Button onClick={() => setAdding(true)}>
                <Plus size={18} aria-hidden /> Add a task
              </Button>
            )
          }>
          {canEdit
            ? 'Add the jobs around the shop, such as ordering parts or calling a customer back.'
            : 'When someone gives you a task, it shows here.'}
        </EmptyState>
      ) : (
        <TaskBoard shop={shop} tasks={tasks} people={people} canEdit={canEdit} onOpen={setOpenId} />
      )}

      {canEdit && (
        <Dialog open={adding} onClose={() => setAdding(false)} title="New task">
          {adding && <TaskForm shop={shop} people={people} onDone={() => setAdding(false)} />}
        </Dialog>
      )}
      <Dialog open={!!open} onClose={() => setOpenId(null)} title={canEdit ? 'Task' : (open?.title ?? 'Task')}>
        {open && <TaskForm key={open.id} shop={shop} people={people} task={open} onDone={() => setOpenId(null)} />}
      </Dialog>
    </div>
  )
}

function TaskBoard({
  shop,
  tasks,
  people,
  canEdit,
  onOpen,
}: {
  shop: MyShop
  tasks: ShopTaskRow[]
  people: ChatPerson[]
  canEdit: boolean
  onOpen: (id: string) => void
}) {
  const update = useUpdateTaskMutation(shop.id)
  const [over, setOver] = React.useState<TaskStatus | null>(null)

  const move = (task: ShopTaskRow, status: TaskStatus, index?: number) => {
    const column = columnTasks(tasks, status).filter(t => t.id !== task.id)
    const position = positionAt(column, index ?? column.length)
    update.mutate(
      {id: task.id, patch: {status, position}},
      {onError: e => toast(businessError(e, "We couldn't move it. Try again."), 'error')},
    )
  }

  return (
    <div className="board board--tasks" role="list" aria-label="Task board">
      {TASK_STATUSES.map(({id: status, label}) => {
        const column = columnTasks(tasks, status)
        return (
          <section
            key={status}
            role="listitem"
            className={`board__col${over === status ? ' board__col--over' : ''}`}
            aria-labelledby={`col-${status}`}
            onDragOver={e => {
              e.preventDefault()
              setOver(status)
            }}
            onDragLeave={() => setOver(o => (o === status ? null : o))}
            onDrop={e => {
              e.preventDefault()
              setOver(null)
              const task = tasks.find(t => t.id === e.dataTransfer.getData('text/kumpooni-task'))
              if (!task) return
              // Drop above the card under the pointer, or at the end of the column.
              const target = (e.target as HTMLElement).closest<HTMLElement>('[data-task]')
              const rest = column.filter(t => t.id !== task.id)
              const index = target ? rest.findIndex(t => t.id === target.dataset.task) : rest.length
              move(task, status, index < 0 ? rest.length : index)
            }}>
            <h2 id={`col-${status}`} className="board__head">
              <span className="row" style={{gap: 'var(--space-2)'}}>
                <span className={`task-dot task-dot--${status}`} aria-hidden />
                {label}
              </span>
              <span className="muted">{column.length}</span>
            </h2>
            {status === 'todo' && canEdit && <QuickAdd shop={shop} column={column} />}
            {column.length ? (
              <ul className="board__cards">
                {column.map(task => (
                  <TaskCard
                    key={task.id}
                    shop={shop}
                    task={task}
                    people={people}
                    onOpen={() => onOpen(task.id)}
                    onMove={s => move(task, s)}
                  />
                ))}
              </ul>
            ) : (
              <p className="small muted board__empty">
                {status === 'done'
                  ? 'Finished tasks land here.'
                  : status === 'doing'
                    ? 'Drag a task here when you start it.'
                    : 'Nothing to do.'}
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}

/** Type a task and press Enter. Details can come later. */
function QuickAdd({shop, column}: {shop: MyShop; column: ShopTaskRow[]}) {
  const create = useCreateTaskMutation(shop.id)
  const [title, setTitle] = React.useState('')
  const id = React.useId()
  return (
    <form
      className="task-quick"
      onSubmit={e => {
        e.preventDefault()
        if (!title.trim()) return
        create.mutate(
          {title, position: positionAt(column, 0)},
          {
            onSuccess: () => setTitle(''),
            onError: err => toast(businessError(err, "We couldn't add it. Try again."), 'error'),
          },
        )
      }}>
      <label htmlFor={id} className="visually-hidden">
        Add a task to To do
      </label>
      <Plus size={18} aria-hidden />
      <input
        id={id}
        className="task-quick__input"
        placeholder="Add a task"
        maxLength={200}
        value={title}
        onChange={e => setTitle(e.target.value)}
        enterKeyHint="done"
      />
      {create.isPending && <span className="spinner" aria-hidden />}
    </form>
  )
}

function TaskCard({
  shop,
  task,
  people,
  onOpen,
  onMove,
}: {
  shop: MyShop
  task: ShopTaskRow
  people: ChatPerson[]
  onOpen: () => void
  onMove: (status: TaskStatus) => void
}) {
  const assignee = people.find(p => p.user_id === task.assignee_id)
  const due = taskDue(task)
  const done = task.status === 'done'
  return (
    <li
      className={`card task-card${done ? ' task-card--done' : ''}`}
      data-task={task.id}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/kumpooni-task', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}>
      <button
        type="button"
        className="task-card__check"
        aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
        aria-pressed={done}
        onClick={() => onMove(done ? 'todo' : 'done')}>
        <CircleCheck size={22} aria-hidden />
      </button>
      <div className="task-card__main">
        <button type="button" className="task-card__title" onClick={onOpen}>
          {task.title}
        </button>
        {(assignee || due || task.lead_id || task.notes) && (
          <p className="task-card__meta">
            {assignee && (
              <span className="task-chip">
                <span className="task-avatar" aria-hidden>
                  {assignee.name[0]?.toUpperCase()}
                </span>
                {assignee.name}
              </span>
            )}
            {task.due_on && (
              <span className={`task-chip task-chip--${due ?? 'later'}`}>
                <CalendarDays size={14} aria-hidden />
                {due === 'overdue' ? 'Overdue, ' : due === 'today' ? 'Today, ' : ''}
                {formatDate(task.due_on, 'D MMM')}
              </span>
            )}
            {task.lead_id && (
              <Link to={shopLink(`/business/leads/${task.lead_id}`, shop.id)} className="task-chip task-chip--link">
                <ClipboardList size={14} aria-hidden /> Lead
              </Link>
            )}
          </p>
        )}
      </div>
      <label className="visually-hidden" htmlFor={`move-${task.id}`}>
        Move {task.title} to
      </label>
      <select
        id={`move-${task.id}`}
        className="task-card__move"
        value={task.status}
        onChange={e => onMove(e.target.value as TaskStatus)}>
        {TASK_STATUSES.map(s => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </li>
  )
}

/** Adds a task, or shows and changes one. Guests can only change the column. */
export function TaskForm({
  shop,
  people,
  task,
  leadId,
  onDone,
}: {
  shop: MyShop
  people: ChatPerson[]
  task?: ShopTaskRow
  /** Links a new task to this lead. */
  leadId?: string
  onDone: () => void
}) {
  const canEdit = roleAtLeast(shop.role, 'member')
  const create = useCreateTaskMutation(shop.id)
  const update = useUpdateTaskMutation(shop.id)
  const remove = useDeleteTaskMutation(shop.id)
  const {data: leads} = useLeadsQuery(canEdit ? shop.id : '')
  const [title, setTitle] = React.useState(task?.title ?? '')
  const [notes, setNotes] = React.useState(task?.notes ?? '')
  const [status, setStatus] = React.useState<TaskStatus>(task?.status ?? 'todo')
  const [assignee, setAssignee] = React.useState(task?.assignee_id ?? '')
  const [due, setDue] = React.useState(task?.due_on ?? '')
  const [lead, setLead] = React.useState(task?.lead_id ?? leadId ?? '')
  const pending = create.isPending || update.isPending
  const error = create.error ?? update.error ?? remove.error
  const author = people.find(p => p.user_id === task?.created_by)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const input = {title, notes, status, assignee_id: assignee, due_on: due, lead_id: lead}
    const after = {
      onSuccess: () => {
        toast(task ? 'Task saved.' : 'Task added.')
        onDone()
      },
    }
    if (!task) create.mutate(input, after)
    else update.mutate({id: task.id, patch: canEdit ? input : {status}}, after)
  }

  return (
    <form className="stack" style={{gap: 'var(--space-4)'}} onSubmit={submit}>
      {canEdit ? (
        <>
          <div className="field">
            <label className="label" htmlFor="task-title">
              Task
            </label>
            <input
              id="task-title"
              className="input"
              value={title}
              maxLength={200}
              required
              autoFocus={!task}
              placeholder="Order brake pads for the Vios"
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="task-notes">
              Notes <span className="muted">(optional)</span>
            </label>
            <textarea
              id="task-notes"
              className="textarea"
              rows={3}
              maxLength={4000}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </>
      ) : (
        task?.notes && (
          <p className="small" style={{whiteSpace: 'pre-wrap'}}>
            {task.notes}
          </p>
        )
      )}

      <div className="lead-fields">
        <div className="field">
          <label className="label" htmlFor="task-status">
            Column
          </label>
          <select
            id="task-status"
            className="select"
            value={status}
            onChange={e => setStatus(e.target.value as TaskStatus)}>
            {TASK_STATUSES.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {canEdit && (
          <>
            <div className="field">
              <label className="label" htmlFor="task-who">
                Who does it
              </label>
              <select id="task-who" className="select" value={assignee} onChange={e => setAssignee(e.target.value)}>
                <option value="">Nobody yet</option>
                {people.map(p => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="task-due">
                Due
              </label>
              <input id="task-due" type="date" className="input" value={due} onChange={e => setDue(e.target.value)} />
            </div>
            {!leadId && (
              <div className="field">
                <label className="label" htmlFor="task-lead">
                  Lead
                </label>
                <select id="task-lead" className="select" value={lead} onChange={e => setLead(e.target.value)}>
                  <option value="">No lead</option>
                  {leads?.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {task && (
        <p className="xsmall muted">
          Added {timeAgo(task.created_at)}
          {author ? ` by ${author.name}` : ''}
          {task.done_at ? `. Done ${timeAgo(task.done_at)}.` : '.'}
          {!canEdit && task.due_on ? ` Due ${formatDate(task.due_on, 'ddd, D MMM')}.` : ''}
        </p>
      )}
      {error && <Alert>{businessError(error)}</Alert>}
      <div className="dlg__foot">
        {task && canEdit && (
          <Button
            type="button"
            variant="ghost"
            loading={remove.isPending}
            style={{marginRight: 'auto'}}
            onClick={() =>
              remove.mutate(task.id, {
                onSuccess: () => {
                  toast('Task deleted.')
                  onDone()
                },
              })
            }>
            <Trash2 size={18} aria-hidden /> Delete
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={canEdit && !title.trim()}>
          {task ? 'Save' : 'Add task'}
        </Button>
      </div>
      {!canEdit && task && (
        <p className="xsmall muted">You can move this task. Ask a teammate to change anything else.</p>
      )}
    </form>
  )
}
