-- =================================================================
-- Migration 014: Adicionar coluna avatar_url para foto de perfil
-- Permite armazenar URL do avatar (Supabase Storage) no perfil.
-- ROLLBACK: ALTER TABLE hub.profiles DROP COLUMN IF EXISTS avatar_url;
--           (Se public.hub_profiles for tabela: ALTER TABLE public.hub_profiles DROP COLUMN IF EXISTS avatar_url;)
-- =================================================================

-- 1. Adicionar avatar_url em hub.profiles (tabela base; view public.hub_profiles expõe via SELECT *)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hub' AND table_name = 'profiles') THEN
    ALTER TABLE hub.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  END IF;
END $$;

-- 2. Se public.hub_profiles for tabela (não view), adicionar coluna também
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hub_profiles') THEN
    ALTER TABLE public.hub_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  END IF;
END $$;
