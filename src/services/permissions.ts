import { supabase, isSupabaseAvailable } from '@/lib/supabase';
import type {
  Permission,
  AccessLevel,
  Profile,
  Group,
  GroupMember,
  GroupPermission,
  UserAppWithPermission,
  AppAccessStats
} from '@/types/database';

// ============================================
// PERMISSÕES INDIVIDUAIS (existentes)
// ============================================

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_app_permissions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar permissões:', error);
    throw error;
  }
  return data || [];
}

export async function getAllPermissions(): Promise<Permission[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_app_permissions')
    .select(`*, app:hub_apps(id, name, description)`);

  if (error) {
    console.error('Service: Erro ao buscar permissões:', error);
    if (error.code === 'PGRST301') return [];
    throw error;
  }
  return data || [];
}

export async function getApplicationPermissions(appId: string): Promise<Permission[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_app_permissions')
    .select('*')
    .eq('app_id', appId);

  if (error) throw error;
  return data || [];
}

export async function upsertPermission(
  userId: string,
  appId: string,
  accessLevel: AccessLevel
): Promise<Permission> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const currentUser = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('hub_app_permissions')
    .upsert({
      user_id: userId,
      app_id: appId,
      access_level: accessLevel,
      granted_by: currentUser?.id || userId,
    }, { onConflict: 'user_id,app_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removePermission(userId: string, appId: string): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { error } = await supabase
    .from('hub_app_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('app_id', appId);

  if (error) throw error;
}

// ============================================
// PERFIS DE USUÁRIO
// ============================================

export async function getAllProfiles(): Promise<Profile[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_profiles')
    .select('*')
    .order('email', { ascending: true });

  if (error) {
    if (error.code === 'PGRST301') return [];
    throw error;
  }
  return data || [];
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<Profile> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { data, error } = await supabase
    .from('hub_profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserPermissionsWithApps(userId: string) {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_app_permissions')
    .select(`*, application:hub_apps(*)`)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

// ============================================
// GRUPOS - CRUD
// ============================================

export async function getAllGroups(): Promise<Group[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_groups')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar grupos:', error);
    throw error;
  }
  return data || [];
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  if (!isSupabaseAvailable) return null;

  const { data, error } = await supabase
    .from('hub_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createGroup(
  name: string,
  description?: string,
  color?: string
): Promise<Group> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const currentUser = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('hub_groups')
    .insert({
      name,
      description,
      color: color || '#3B82F6',
      created_by: currentUser?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar grupo:', error);
    throw error;
  }
  return data;
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'description' | 'color'>>
): Promise<Group> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { data, error } = await supabase
    .from('hub_groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGroup(groupId: string): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { error } = await supabase
    .from('hub_groups')
    .delete()
    .eq('id', groupId);

  if (error) throw error;
}

// ============================================
// MEMBROS DE GRUPO
// ============================================

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase.rpc('get_group_members', {
    target_group_id: groupId
  });

  if (error) {
    console.error('Erro ao buscar membros do grupo:', error);
    throw error;
  }

  return (data || []).map((m: any) => ({
    id: m.member_id,
    group_id: groupId,
    user_id: m.user_id,
    added_at: m.added_at,
    user_email: m.user_email,
    user_role: m.user_role,
    user_full_name: m.user_full_name,
  }));
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase
    .from('hub_group_members')
    .select('group:hub_groups(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((d: any) => d.group).filter(Boolean) || [];
}

export async function addUserToGroup(userId: string, groupId: string): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const currentUser = (await supabase.auth.getUser()).data.user;

  const { error } = await supabase
    .from('hub_group_members')
    .insert({
      user_id: userId,
      group_id: groupId,
      added_by: currentUser?.id,
    });

  if (error) {
    // Se já existe, ignora
    if (error.code === '23505') return;
    throw error;
  }
}

export async function removeUserFromGroup(userId: string, groupId: string): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { error } = await supabase
    .from('hub_group_members')
    .delete()
    .match({ user_id: userId, group_id: groupId });

  if (error) throw error;
}

// ============================================
// PERMISSÕES DE GRUPO
// ============================================

export async function getGroupPermissions(groupId: string): Promise<GroupPermission[]> {
  if (!isSupabaseAvailable) return [];

  const { data, error } = await supabase.rpc('get_group_permissions', {
    target_group_id: groupId
  });

  if (error) {
    console.error('Erro ao buscar permissões do grupo:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    id: p.permission_id,
    group_id: groupId,
    app_id: p.app_id,
    access_level: p.access_level,
    granted_at: p.granted_at,
    app_name: p.app_name,
    app_color: p.app_color,
  }));
}

