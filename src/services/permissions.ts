import { supabase, isSupabaseAvailable } from '@/lib/supabase';
import type { Permission, AccessLevel, Profile } from '@/types/database';

// Buscar permissões de um usuário
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  if (!isSupabaseAvailable) {
    return [];
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_permissions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar permissões:', error);
    throw error;
  }

  return data || [];
}

// Buscar todas as permissões (admin)
export async function getAllPermissions(): Promise<Permission[]> {
  if (!isSupabaseAvailable) {
    return [];
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_permissions')
    .select('*');

  if (error) {
    console.error('Erro ao buscar permissões:', error);
    throw error;
  }

  return data || [];
}

// Buscar permissões de uma aplicação específica
export async function getApplicationPermissions(applicationId: string): Promise<Permission[]> {
  if (!isSupabaseAvailable) {
    return [];
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_permissions')
    .select('*')
    .eq('application_id', applicationId);

  if (error) {
    console.error('Erro ao buscar permissões:', error);
    throw error;
  }

  return data || [];
}

// Criar ou atualizar permissão
export async function upsertPermission(
  userId: string,
  applicationId: string,
  accessLevel: AccessLevel
): Promise<Permission> {
  if (!isSupabaseAvailable) {
    throw new Error('Supabase não está disponível');
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_permissions')
    .upsert(
      {
        user_id: userId,
        application_id: applicationId,
        access_level: accessLevel,
      },
      {
        onConflict: 'user_id,application_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar permissão:', error);
    throw error;
  }

  return data;
}

// Remover permissão (volta para locked)
export async function removePermission(userId: string, applicationId: string): Promise<void> {
  if (!isSupabaseAvailable) {
    throw new Error('Supabase não está disponível');
  }

  const { error } = await supabase
    .schema('Hub_Flex')
    .from('hub_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('application_id', applicationId);

  if (error) {
    console.error('Erro ao remover permissão:', error);
    throw error;
  }
}

// Buscar todos os perfis (admin)
export async function getAllProfiles(): Promise<Profile[]> {
  if (!isSupabaseAvailable) {
    return [];
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_profiles')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Erro ao buscar perfis:', error);
    throw error;
  }

  return data || [];
}

// Atualizar role do usuário (admin/user)
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<Profile> {
  if (!isSupabaseAvailable) {
    throw new Error('Supabase não está disponível');
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar role:', error);
    throw error;
  }

  return data;
}

// Buscar permissões detalhadas de um usuário com info das aplicações
export async function getUserPermissionsWithApps(userId: string) {
  if (!isSupabaseAvailable) {
    return [];
  }

  const { data, error } = await supabase
    .schema('Hub_Flex')
    .from('hub_permissions')
    .select(`
      *,
      application:hub_applications(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar permissões com apps:', error);
    throw error;
  }

  return data || [];
}

