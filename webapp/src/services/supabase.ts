import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials are missing!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'установлен' : 'отсутствует');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'установлен' : 'отсутствует');
  throw new Error('Supabase credentials are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Установка пользовательского контекста для RLS
export function setUserContext(telegramId: number) {
  supabase.rpc('set_user_context', { telegram_id: telegramId });
}
