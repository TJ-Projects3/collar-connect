import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://sucpuwbwjmxkbqcllfrj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1Y3B1d2J3am14a2JxY2xsZnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjgyMDQsImV4cCI6MjA3OTAwNDIwNH0.akhng3iWLO4SZRbErLPLLJN3cf9tsjcGtd5pPfyTh2E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);