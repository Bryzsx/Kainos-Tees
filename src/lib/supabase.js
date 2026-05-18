import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.warn(
    'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env\n' +
    'Falling back to demo mode with localStorage.'
  )
}

export const supabase = supabaseUrl && !supabaseUrl.includes('your-project')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function isSupabased() {
  return supabase !== null
}
