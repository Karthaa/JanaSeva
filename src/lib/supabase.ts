import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values from user input
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = (): boolean => {
  return !SUPABASE_URL.includes('placeholder') && !SUPABASE_ANON_KEY.includes('placeholder');
};
