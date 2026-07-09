export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type PageKind = 'page' | 'journal'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  color: string
  is_archived: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string
  title: string
  notes_html: string
  status: TaskStatus
  priority: Priority
  start_date: string | null
  due_date: string | null
  sort_order: number
  created_at: string
  completed_at: string | null
}

export interface TaskDependency {
  id: string
  user_id: string
  task_id: string
  depends_on_task_id: string
}

export interface Page {
  id: string
  user_id: string
  parent_id: string | null
  kind: PageKind
  title: string
  emoji: string
  content_html: string
  journal_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const PROJECT_COLORS = [
  '#c98a2b', // amber
  '#2b7a78', // teal
  '#7d5ba6', // violet
  '#c25e5e', // coral
  '#4a7ab5', // blue
  '#6b8f3d', // olive
  '#b5527d', // rose
  '#8a6d4a', // walnut
]
