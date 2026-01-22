-- Migration 008: Função RPC para resolver permissões de usuário
-- Combina permissões individuais + de grupo, priorizando individuais

-- ============================================
-- FUNÇÃO: Buscar apps com permissões resolvidas para um usuário
-- ============================================
DROP FUNCTION IF EXISTS public.get_user_apps_with_permissions(UUID);

CREATE OR REPLACE FUNCTION public.get_user_apps_with_permissions(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  app_id UUID,
  app_name TEXT,
  app_url TEXT,
  app_description TEXT,
  app_icon TEXT,
  app_color TEXT,
  app_category TEXT,
  app_is_active BOOLEAN,
  app_display_order INTEGER,
  access_level TEXT,
  permission_source TEXT
) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Buscar role do usuário diretamente
  SELECT p.role INTO user_role
  FROM public.hub_profiles p
  WHERE p.id = target_user_id;
  
  -- Se não encontrou o usuário, retornar vazio
  IF user_role IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  WITH group_perms AS (
    -- Permissões herdadas de grupos (pega o nível mais alto se usuário estiver em múltiplos grupos)
    SELECT 
      gp.app_id AS gp_app_id,
      -- Prioridade: editor > viewer > locked
      CASE 
        WHEN 'editor' = ANY(ARRAY_AGG(gp.access_level)) THEN 'editor'
        WHEN 'viewer' = ANY(ARRAY_AGG(gp.access_level)) THEN 'viewer'
        ELSE 'locked'
      END AS gp_access_level
    FROM public.hub_group_members gm
    JOIN public.hub_group_permissions gp ON gm.group_id = gp.group_id
    WHERE gm.user_id = target_user_id
    GROUP BY gp.app_id
  ),
  individual_perms AS (
    -- Permissões individuais (sobrescrevem as de grupo)
    SELECT 
      ip.app_id AS ip_app_id,
      ip.access_level::TEXT AS ip_access_level
    FROM public.hub_app_permissions ip
    WHERE ip.user_id = target_user_id
  )
  SELECT 
    apps.id AS app_id,
    apps.name::TEXT AS app_name,
    apps.url::TEXT AS app_url,
    ''::TEXT AS app_description,
    'Box'::TEXT AS app_icon,
    '#6366f1'::TEXT AS app_color,
    COALESCE(apps.category, '')::TEXT AS app_category,
    COALESCE(apps.is_public, true) AS app_is_active,
    0 AS app_display_order,
    -- Prioridade: Admin (sempre editor) > Individual > Grupo > Default (locked)
    CASE
      WHEN user_role = 'admin' THEN 'editor'
      ELSE COALESCE(ip.ip_access_level, gp.gp_access_level, 'locked')
    END::TEXT AS access_level,
    CASE
      WHEN user_role = 'admin' THEN 'admin'
      WHEN ip.ip_access_level IS NOT NULL THEN 'individual'
      WHEN gp.gp_access_level IS NOT NULL THEN 'group'
      ELSE 'default'
    END::TEXT AS permission_source
  FROM public.hub_apps apps
  LEFT JOIN group_perms gp ON apps.id = gp.gp_app_id
  LEFT JOIN individual_perms ip ON apps.id = ip.ip_app_id
  WHERE COALESCE(apps.is_public, true) = true
  ORDER BY apps.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Buscar membros de um grupo
-- ============================================
DROP FUNCTION IF EXISTS public.get_group_members(UUID);

CREATE OR REPLACE FUNCTION public.get_group_members(target_group_id UUID)
RETURNS TABLE (
  member_id UUID,
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.id AS member_id,
    gm.user_id,
    p.email::TEXT AS user_email,
    p.role::TEXT AS user_role,
    gm.added_at
  FROM public.hub_group_members gm
  JOIN public.hub_profiles p ON gm.user_id = p.id
  WHERE gm.group_id = target_group_id
  ORDER BY p.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Buscar permissões de um grupo
-- ============================================
DROP FUNCTION IF EXISTS public.get_group_permissions(UUID);

CREATE OR REPLACE FUNCTION public.get_group_permissions(target_group_id UUID)
RETURNS TABLE (
  permission_id UUID,
  app_id UUID,
  app_name TEXT,
  app_icon TEXT,
  app_color TEXT,
  access_level TEXT,
  granted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id AS permission_id,
    gp.app_id,
    apps.name::TEXT AS app_name,
    apps.icon::TEXT AS app_icon,
    apps.color::TEXT AS app_color,
    gp.access_level::TEXT,
    gp.granted_at
  FROM public.hub_group_permissions gp
  JOIN public.hub_apps apps ON gp.app_id = apps.id
  WHERE gp.group_id = target_group_id
  ORDER BY apps.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Estatísticas de um app (quantos usuários têm acesso)
-- ============================================
DROP FUNCTION IF EXISTS public.get_app_access_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_app_access_stats(target_app_id UUID)
RETURNS TABLE (
  total_users INTEGER,
  editors INTEGER,
  viewers INTEGER,
  locked INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH all_permissions AS (
    -- Combina permissões individuais + de grupo
    SELECT DISTINCT ON (user_id)
      COALESCE(ip.user_id, gm.user_id) AS user_id,
      COALESCE(ip.access_level, gp.access_level) AS access_level
    FROM public.hub_profiles p
    LEFT JOIN public.hub_app_permissions ip ON p.id = ip.user_id AND ip.app_id = target_app_id
    LEFT JOIN public.hub_group_members gm ON p.id = gm.user_id
    LEFT JOIN public.hub_group_permissions gp ON gm.group_id = gp.group_id AND gp.app_id = target_app_id
    WHERE ip.app_id IS NOT NULL OR gp.app_id IS NOT NULL
  )
  SELECT 
    COUNT(*)::INTEGER AS total_users,
    COUNT(*) FILTER (WHERE access_level = 'editor')::INTEGER AS editors,
    COUNT(*) FILTER (WHERE access_level = 'viewer')::INTEGER AS viewers,
    COUNT(*) FILTER (WHERE access_level = 'locked')::INTEGER AS locked
  FROM all_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
