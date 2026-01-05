// Tipos gerados para o banco de dados Supabase
// Schema: hub

export type AccessLevel = 'editor' | 'viewer' | 'locked';
export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  port: number;
  base_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  user_id: string;
  application_id: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
}

// Tipo para app com permissão do usuário
export interface UserApplication {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  port: number;
  base_url: string;
  display_order: number;
  access_level: AccessLevel;
}

// Tipos para o Supabase Client
export interface Database {
  hub: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Application, 'id' | 'created_at' | 'updated_at'>>;
      };
      permissions: {
        Row: Permission;
        Insert: Omit<Permission, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Permission, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Functions: {
      get_user_applications: {
        Args: Record<string, never>;
        Returns: UserApplication[];
      };
    };
  };
}

