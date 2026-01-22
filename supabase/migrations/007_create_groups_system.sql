-- Migration 007: Sistema de Grupos
-- Cria estrutura para gerenciamento de permissões baseado em grupos

-- ============================================
-- TABELA: hub_groups (Grupos de Permissão)
-- ============================================
CREATE TABLE IF NOT EXISTS public.hub_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Cor hex para UI
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: hub_group_members (Membros dos Grupos)
-- Many-to-Many: Users ↔ Groups
-- ============================================
CREATE TABLE IF NOT EXISTS public.hub_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hub_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.hub_profiles(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ============================================
-- TABELA: hub_group_permissions (Permissões do Grupo por App)
-- Define qual nível de acesso o grupo tem para cada app
-- ============================================
CREATE TABLE IF NOT EXISTS public.hub_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hub_groups(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.hub_apps(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL CHECK (access_level IN ('editor', 'viewer', 'locked')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, app_id)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.hub_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.hub_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_group ON public.hub_group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_app ON public.hub_group_permissions(app_id);

-- ============================================
-- HABILITAR RLS
-- ============================================
ALTER TABLE public.hub_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_group_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Apenas admins gerenciam grupos
-- ============================================

-- hub_groups: Admins gerenciam, todos podem ler
CREATE POLICY "all_read_groups" ON public.hub_groups
  FOR SELECT USING (true);

CREATE POLICY "admins_manage_groups" ON public.hub_groups
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- hub_group_members: Admins gerenciam, usuários veem os próprios grupos
CREATE POLICY "users_read_own_memberships" ON public.hub_group_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_memberships" ON public.hub_group_members
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins_manage_memberships" ON public.hub_group_members
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- hub_group_permissions: Admins gerenciam, todos podem ler
CREATE POLICY "all_read_group_permissions" ON public.hub_group_permissions
  FOR SELECT USING (true);

CREATE POLICY "admins_manage_group_permissions" ON public.hub_group_permissions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hub_groups_updated_at ON public.hub_groups;
CREATE TRIGGER update_hub_groups_updated_at
  BEFORE UPDATE ON public.hub_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
