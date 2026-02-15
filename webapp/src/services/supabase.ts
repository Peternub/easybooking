import { createClient } from '@supabase/supabase-js';

// Используем переменные окружения с fallback значениями для продакшена
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zbrfwbewauwmmxqsczug.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicmZ3YmV3YXV3bW14cXNjenVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDU1NjEsImV4cCI6MjA4NjcyMTU2MX0.qJaKnVla7xSbR217GRBMyoOoy5OYb_e556l8ITgVfdg';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials are missing!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'установлен' : 'отсутствует');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'установлен' : 'отсутствует');
  throw new Error('Supabase credentials are required');
}

console.log('✅ Supabase инициализирован:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Установка пользовательского контекста для RLS
export function setUserContext(telegramId: number) {
  supabase.rpc('set_user_context', { telegram_id: telegramId });
}
