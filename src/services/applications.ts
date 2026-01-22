import { supabase, isSupabaseAvailable } from '@/lib/supabase';
import type { Application, UserApplication } from '@/types/database';

// Buscar todas as aplicações do usuário (Adaptado para Schema Atual)
export async function getUserApplications(): Promise<UserApplication[]> {
  if (!isSupabaseAvailable) {
    return [];
  }

  // Fallback: Buscar direto da tabela usando fetch nativo
  console.log('Service: Iniciando fetch nativo de hub_apps...');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Garantir URL correta
  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const targetUrl = `${baseUrl}/rest/v1/hub_apps?select=*`;

  console.log(`Service: Fetch URL: ${targetUrl}`);

  try {
    // Configura headers básicos
    const headers: Record<string, string> = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers
    });

    console.log(`Service: Fetch status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Service: Fetch Error Body:', errorText);
      // Se for erro de autorização, pode ser a chave
      if (response.status === 401 || response.status === 400) {
        console.warn('⚠️ ATENÇÃO: Erro de API/Auth. Verifique se a chave VITE_SUPABASE_ANON_KEY é um JWT válido (ey...) e não uma chave opaca (sb_...).');
      }
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Service: Dados recebidos via fetch:', data);

    // Mapear dados do banco (hub_apps) para o formato esperado pela UI (UserApplication)
    return (data || []).map((app: any) => ({
      id: app.id,
      name: app.name,
      description: app.category, // Usar category como descrição por enquanto
      url: app.url,
      base_url: app.url, // Compatibilidade
      category: app.category,

      // Campos que não existem no banco atual (Defaults)
      icon: 'Box',
      icon_name: 'Box',
      color: '#6366f1',
      display_order: 0,
      is_active: app.is_public,
      access_level: 'viewer', // Assumir acesso básico
      port: 80 // Default
    })) as unknown as UserApplication[];
  } catch (error) {
    console.error('Service: FETCH ERROR:', error);
    throw error;
  }
}

// Buscar todas as aplicações (admin)
export async function getAllApplications(): Promise<Application[]> {
  if (!isSupabaseAvailable) {
    return [];
  }

  const { data, error } = await supabase
    .from('hub_apps')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('Erro ao buscar aplicações:', error);
    throw error;
  }

  return data || [];
}

// Criar nova aplicação
export async function createApplication(
  app: Omit<Application, 'id' | 'created_at' | 'updated_at'>
): Promise<Application> {
  if (!isSupabaseAvailable) {
    throw new Error('Supabase não está disponível');
  }

  const { data, error } = await supabase
    .from('hub_apps')
    .insert(app)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar aplicação:', error);
    throw error;
  }

  return data;
}

// Atualizar aplicação
export async function updateApplication(
  id: string,
  updates: Partial<Omit<Application, 'id' | 'created_at' | 'updated_at'>>
): Promise<Application> {
  if (!isSupabaseAvailable) {
    throw new Error('Supabase não está disponível');
  }

  const { data, error } = await supabase
    .from('hub_apps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar aplicação:', error);
    throw error;
  }

  return data;
}

// Deletar aplicação
export async function deleteApplication(id: string): Promise<void> {
  if (!isSupabaseAvailable) {
    throw new Error('Supabase não está disponível');
  }

  const { error } = await supabase
    .from('hub_apps')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar aplicação:', error);
    throw error;
  }
}

// Buscar aplicação por ID
export async function getApplicationById(id: string): Promise<Application | null> {
  if (!isSupabaseAvailable) {
    return null;
  }

  const { data, error } = await supabase
    .from('hub_apps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Erro ao buscar aplicação:', error);
    throw error;
  }

  return data;
}


