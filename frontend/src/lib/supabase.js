import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wvvrnevduupsundjxpxt.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dnJuZXZkdXVwc3VuZGp4cHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjQ0ODAsImV4cCI6MjEwMDY0MDQ4MH0.PIoWvwrDuaQSASqLENBClE0Ql4FyLGe1Ru8tah-hjqc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
