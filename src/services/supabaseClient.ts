import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wznkngfafhhmzkfrlczg.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bmtuZ2ZhZmhobXprZnJsY3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODQxNjUsImV4cCI6MjEwMjQ2MDE2NX0.rWbMrYuYwI3nDBe1ynW18j8b2bRB6l3SJS8pSb-Q8mE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);