import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Project, Task, TaskDependency, Page, TaskStatus } from '../lib/types'

interface DataValue {
  ready: boolean
  projects: Project[]
  tasks: Task[]
  dependencies: TaskDependency[]
  pages: Page[]

  createProject: (fields: Partial<Project>) => Promise<Project | null>
  updateProject: (id: string, fields: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  createTask: (fields: Partial<Task>) => Promise<Task | null>
  updateTask: (id: string, fields: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  addDependency: (taskId: string, dependsOnId: string) => Promise<void>
  removeDependency: (id: string) => Promise<void>

  createPage: (fields: Partial<Page>) => Promise<Page | null>
  updatePage: (id: string, fields: Partial<Page>) => Promise<void>
  deletePage: (id: string) => Promise<void>

  // Task modal, available from anywhere in the app
  openTaskId: string | null
  openTask: (id: string | null) => void
}

const DataContext = createContext<DataValue | null>(null)

function upsertById<T extends { id: string }>(list: T[], row: T): T[] {
  const i = list.findIndex((x) => x.id === row.id)
  if (i === -1) return [...list, row]
  const next = list.slice()
  next[i] = row
  return next
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ready, setReady] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  // Initial load + realtime subscription, re-run when the user changes.
  useEffect(() => {
    if (!user) {
      setProjects([])
      setTasks([])
      setDependencies([])
      setPages([])
      setReady(false)
      return
    }

    let cancelled = false

    async function loadAll() {
      const [p, t, d, pg] = await Promise.all([
        supabase.from('projects').select('*').order('created_at'),
        supabase.from('tasks').select('*').order('sort_order'),
        supabase.from('task_dependencies').select('*'),
        supabase.from('pages').select('*').order('sort_order'),
      ])
      if (cancelled) return
      setProjects(p.data ?? [])
      setTasks(t.data ?? [])
      setDependencies(d.data ?? [])
      setPages(pg.data ?? [])
      setReady(true)
    }
    loadAll()

    const setters: Record<string, (fn: (prev: any[]) => any[]) => void> = {
      projects: setProjects as any,
      tasks: setTasks as any,
      task_dependencies: setDependencies as any,
      pages: setPages as any,
    }

    const channel = supabase.channel('busynest-realtime')
    for (const table of Object.keys(setters)) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        (payload) => {
          const set = setters[table]
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id?: string }
            if (oldRow.id) set((prev) => removeById(prev, oldRow.id!))
          } else {
            set((prev) => upsertById(prev, payload.new as any))
          }
        },
      )
    }
    channel.subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // ---- Projects ----
  const createProject = useCallback(
    async (fields: Partial<Project>) => {
      if (!user) return null
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name: 'Untitled project', color: '#c98a2b', ...fields })
        .select()
        .single()
      if (error || !data) return null
      setProjects((prev) => upsertById(prev, data))
      return data as Project
    },
    [user],
  )

  const updateProject = useCallback(async (id: string, fields: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)))
    await supabase.from('projects').update(fields).eq('id', id)
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => removeById(prev, id))
    setTasks((prev) => prev.filter((t) => t.project_id !== id))
    await supabase.from('projects').delete().eq('id', id)
  }, [])

  // ---- Tasks ----
  const createTask = useCallback(
    async (fields: Partial<Task>) => {
      if (!user) return null
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: 'New task',
          status: 'todo',
          priority: 'medium',
          sort_order: Date.now(),
          ...fields,
        })
        .select()
        .single()
      if (error || !data) return null
      setTasks((prev) => upsertById(prev, data))
      return data as Task
    },
    [user],
  )

  const updateTask = useCallback(async (id: string, fields: Partial<Task>) => {
    if (fields.status) {
      fields = {
        ...fields,
        completed_at: fields.status === 'done' ? new Date().toISOString() : null,
      }
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)))
    await supabase.from('tasks').update(fields).eq('id', id)
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => removeById(prev, id))
    setDependencies((prev) =>
      prev.filter((d) => d.task_id !== id && d.depends_on_task_id !== id),
    )
    await supabase.from('tasks').delete().eq('id', id)
  }, [])

  // ---- Dependencies ----
  const addDependency = useCallback(
    async (taskId: string, dependsOnId: string) => {
      if (!user || taskId === dependsOnId) return
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({ user_id: user.id, task_id: taskId, depends_on_task_id: dependsOnId })
        .select()
        .single()
      if (!error && data) setDependencies((prev) => upsertById(prev, data))
    },
    [user],
  )

  const removeDependency = useCallback(async (id: string) => {
    setDependencies((prev) => removeById(prev, id))
    await supabase.from('task_dependencies').delete().eq('id', id)
  }, [])

  // ---- Pages ----
  const createPage = useCallback(
    async (fields: Partial<Page>) => {
      if (!user) return null
      const { data, error } = await supabase
        .from('pages')
        .insert({
          user_id: user.id,
          kind: 'page',
          title: 'Untitled',
          emoji: '📄',
          content_html: '',
          sort_order: Date.now(),
          ...fields,
        })
        .select()
        .single()
      if (error || !data) return null
      setPages((prev) => upsertById(prev, data))
      return data as Page
    },
    [user],
  )

  const updatePage = useCallback(async (id: string, fields: Partial<Page>) => {
    const stamped = { ...fields, updated_at: new Date().toISOString() }
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...stamped } : p)))
    await supabase.from('pages').update(stamped).eq('id', id)
  }, [])

  const deletePage = useCallback(async (id: string) => {
    setPages((prev) => {
      // Also remove descendants locally; the DB cascades via parent_id FK.
      const doomed = new Set<string>([id])
      let grew = true
      while (grew) {
        grew = false
        for (const p of prev) {
          if (p.parent_id && doomed.has(p.parent_id) && !doomed.has(p.id)) {
            doomed.add(p.id)
            grew = true
          }
        }
      }
      return prev.filter((p) => !doomed.has(p.id))
    })
    await supabase.from('pages').delete().eq('id', id)
  }, [])

  const value = useMemo(
    () => ({
      ready,
      projects,
      tasks,
      dependencies,
      pages,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      addDependency,
      removeDependency,
      createPage,
      updatePage,
      deletePage,
      openTaskId,
      openTask: setOpenTaskId,
    }),
    [ready, projects, tasks, dependencies, pages, openTaskId,
     createProject, updateProject, deleteProject, createTask, updateTask,
     deleteTask, addDependency, removeDependency, createPage, updatePage, deletePage],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}

/** Statuses in kanban column order. */
export const BOARD_COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']
