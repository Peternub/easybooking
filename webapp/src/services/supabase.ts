import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tvqplvgkzrzxbdspdsix.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cXBsdmdrenJ6eGJkc3Bkc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjM0MDUsImV4cCI6MjA4NjM5OTQwNX0.D4kfNOVDufIXxj-Wl6nAEy9Qn3fifrwhhmgCf4bLyxA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Установка пользовательского контекста для RLS
export function setUserContext(telegramId: number) {
  supabase.rpc('set_user_context', { telegram_id: telegramId });
}