export async function setGroupPermission(
  groupId: string,
  appId: string,
  accessLevel: AccessLevel
): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const currentUser = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('hub_group_permissions')
    .upsert({
      group_id: groupId,
      app_id: appId,
      access_level: accessLevel,
      granted_by: currentUser?.id,
    }, { 
      onConflict: 'group_id,app_id',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error('Erro ao definir permissão de grupo:', error);
    throw new Error(`Erro ao definir permissão: ${error.message || 'Erro desconhecido'}`);
  }
}

export async function removeGroupPermission(groupId: string, appId: string): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { error } = await supabase
    .from('hub_group_permissions')
    .delete()
    .match({ group_id: groupId, app_id: appId });

  if (error) throw error;
}

// ============================================
// GERENCIAMENTO DE USUÁRIOS
// ============================================

export async function deleteUser(userId: string): Promise<void> {
  if (!isSupabaseAvailable) throw new Error('Supabase não está disponível');

  const { data, error } = await supabase.rpc('delete_user', {
    target_user_id: userId
  });

  if (error) {
    console.error('Erro ao deletar usuário:', error);
    throw new Error(error.message || 'Erro ao deletar usuário');
  }

  // Verificar resposta da função RPC
  if (data && typeof data === 'object' && 'success' in data) {
    const result = data as { success: boolean; error?: string; message?: string };
    if (!result.success) {
      throw new Error(result.error || 'Erro ao deletar usuário');
    }
  }
}

// ============================================
// PERMISSÕES RESOLVIDAS (Grupo + Individual)
// ============================================

export async function getUserAppsWithPermissions(
  userId?: string
): Promise<UserAppWithPermission[]> {
  if (!isSupabaseAvailable) {
    console.log('⚠️ Supabase não disponível');
    return [];
  }

  // userId DEVE ser passado pelo Dashboard/AuthContext
  if (!userId) {
    console.warn('⚠️ userId não fornecido, usando fallback');
    return getFallbackAppsWithPermissions();
  }

  console.log('🔍 getUserAppsWithPermissions para:', userId);

  try {
    const { data, error } = await supabase.rpc('get_user_apps_with_permissions', {
      target_user_id: userId
    });

    if (error) {
      console.error('❌ Erro RPC:', error.code, error.message);
      return getFallbackAppsWithPermissions();
    }

    console.log(`✅ RPC OK! ${data?.length || 0} apps`);
    return data || [];
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return getFallbackAppsWithPermissions();
  }
}





// Fallback: Buscar apps e retornar com access_level "locked" por padrão
async function getFallbackAppsWithPermissions(): Promise<UserAppWithPermission[]> {
  try {
    console.log('📦 Fallback: Buscando apps...');

    // Timeout de 3 segundos para evitar travar
    const queryPromise = supabase
      .from('hub_apps')
      .select('*')
      .order('created_at');

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('FALLBACK_TIMEOUT')), 3000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Erro no fallback:', error);
      return getHardcodedFallback();
    }

    console.log(`✅ Fallback: ${data?.length || 0} apps`);

    return (data || []).map(app => ({
      app_id: app.id,
      app_name: app.name,
      app_url: app.url,
      app_description: app.description,
      app_icon: app.icon,
      app_color: app.color,
      app_category: app.category,
      app_is_active: app.is_active ?? true,
      app_display_order: app.display_order ?? 0,
      access_level: 'locked' as const,
      permission_source: 'default' as const,
    }));
  } catch (err: any) {
    if (err?.message === 'FALLBACK_TIMEOUT') {
      console.warn('⏱️ Fallback timeout (3s). Query travou!');
    } else {
      console.error('❌ Erro crítico:', err);
    }
    return getHardcodedFallback();
  }
}

// Último recurso: retornar lista vazia ou hardcoded
function getHardcodedFallback(): UserAppWithPermission[] {
  console.log('🔒 Usando fallback hardcoded (vazio)');
  return [];
}




export async function getAppAccessStats(appId: string): Promise<AppAccessStats | null> {
  if (!isSupabaseAvailable) return null;

  const { data, error } = await supabase.rpc('get_app_access_stats', {
    target_app_id: appId
  });

  if (error) {
    console.error('Erro ao buscar estatísticas do app:', error);
    return null;
  }

  return data?.[0] || null;
}
