// Tipos gerados para o banco de dados Supabase
// Schema: public

export type AccessLevel = 'editor' | 'viewer' | 'locked';
export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Application {
  id: string;
  name: string;
  url: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  is_public: boolean;
  is_active?: boolean;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  user_id: string;
  app_id: string;
  access_level: AccessLevel;
  granted_by: string;
  granted_at: string;
}

// Tipo para app com permissão do usuário (retornado pela RPC hub_get_user_applications)
export interface UserApplication {
  id: string;
  name: string;
  url: string;
  category: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  access_level: AccessLevel;
}

// ============================================
// GRUPOS - Sistema de Permissões por Grupos
// ============================================

export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_by?: string;
  added_at: string;
  // Dados do usuário (quando join)
  user_email?: string;
  user_role?: string;
}

export interface GroupPermission {
  id: string;
  group_id: string;
  app_id: string;
  access_level: AccessLevel;
  granted_by?: string;
  granted_at: string;
  // Dados do app (quando join)
  app_name?: string;
  app_icon?: string;
  app_color?: string;
}

export interface UserAppWithPermission {
  app_id: string;
  app_name: string;
  app_url: string;
  app_description?: string;
  app_icon?: string;
  app_color?: string;
  app_category: string;
  app_is_active: boolean;
  app_display_order: number;
  access_level: AccessLevel;
  permission_source: 'individual' | 'group' | 'default';
}

export interface AppAccessStats {
  total_users: number;
  editors: number;
  viewers: number;
  locked: number;
}

// Tipos para o Supabase Client
export interface Database {
  public: {
    Tables: {
      hub_profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'last_login_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      hub_apps: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Application, 'id' | 'created_at' | 'updated_at'>>;
      };
      hub_app_permissions: {
        Row: Permission;
        Insert: Omit<Permission, 'id' | 'granted_at'>;
        Update: Partial<Omit<Permission, 'id' | 'granted_at'>>;
      };
    };
    Functions: {
      hub_get_user_applications: {
        Args: Record<string, never>;
        Returns: UserApplication[];
      };
    };
  };
}


