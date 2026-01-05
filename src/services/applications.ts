import { supabase } from '@/lib/supabase';
import type { Application, UserApplication } from '@/types/database';

// Buscar todas as aplicações do usuário com suas permissões
export async function getUserApplications(): Promise<UserApplication[]> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/42f313d9-a83d-4cd9-9e7e-36f72e5ca9c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'applications.ts:6',message:'getUserApplications called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { data, error } = await supabase.rpc('get_user_applications');
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/42f313d9-a83d-4cd9-9e7e-36f72e5ca9c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'applications.ts:9',message:'RPC call completed',data:{hasError:!!error,hasData:!!data,dataLength:data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/42f313d9-a83d-4cd9-9e7e-36f72e5ca9c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'applications.ts:12',message:'RPC error',data:{errorMessage:error.message,errorCode:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Erro ao buscar aplicações:', error);
    throw error;
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/42f313d9-a83d-4cd9-9e7e-36f72e5ca9c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'applications.ts:17',message:'getUserApplications returning',data:{dataLength:data?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return data || [];
}

// Buscar todas as aplicações (admin)
export async function getAllApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .schema('hub')
    .from('applications')
    .select('*')
    .order('display_order');

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
  const { data, error } = await supabase
    .schema('hub')
    .from('applications')
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
  const { data, error } = await supabase
    .schema('hub')
    .from('applications')
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
  const { error } = await supabase
    .schema('hub')
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar aplicação:', error);
    throw error;
  }
}

// Buscar aplicação por ID
export async function getApplicationById(id: string): Promise<Application | null> {
  const { data, error } = await supabase
    .schema('hub')
    .from('applications')
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

