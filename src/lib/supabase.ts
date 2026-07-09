import { createClient } from '@supabase/supabase-js'

declare global {
  interface Window {
    __BUSYNEST_CONFIG__?: {
      supabaseUrl?: string
      supabaseAnonKey?: string
    }
  }
}

const runtime = window.__BUSYNEST_CONFIG__ ?? {}

export const supabaseUrl =
  runtime.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || ''
export const supabaseAnonKey =
  runtime.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// When unconfigured we still create a client with placeholder values so the
// app can render the "needs configuration" screen instead of crashing.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
)
