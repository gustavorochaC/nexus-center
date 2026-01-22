-- Seed inicial para hub_profiles e hub_app_permissions
-- Este script popula as tabelas com dados iniciais necessários

-- 1. Inserir perfil admin (vaccontatos@hotmail.com)
-- UUID real obtido de auth.users
INSERT INTO public.hub_profiles (id, email, role, created_at, updated_at)
VALUES (
  '0d5b446b-aa6c-498e-b44d-f64e40f54c38'::uuid,
  'vaccontatos@hotmail.com',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- 2. Criar permissões para o admin em todas as aplicações
-- Buscar todas as aplicações e dar acesso 'editor' ao admin
INSERT INTO public.hub_app_permissions (user_id, app_id, access_level, granted_by, granted_at)
SELECT 
  '0d5bd46b-aa6c-498e-b44d-f64e40f54c38'::uuid as user_id,
  id as app_id,
  'editor' as access_level,
  '0d5bd46b-aa6c-498e-b44d-f64e40f54c38'::uuid as granted_by,
  NOW() as granted_at
FROM public.hub_apps
ON CONFLICT (user_id, app_id) DO UPDATE
SET access_level = 'editor', granted_at = NOW();

