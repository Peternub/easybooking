import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Установка пользовательского контекста для RLS
export function setUserContext(telegramId: number) {
  supabase.rpc('set_user_context', { telegram_id: telegramId });
}
