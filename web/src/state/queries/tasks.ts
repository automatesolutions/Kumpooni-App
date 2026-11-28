// Tasks (supabase/10-business-tasks.sql). Row level security decides what each person sees:
// guests get only the tasks given to them.
import React from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {ShopTaskRow, TaskStatus} from '@/types/business'

const keys = {
  all: (orgId: string) => ['tasks', orgId] as const,
}

export function useTasksQuery(orgId: string) {
  return useQuery({
    queryKey: keys.all(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<ShopTaskRow[]> => {
      const {data, error} = await supabase
        .from('shop_tasks')
        .select('*')
        .eq('org_id', orgId)
        .order('position', {ascending: true})
        .limit(1000)
      if (error) throw error
      return data
    },
  })
}

/** Keeps the board current when a teammate adds, moves, or deletes a task. */
export function useTasksRealtime(orgId: string) {
  const qc = useQueryClient()
  React.useEffect(() => {
    if (!orgId) return
    const channel = supabase
      .channel(`shop-tasks:${orgId}`)
      .on(
        'postgres_changes',
        {event: '*', schema: 'public', table: 'shop_tasks', filter: `org_id=eq.${orgId}`},
        payload => {
          qc.setQueryData<ShopTaskRow[]>(keys.all(orgId), list => {
            if (!list) return list
            if (payload.eventType === 'DELETE') return list.filter(t => t.id !== (payload.old as {id?: string}).id)
            const row = payload.new as ShopTaskRow
            return [...list.filter(t => t.id !== row.id), row]
          })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [orgId, qc])
}

export type TaskInput = {
  title: string
  notes?: string | null
  status?: TaskStatus
  assignee_id?: string | null
  due_on?: string | null
  lead_id?: string | null
  position?: number
}

export function useCreateTaskMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TaskInput) => {
      const {data, error} = await supabase
        .from('shop_tasks')
        .insert({
          org_id: orgId,
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          status: input.status ?? 'todo',
          assignee_id: input.assignee_id || null,
          due_on: input.due_on || null,
          lead_id: input.lead_id || null,
          position: input.position,
        })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: task =>
      qc.setQueryData<ShopTaskRow[]>(keys.all(orgId), list =>
        list ? [...list.filter(t => t.id !== task.id), task] : list,
      ),
  })
}

/** Changes a task. The board updates right away and goes back if the change fails. */
export function useUpdateTaskMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({id, patch}: {id: string; patch: Partial<TaskInput>}) => {
      const clean: Partial<ShopTaskRow> = {...patch}
      if (patch.title !== undefined) clean.title = patch.title.trim()
      if (patch.notes !== undefined) clean.notes = patch.notes?.trim() || null
      for (const k of ['assignee_id', 'due_on', 'lead_id'] as const) if (patch[k] === '') clean[k] = null
      const {data, error} = await supabase.from('shop_tasks').update(clean).eq('id', id).select('*').single()
      if (error) throw error
      return data
    },
    onMutate: async ({id, patch}) => {
      await qc.cancelQueries({queryKey: keys.all(orgId)})
      const before = qc.getQueryData<ShopTaskRow[]>(keys.all(orgId))
      qc.setQueryData<ShopTaskRow[]>(keys.all(orgId), list =>
        list?.map(t => (t.id === id ? ({...t, ...patch} as ShopTaskRow) : t)),
      )
      return {before}
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(keys.all(orgId), ctx.before)
    },
    onSuccess: task =>
      qc.setQueryData<ShopTaskRow[]>(keys.all(orgId), list => list?.map(t => (t.id === task.id ? task : t))),
  })
}

export function useDeleteTaskMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const {error, count} = await supabase.from('shop_tasks').delete({count: 'exact'}).eq('id', id)
      if (error) throw error
      if (!count) throw new Error('not_allowed')
      return id
    },
    onSuccess: id => qc.setQueryData<ShopTaskRow[]>(keys.all(orgId), list => list?.filter(t => t.id !== id)),
  })
}
