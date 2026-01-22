import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar chaves e alertar em desenvolvimento
if (import.meta.env.DEV && supabaseAnonKey) {
  try {
    // Verificar se é uma chave JWT (contém pontos)
    if (supabaseAnonKey.includes('.')) {
      const payload = JSON.parse(atob(supabaseAnonKey.split('.')[1]));
      if (payload.iss === 'supabase-demo') {
        console.warn('⚠️ ATENÇÃO: Você está usando chaves de DEMONSTRAÇÃO do Supabase (supabase-demo).');
        console.warn('Isso falhará em produção ou acesso via rede. Configure chaves reais no arquivo .env.');
      }
    } else if (supabaseAnonKey.startsWith('sb_')) {
      // Chave em formato opaco/novo (ex: bootstrap ou hosted)
      console.log('ℹ️ Usando chave Supabase em formato opaco (sb_...).');
    }
  } catch (e) {
    console.warn('⚠️ Erro ao analisar chave do Supabase. Verifique se ela está correta.');
  }
}

// Flag indicando se o Supabase está disponível
// Resolver URL relativa (proxy) para absoluta se necessário
const getAbsoluteUrl = (url: string) => {
  if (url?.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${url}`;
  }
  return url;
};

export const isSupabaseAvailable = !!(supabaseUrl && supabaseAnonKey);

// Criar cliente apenas se as variáveis estiverem configuradas
// Caso contrário, criar um cliente mock que não faz nada
export const supabase = isSupabaseAvailable
  ? createClient<Database>(getAbsoluteUrl(supabaseUrl), supabaseAnonKey, {
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

