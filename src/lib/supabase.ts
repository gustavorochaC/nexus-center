import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Flag indicando se o Supabase está disponível
export const isSupabaseAvailable = !!(supabaseUrl && supabaseAnonKey);

// Criar cliente apenas se as variáveis estiverem configuradas
// Caso contrário, criar um cliente mock que não faz nada
export const supabase = isSupabaseAvailable
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

// Helper para pegar URL completa de uma aplicação
export function getAppUrl(baseUrl: string, port: number): string {
  return `${baseUrl}:${port}`;
}

